"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiPost, pesanError } from "@/lib/api";

/**
 * Satu hook untuk seluruh 10 tab: kirim form, tunggu, tampilkan hasil.
 *
 * Dibuat sekali di sini supaya tiap tab tidak menulis ulang penanganan
 * menunggu/gagal — dan supaya perilakunya konsisten: sekali klik, tombol
 * terkunci sampai selesai. Klik ganda pada panggilan AI berarti dua panggilan
 * berbayar untuk satu jawaban.
 */

/**
 * Kerangka pemuatan baru muncul setelah jeda ini.
 *
 * Sejak Tab 1–6 dihitung aturan sendiri (DECISIONS, 28 Juli), keenamnya
 * selesai di bawah seperempat detik. Kerangka yang muncul lalu hilang dalam
 * 200 milidetik tidak terbaca sebagai "sedang bekerja" — terbacanya sebagai
 * layar berkedip, dan kedipan pada halaman berisi angka uang membuat orang
 * bertanya-tanya apakah hasilnya berubah. Tab AI (7–10) makan 10–30 detik,
 * jadi di sana kerangkanya tetap muncul seperti biasa.
 *
 * 300ms: di bawah itu masih terasa seketika, di atas itu orang mulai ragu
 * apakah ketukannya masuk. Tombolnya sendiri terkunci SEKETIKA — penguncian
 * tidak pernah ikut ditunda, karena justru itu yang mencegah klik ganda.
 */
const JEDA_KERANGKA_MS = 300;

export function useAnalisa<TResponse, TRequest>(path: string) {
  const [hasil, setHasil] = useState<TResponse | null>(null);
  const [sedangJalan, setSedangJalan] = useState(false);
  const [tampilkanTunggu, setTampilkanTunggu] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const pewaktu = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kalau komponennya dilepas saat permintaan masih jalan, pewaktunya harus
  // ikut mati — kalau tidak, ia menyalakan state pada komponen yang sudah
  // tidak ada.
  useEffect(() => {
    return () => {
      if (pewaktu.current) clearTimeout(pewaktu.current);
    };
  }, []);

  const jalankan = useCallback(
    async (body: TRequest) => {
      if (sedangJalan) return;

      setSedangJalan(true);
      setGalat(null);
      pewaktu.current = setTimeout(() => setTampilkanTunggu(true), JEDA_KERANGKA_MS);

      try {
        setHasil(await apiPost<TResponse, TRequest>(path, body));
      } catch (error) {
        // Pesan datang dari backend apa adanya; frontend tidak mengarang.
        setGalat(pesanError(error));
        setHasil(null);
      } finally {
        if (pewaktu.current) clearTimeout(pewaktu.current);
        pewaktu.current = null;
        setTampilkanTunggu(false);
        setSedangJalan(false);
      }
    },
    [path, sedangJalan],
  );

  return {
    hasil,
    /** Permintaan sedang jalan. Untuk mengunci tombol — berlaku SEKETIKA. */
    sedangJalan,
    /** Sudah cukup lama untuk pantas menampilkan kerangka pemuatan. */
    tampilkanTunggu,
    galat,
    jalankan,
  };
}
