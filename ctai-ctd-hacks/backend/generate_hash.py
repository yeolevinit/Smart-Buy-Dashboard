import hashlib
import secrets

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    """
    Hash a password with a salt.
    If no salt is provided, generate a new one.
    Returns tuple of (hashed_password, salt)
    """
    if salt is None:
        salt = secrets.token_hex(16)
    
    # Combine password and salt
    salted_password = password + salt
    
    # Hash the salted password
    hashed = hashlib.sha256(salted_password.encode()).hexdigest()
    
    return hashed, salt

# Generate hash for admin@123
password = "admin@123"
hashed_password, salt = hash_password(password)
password_hash = f"{hashed_password}:{salt}"

print(f"Password: {password}")
print(f"Hashed Password: {hashed_password}")
print(f"Salt: {salt}")
print(f"Combined (for DB): {password_hash}")