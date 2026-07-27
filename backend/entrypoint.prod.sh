#!/bin/sh
# Entrypoint produksi: migrasi, kumpulkan berkas statis, lalu jalankan Gunicorn.
set -e

echo "→ Menjalankan migrasi…"
python manage.py migrate --noinput

echo "→ Mengumpulkan berkas statis…"
python manage.py collectstatic --noinput

# --timeout 120: panggilan Gemini wajar 10-30 detik dan kadang lebih. Default
# Gunicorn 30 detik akan membunuh worker di tengah request yang sebenarnya
# berhasil (PRD §7.4).
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-3}" \
    --timeout 120 \
    --graceful-timeout 30 \
    --access-logfile - \
    --error-logfile -
