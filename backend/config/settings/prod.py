"""Setting produksi. Satu origin lewat Nginx — CORS sengaja tidak diaktifkan."""

from .base import *  # noqa: F403
from .base import env_bool, env_list

DEBUG = False

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost")
CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS")

# Nginx yang memutus TLS; Django perlu tahu request aslinya https.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Tidak ada CORS_ALLOWED_ORIGINS di sini: frontend dan /api satu domain.
CORS_ALLOWED_ORIGINS: list[str] = []
