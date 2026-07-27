"""Tabel dan konstanta aturan yang dipakai bersama beberapa fitur.

Isinya pengetahuan domain yang sebelumnya dititipkan ke model bahasa —
konversi satuan dapur, kategori bahan, ambang batas status menu — sekarang
ditulis eksplisit supaya hasilnya sama setiap kali dan bisa ditinjau orang.

Logika tiap fitur tetap tinggal di apps/optimizer/features/<fitur>.py, satu
modul per fitur (CLAUDE.md §4). Di sini hanya yang benar-benar dipakai bersama.
"""
