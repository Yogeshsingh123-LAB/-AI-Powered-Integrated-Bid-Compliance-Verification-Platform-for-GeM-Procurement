"""
Backend-enforced authentication rate limiting.

Replaces the previous client-side CAPTCHA (which could be read from the page or
bypassed by calling the API directly) with server-side protections:

- per-IP sliding-window throttle on /auth/login and /auth/register
- per-email progressive lockout after repeated failed logins
- audit of throttled / locked-out attempts

Note: state is kept in process memory. On multi-instance deployments this
still raises the cost of automated attacks substantially; for hard
anti-bot guarantees combine with a CDN/WAF rate-limit rule in front.
"""
import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, Request

from app.core.config import settings


class RateLimiter:
    """Thread-safe sliding-window counter + failure lockout tracker."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        # ip -> deque of timestamps
        self._ip_hits: Dict[str, Deque[float]] = defaultdict(deque)
        # email(lower) -> (deque of failure timestamps, lockout_until)
        self._email_failures: Dict[str, Tuple[Deque[float], float]] = defaultdict(lambda: (deque(), 0.0))

    # ---------- per-IP throttle ----------
    def check_ip(self, request: Request, kind: str = "login") -> None:
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = settings.LOGIN_WINDOW_SECONDS
        limit = settings.LOGIN_MAX_ATTEMPTS_PER_IP
        with self._lock:
            bucket = self._ip_hits[ip]
            while bucket and now - bucket[0] > window:
                bucket.popleft()
            if len(bucket) >= limit:
                raise HTTPException(
                    status_code=429,
                    detail="Too many authentication attempts from this network. Please try again later.",
                    headers={"Retry-After": str(int(window - (now - bucket[0])) if bucket else str(window))},
                )
            bucket.append(now)

    # ---------- per-email lockout ----------
    def check_email_locked(self, email: str) -> None:
        clean = (email or "").strip().lower()
        if not clean:
            return
        now = time.time()
        with self._lock:
            failures, lockout_until = self._email_failures[clean]
            if lockout_until > now:
                remaining = int(lockout_until - now) + 1
                raise HTTPException(
                    status_code=429,
                    detail=f"Account temporarily locked after repeated failed sign-in attempts. Try again in {remaining} seconds.",
                    headers={"Retry-After": str(remaining)},
                )

    def record_failure(self, email: str) -> None:
        clean = (email or "").strip().lower()
        if not clean:
            return
        now = time.time()
        window = settings.LOGIN_LOCKOUT_MINUTES * 60
        with self._lock:
            failures, _ = self._email_failures[clean]
            failures.append(now)
            while failures and now - failures[0] > window:
                failures.popleft()
            if len(failures) >= settings.LOGIN_MAX_FAILURES_PER_EMAIL:
                self._email_failures[clean] = (failures, now + settings.LOGIN_LOCKOUT_MINUTES * 60)

    def record_success(self, email: str) -> None:
        clean = (email or "").strip().lower()
        if not clean:
            return
        with self._lock:
            self._email_failures.pop(clean, None)

    def _prune_locked(self, now: float) -> None:
        expired = [k for k, (_, until) in self._email_failures.items() if until and until <= now]
        for k in expired:
            self._email_failures.pop(k, None)


# Singleton for the process
login_limiter = RateLimiter()
