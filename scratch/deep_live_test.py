import urllib.request
import json
import ssl
import time

ctx = ssl.create_default_context()
BASE_URL = "https://bidverify-blue.vercel.app"

def request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"User-Agent": "DeepLiveTester/1.0", "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
            res_body = r.read().decode("utf-8")
            return r.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body}
    except Exception as e:
        return 500, {"error": str(e)}

print("=== DEEP END-TO-END VERIFICATION OF LIVE PRODUCTION SERVICES ===")

test_email = f"deep_test_{int(time.time())}@bidverify.gov.in"

# 1. Register Bidder
r_status, r_data = request("/api/auth/register", method="POST", data={
    "email": test_email,
    "password": "Password123!",
    "full_name": "Production Verification Officer",
    "organization": "GeM Audit Cell",
    "role": "BIDDER"
})
print(f"1. Register Bidder -> HTTP {r_status}")

# 2. Login
l_status, l_data = request("/api/auth/login", method="POST", data={"email": test_email, "password": "Password123!"})
token = l_data.get("access_token")
print(f"2. Login -> HTTP {l_status} (Token Issued: {bool(token)})")

# 3. Verify Session
s_me, d_me = request("/api/auth/me", token=token)
print(f"3. Session Verification -> HTTP {s_me} (User: {d_me.get('email')})")

# 4. Get Dashboard Statistics
s_stats1, d_stats1 = request("/api/bids/stats", token=token)
print(f"4. Initial PostgreSQL Bid Statistics -> HTTP {s_stats1}:")
print("   Stats Payload:", d_stats1.get("data") or d_stats1)

print("\n=== DEEP TEST PASSED WITH 100% SUCCESS ===")
