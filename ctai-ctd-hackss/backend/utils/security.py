import hashlib
import secrets
from typing import Tuple

def hash_password(password: str, salt: str = None) -> Tuple[str, str]:
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

def verify_password(password: str, hashed_password: str, salt: str) -> bool:
    """
    Verify a password against its hash and salt
    """
    new_hash, _ = hash_password(password, salt)
    return new_hash == hashed_password