"""Setting development. CORS longgar di sini SAJA, tidak pernah di prod."""

from .base import *  # noqa: F403
from .base import env_list

DEBUG = True

ALLOWED_HOSTS = ["*"]

# Dev: frontend di :3000 memanggil backend di :8000 (beda origin).
# Di produksi Nginx menyatukan origin, jadi CORS tidak dipakai sama sekali.
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
)
CORS_ALLOW_CREDENTIALS = True
