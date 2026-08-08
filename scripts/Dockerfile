# Backup Postgres harian, dengan skripnya dijahit ke dalam image.
#
# Pakai image postgres yang sama dengan database supaya versi pg_dump-nya
# pasti cocok. pg_dump versi lebih tua menolak membaca server yang lebih baru.
FROM postgres:16-alpine

COPY backup.sh /backup.sh
RUN chmod +x /backup.sh

ENTRYPOINT ["/bin/sh", "/backup.sh"]
