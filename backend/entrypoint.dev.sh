#!/bin/sh
# Entrypoint development: tunggu database, jalankan migrasi, lalu runserver.
set -e

echo "→ Menunggu database…"
python - <<'PY'
import os, socket, time

host = os.environ.get("POSTGRES_HOST", "db")
port = int(os.environ.get("POSTGRES_PORT", "5432"))
for _ in range(60):
    try:
        with socket.create_connection((host, port), timeout=2):
            break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit(f"Database {host}:{port} tidak merespons.")
PY

echo "→ Menjalankan migrasi…"
python manage.py migrate --noinput

echo "→ Backend siap di :8000"
exec python manage.py runserver 0.0.0.0:8000
