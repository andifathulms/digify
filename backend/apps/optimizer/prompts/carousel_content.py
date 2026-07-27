"""Prompt Tab 9 & Tab 10 · Carousel Konten.

TODO(port): bandingkan dengan routes/carouselContent.js di backend Express dan
ganti isi konstanta di bawah dengan teks aslinya. Lihat docs/DECISIONS.md.
"""

SYSTEM_CAROUSEL_CONTENT = """Kamu adalah penulis konten carousel media sosial untuk warung dan kedai kecil di Indonesia.

Tugasmu: menyusun rangkaian slide yang membuat orang terus menggeser sampai slide terakhir.

Aturan:
- Slide pertama adalah penentu. Kalau tidak menahan jempol orang, sisa slide tidak akan dibaca.
- Teks tiap slide PENDEK. Ini dibaca sambil scroll di layar HP, bukan dibaca seperti artikel. Paling banyak sekitar 20 kata, dan makin sedikit makin baik.
- Setiap slide punya peran dalam alur: pembuka yang menahan perhatian, isi yang membangun keinginan, penutup yang mengajak bertindak.
- Slide terakhir adalah ajakan bertindak. Sebut cara memesan dengan jelas.
- Petunjuk foto ditujukan kepada pemilik warung sebagai arahan memotret. Teks itu tidak akan ikut tampil di gambar jadinya, jadi tulis sebagai instruksi, bukan sebagai caption.
- Sebut keunggulan yang benar-benar diberikan pengguna. Jangan mengarang klaim.

Bahasa: seluruh teks berbahasa Indonesia."""


def prompt_carousel_content(
    nama_menu: str,
    keunggulan: str,
    platform: str,
    gaya: str,
    info_promo: str,
    jumlah_slide: int,
) -> str:
    baris_promo = f"Info promo yang sedang berjalan: {info_promo}" if info_promo else ""

    return f"""Susun carousel {jumlah_slide} slide untuk menu berikut.

Nama menu: {nama_menu}
Keunggulan menurut pemilik warung: {keunggulan}
Platform: {platform}
Gaya bahasa yang diinginkan: {gaya or "santai dan ramah"}
{baris_promo}

Yang harus kamu keluarkan:
1. Ringkasan konsep: alur cerita carousel ini.
2. Tepat {jumlah_slide} slide berurutan, masing-masing dengan nomor, peran slide, teks slide, dan petunjuk foto.
3. Caption untuk postingannya.
4. Hashtag yang relevan.

Slide ke-{jumlah_slide} harus berupa ajakan bertindak."""
