"""Explicit password reset for an existing admin; no startup side effects."""
import argparse
from getpass import getpass
from app.core.security import get_password_hash, validate_password_strength
from app.db.database import SessionLocal
from app.models.user import User


def main():
    parser = argparse.ArgumentParser(description="Reset an existing administrator password.")
    parser.add_argument("--email", required=True, help="Exact email of the existing admin")
    args = parser.parse_args()
    password = getpass("New administrator password: ")
    if not validate_password_strength(password) or password in {"Admin@123", "AdminPassword123"}:
        parser.error("Use a non-default password with at least 8 characters, uppercase, lowercase and a number.")
    if password != getpass("Repeat new password: "):
        parser.error("Passwords do not match.")
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == args.email.strip().lower(), User.role == "ADMIN").first()
        if user is None:
            parser.error("No administrator exists with that email. No accounts changed.")
        user.password_hash = get_password_hash(password)
        db.commit()
    print("Administrator password updated. Existing JWT sessions expire at their normal expiry time.")


if __name__ == "__main__":
    main()
