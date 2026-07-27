#!/bin/sh
# Backup Postgres harian.
#
# Backup yang belum pernah diuji restore sama saja dengan tidak punya backup.
# Cara mengujinya ada di README, dan itu WAJIB dilakukan sekali sebelum
# produk dijual ke publik (PRD §10).
set -e

SIMPAN_HARI="${SIMPAN_BACKUP_HARI:-14}"

while true; do
    STEMPEL=$(date +%Y-%m-%d_%H%M)
    BERKAS="/backups/digify-${STEMPEL}.sql.gz"

    echo "[$(date)] Membuat backup ${BERKAS}"
    if pg_dump --no-owner --no-acl | gzip > "${BERKAS}.sedang"; then
        mv "${BERKAS}.sedang" "${BERKAS}"
        echo "[$(date)] Backup selesai: $(du -h "${BERKAS}" | cut -f1)"
    else
        # Jangan tinggalkan berkas separuh jadi; itu terlihat seperti backup
        # yang berhasil padahal tidak bisa di-restore.
        rm -f "${BERKAS}.sedang"
        echo "[$(date)] BACKUP GAGAL" >&2
    fi

    echo "[$(date)] Menghapus backup lebih tua dari ${SIMPAN_HARI} hari"
    find /backups -name 'digify-*.sql.gz' -mtime "+${SIMPAN_HARI}" -delete || true

    sleep 86400
done
