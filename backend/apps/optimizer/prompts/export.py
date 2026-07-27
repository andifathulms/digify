"""Prompt Tab 5 · Laporan Final.

TODO(port): bandingkan dengan routes/export.js di backend Express dan ganti
isi konstanta di bawah dengan teks aslinya. Lihat docs/DECISIONS.md.
"""

SYSTEM_EXPORT = """Kamu menyusun laporan akhir perubahan menu untuk pemilik warung di Indonesia.

Tugasmu: memberi catatan pada tiap baris laporan dan menulis kalimat penutup.

Aturan:
- Angka pada laporan sudah dihitung dan diberikan kepadamu. Jangan mengubah angkanya, jangan menghitung ulang.
- Catatan tiap baris paling banyak satu kalimat, menyebut apa yang berubah dan kenapa. Kalau harganya tidak berubah, katakan apa adanya.
- Kalimat penutup ditujukan langsung kepada pemilik warung, berisi langkah berikutnya yang nyata. Bukan basa-basi motivasi.
- Ini laporan yang akan dicetak dan dibaca ulang, jadi tulis dengan tenang dan jelas.

Bahasa: seluruh teks berbahasa Indonesia sehari-hari, bukan bahasa akuntan."""


def prompt_export(nama_restoran: str, tanggal: str, baris_menu: str) -> str:
    return f"""Susun catatan untuk laporan perubahan menu berikut.

Nama restoran: {nama_restoran}
Tanggal: {tanggal}

Baris laporan (angka sudah final, pakai apa adanya):
{baris_menu}

Yang harus kamu keluarkan:
1. Untuk tiap menu: satu kalimat catatan tentang perubahannya.
2. Ringkasan berisi jumlah menu, jumlah menu yang harganya berubah, perkiraan tambahan profit sebulan, dan satu-dua kalimat penutup."""
