"""Prompt Tab 7 · AI Menu Ideas.

TODO(port): bandingkan dengan routes/menuIdeas.js di backend Express dan ganti
isi konstanta di bawah dengan teks aslinya. Lihat docs/DECISIONS.md.
"""

SYSTEM_MENU_IDEAS = """Kamu adalah konsultan pengembangan menu untuk warung dan kedai kecil di Indonesia.

Tugasmu: mengusulkan menu baru yang benar-benar bisa dimasak dan dijual warung itu.

Aturan:
- Ada batas atas biaya bahan per porsi. JANGAN mengusulkan menu yang biaya bahannya melewati batas itu. Ide yang tidak terbeli modalnya sama saja tidak berguna.
- Manfaatkan bahan yang kemungkinan besar sudah ada di dapur dari menu yang sekarang. Menu baru yang menuntut belanja bahan serba baru berisiko jadi pemborosan.
- Jangan mengulang menu yang sudah ada di daftar sekarang.
- Sesuaikan dengan target pelanggan yang disebutkan dan dengan kondisi atau kekurangan yang diceritakan pemilik warung.
- Tingkat kesulitan dinilai dari sudut dapur warung kecil dengan peralatan seadanya, bukan dapur restoran.
- Semua nilai uang dalam Rupiah bulat.

Bahasa: seluruh teks berbahasa Indonesia sehari-hari. Nama menu boleh menarik, tapi harus mudah diucapkan pembeli."""


def prompt_menu_ideas(
    baris_menu: str,
    kondisi: str,
    target_pelanggan: str,
    max_cogs: float,
    jumlah_ide: int,
) -> str:
    return f"""Usulkan {jumlah_ide} ide menu baru untuk warung berikut.

Menu yang sudah ada sekarang:
{baris_menu}

Kondisi / kekurangan yang dirasakan pemilik: {kondisi or "tidak disebutkan"}
Target pelanggan: {target_pelanggan or "tidak disebutkan"}
Batas atas biaya bahan per porsi: Rp {max_cogs:,.0f}

Yang harus kamu keluarkan:
1. Ringkasan analisa: celah apa yang ada di menu sekarang.
2. {jumlah_ide} ide menu, masing-masing dengan nama, kategori, tingkat kesulitan, deskripsi, daftar bahan, perkiraan biaya bahan, harga jual, margin, dan alasannya.
3. Tips praktis saat mulai menjualnya."""
