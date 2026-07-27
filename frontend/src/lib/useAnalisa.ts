"use client";

import { useCallback, useState } from "react";

import { apiPost, pesanError } from "@/lib/api";

/**
 * Satu hook untuk seluruh 10 tab: kirim form, tunggu, tampilkan hasil.
 *
 * Dibuat sekali di sini supaya tiap tab tidak menulis ulang penanganan
 * menunggu/gagal — dan supaya perilakunya konsisten: sekali klik, tombol
 * terkunci sampai selesai. Klik ganda pada panggilan AI berarti dua panggilan
 * berbayar untuk satu jawaban.
 */
export function useAnalisa<TResponse, TRequest>(path: string) {
  const [hasil, setHasil] = useState<TResponse | null>(null);
  const [sedangJalan, setSedangJalan] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const jalankan = useCallback(
    async (body: TRequest) => {
      if (sedangJalan) return;

      setSedangJalan(true);
      setGalat(null);
      try {
        setHasil(await apiPost<TResponse, TRequest>(path, body));
      } catch (error) {
        // Pesan datang dari backend apa adanya; frontend tidak mengarang.
        setGalat(pesanError(error));
        setHasil(null);
      } finally {
        setSedangJalan(false);
      }
    },
    [path, sedangJalan],
  );

  return { hasil, sedangJalan, galat, jalankan };
}
