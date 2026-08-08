"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * State form yang hidup di URL, bukan cuma di komponen.
 *
 * Sebelum ini, isian yang sudah diisi hilang begitu halaman dimuat ulang, dan
 * tidak ada cara mengirim hitungan ke orang lain selain menyuruh dia mengetik
 * ulang seluruh angkanya. Untuk alat yang dipakai bergantian antara pemilik
 * dan pasangannya, itu berarti tiap orang mulai dari nol.
 *
 * ── Kenapa `history.replaceState`, bukan `useSearchParams` ─────────────────
 * `useSearchParams()` memaksa halaman punya batas <Suspense> saat dirender
 * statis, dan tiap perubahannya menjalankan ulang router Next. Untuk isian
 * form yang berubah tiap ketukan tombol, itu mahal dan tidak ada gunanya —
 * yang dibutuhkan cuma alamat di bilah browser ikut berubah. `replaceState`
 * melakukan persis itu, tanpa menyentuh router dan tanpa menumpuk riwayat
 * (kalau memakai `pushState`, tombol "kembali" harus ditekan sekali per
 * huruf yang diketik).
 *
 * ── Kenapa dibaca di useEffect, bukan saat render ──────────────────────────
 * Render pertama di server tidak tahu isi URL milik browser. Membacanya saat
 * render membuat HTML server dan HTML klien berbeda, dan React membuang
 * seluruh pohonnya. Jadi nilai awal selalu contoh bawaan, lalu ditimpa sekali
 * setelah terpasang.
 *
 * ── Yang TIDAK boleh masuk sini ────────────────────────────────────────────
 * Kata sandi, token, dan apa pun dari form masuk. URL tercatat di riwayat
 * browser dan ikut terkirim saat ditempel ke mana pun.
 */

/** Jeda sebelum URL ditulis ulang, supaya mengetik tidak menulis tiap huruf. */
const JEDA_TULIS_MS = 250;

function baca(kunci: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(kunci);
}

function tulis(kunci: string, nilai: string | null): void {
  if (typeof window === "undefined") return;
  // Dibaca ulang dari alamat saat ini, bukan dari salinan — beberapa isian
  // menulis ke URL yang sama, dan menyalin di awal berarti yang menulis
  // belakangan menghapus punya yang lain.
  const params = new URLSearchParams(window.location.search);
  if (nilai === null || nilai === "") params.delete(kunci);
  else params.set(kunci, nilai);

  const cari = params.toString();
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${cari ? `?${cari}` : ""}${window.location.hash}`,
  );
}

/**
 * @param kunci   nama parameter di URL
 * @param awal    nilai bawaan (contoh yang sudah terisi)
 * @param periksa dipanggil untuk nilai dari URL; kembalikan null kalau
 *                bentuknya tidak sesuai, dan nilai bawaan yang dipakai.
 *                Ini yang menjaga URL karangan orang tidak bisa menyuntikkan
 *                bentuk data yang tidak diharapkan ke dalam form.
 */
export function useUrlState<T>(
  kunci: string,
  awal: T,
  periksa?: (nilai: unknown) => T | null,
): [T, (nilai: T) => void] {
  const [nilai, setNilai] = useState<T>(awal);
  const pewaktu = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teks = typeof awal === "string";

  useEffect(() => {
    const dariUrl = baca(kunci);
    if (dariUrl === null) return;

    if (teks) {
      setNilai(dariUrl as T);
      return;
    }

    try {
      const terurai: unknown = JSON.parse(dariUrl);
      const sah = periksa ? periksa(terurai) : (terurai as T);
      if (sah !== null && sah !== undefined) setNilai(sah);
    } catch {
      // URL rusak atau dikarang. Diamkan dan pakai contoh bawaan — memunculkan
      // pesan error untuk alamat yang salah ketik cuma menakuti tanpa memberi
      // pemakainya sesuatu yang bisa dikerjakan.
    }
    // Sengaja hanya sekali saat terpasang: sesudah itu komponen yang jadi
    // sumber kebenaran, dan membaca ulang akan menimpa ketikan yang sedang
    // berjalan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci]);

  useEffect(() => {
    return () => {
      if (pewaktu.current) clearTimeout(pewaktu.current);
    };
  }, []);

  const ubah = useCallback(
    (baru: T) => {
      setNilai(baru);
      if (pewaktu.current) clearTimeout(pewaktu.current);
      pewaktu.current = setTimeout(() => {
        tulis(kunci, typeof baru === "string" ? baru : JSON.stringify(baru));
      }, JEDA_TULIS_MS);
    },
    [kunci],
  );

  return [nilai, ubah];
}

/** Pemeriksa bentuk untuk isian angka. */
export function angkaSah(nilai: unknown): number | null {
  return typeof nilai === "number" && Number.isFinite(nilai) ? nilai : null;
}

/**
 * Pemeriksa bentuk untuk daftar baris menu/bahan.
 *
 * Hanya memastikan bentuknya larik berisi objek dengan kunci yang diharapkan
 * bertipe benar. Tidak menyentuh nilainya — membetulkan angka yang "kelihatan
 * salah" di sini berarti hitungan berikutnya memakai angka yang tidak pernah
 * diketik siapa pun.
 */
export function daftarSah<T extends object>(contoh: T) {
  const kunci = Object.keys(contoh) as (keyof T)[];
  const tipe = Object.fromEntries(kunci.map((k) => [k, typeof contoh[k]]));

  return (nilai: unknown): T[] | null => {
    if (!Array.isArray(nilai)) return null;

    const bersih: T[] = [];
    for (const baris of nilai) {
      if (typeof baris !== "object" || baris === null) return null;

      // Disusun ulang dari kunci yang dikenal saja, bukan dipakai apa adanya.
      // Kalau objek dari URL diteruskan bulat-bulat, kunci asing ikut masuk ke
      // state lalu ikut terkirim ke API. Backend memang mengabaikannya, tapi
      // artinya bentuk data di frontend tidak lagi persis seperti tipenya —
      // dan "persis seperti tipenya" itulah satu-satunya jaminan di sini.
      const hasil = {} as Record<string, unknown>;
      for (const k of kunci) {
        const isi = (baris as Record<string, unknown>)[k as string];
        if (typeof isi !== tipe[k as string]) return null;
        hasil[k as string] = isi;
      }
      bersih.push(hasil as T);
    }
    return bersih;
  };
}
