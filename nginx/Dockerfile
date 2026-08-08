# Nginx dengan konfigurasi Digify sudah dijahit ke dalam image.
#
# Kenapa tidak di-bind mount seperti docker-compose.prod.yml: supaya server
# produksi tidak perlu menyimpan salinan repo sama sekali. Cukup satu
# docker-compose.yml dan satu .env.
FROM nginx:1.27-alpine

COPY digify.conf /etc/nginx/conf.d/default.conf
COPY snippets/ /etc/nginx/snippets/

# Sertifikat sementara yang ditandatangani sendiri.
#
# Ini memecahkan telur-dan-ayam: digify.conf menunjuk ke fullchain.pem, dan
# Nginx menolak start kalau berkas itu tidak ada — padahal certbot butuh Nginx
# hidup di port 80 untuk memverifikasi domain. Dengan sertifikat bohongan ini
# Nginx bisa start, certbot menerbitkan yang asli, lalu menimpanya.
#
# Docker mengisi volume kosong dengan isi image, jadi berkas ini otomatis
# muncul di volume `certs` saat pertama kali dijalankan, dan TIDAK menimpa
# sertifikat asli pada start-start berikutnya.
RUN apk add --no-cache openssl \
    && mkdir -p /etc/nginx/certs \
    && openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
        -subj "/CN=digify-sementara" \
        -keyout /etc/nginx/certs/privkey.pem \
        -out   /etc/nginx/certs/fullchain.pem \
    && apk del openssl
