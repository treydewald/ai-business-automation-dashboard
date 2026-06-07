from cryptography.fernet import Fernet
import os
import json
from typing import Any, Dict


class EncryptionService:
    def __init__(self):
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            key = Fernet.generate_key().decode()
            print(f"[WARN] No ENCRYPTION_KEY found. Generated: {key}")
        self.cipher = Fernet(key.encode() if isinstance(key, str) else key)

    def encrypt(self, data: Dict[str, Any]) -> str:
        json_str = json.dumps(data)
        encrypted = self.cipher.encrypt(json_str.encode())
        return encrypted.decode()

    def decrypt(self, encrypted_str: str) -> Dict[str, Any]:
        decrypted = self.cipher.decrypt(encrypted_str.encode())
        return json.loads(decrypted.decode())


_encryption_service = None


def get_encryption_service() -> EncryptionService:
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service
