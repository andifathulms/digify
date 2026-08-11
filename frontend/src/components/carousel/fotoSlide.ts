"use client";

import { useCallback, useState } from "react";

import { bacaFotoSebagaiDataUrl } from "@/components/carousel/unduh";

/**
 * Foto per slide — satu sumber kebenaran untuk Tab 10.
 *
 * Sebelumnya keadaan ini hidup di dalam PapanCarousel, yang baru muncul
 * SETELAH slide selesai dibuat. Akibatnya kemampuan memakai foto sendiri —
 * satu-satunya hal yang membuat slide terasa milik warungnya — hanya bisa
 * ditemukan oleh orang yang sudah menunggu 10-30 detik sampai selesai. Yang
 * sedang menimbang-nimbang produknya tidak pernah sampai ke sana, lalu
 * menyimpulkan fotonya dibuatkan mesin.
 *
 * Sekarang keadaannya dimiliki halaman, jadi foto bisa dipilih sebelum
 * tombol ditekan dan tetap terpasang saat slide-nya jadi.
 */

/** Peta nomor slide → foto sebagai data URL. */
export type PetaFoto = Record<number, string>;

const PESAN_GAGAL_BACA = "Foto itu tidak bisa dibaca. Coba pilih foto lain.";

export function useFotoSlide() {
  const [foto, setFoto] = useState<PetaFoto>({});
  const [galat, setGalat] = useState<string | null>(null);

  /** Pasang satu foto ke satu slide, mengganti yang sudah ada. */
  const pilihFoto = useCallback(async (nomor: number, berkas: File | undefined) => {
    if (!berkas) return;
    setGalat(null);
    try {
      const dataUrl = await bacaFotoSebagaiDataUrl(berkas);
      setFoto((sebelumnya) => ({ ...sebelumnya, [nomor]: dataUrl }));
    } catch {
      setGalat(PESAN_GAGAL_BACA);
    }
  }, []);

  /**
   * Pasang beberapa foto sekaligus ke slot yang MASIH KOSONG, berurutan.
   *
   * Mengisi slot kosong, bukan menimpa dari slide 1: orang yang sudah memberi
   * foto slide 1 lalu memilih satu foto lagi jelas memaksudkannya untuk slide
   * berikutnya. Menimpa dari depan akan menghapus pekerjaannya tanpa diminta.
   */
  const isiSlotKosong = useCallback(
    async (berkasTerpilih: FileList | null, jumlahSlide: number) => {
      if (!berkasTerpilih || berkasTerpilih.length === 0) return;
      setGalat(null);

      const berkas = Array.from(berkasTerpilih);
      let adaYangGagal = false;

      // Dibaca dulu semuanya, baru dipasang sekali — supaya urutan slot tidak
      // bergantung pada foto mana yang kebetulan selesai dibaca lebih dulu.
      const terbaca: string[] = [];
      for (const satu of berkas) {
        try {
          terbaca.push(await bacaFotoSebagaiDataUrl(satu));
        } catch {
          adaYangGagal = true;
        }
      }

      setFoto((sebelumnya) => {
        const berikutnya = { ...sebelumnya };
        let indeks = 0;
        for (let nomor = 1; nomor <= jumlahSlide && indeks < terbaca.length; nomor += 1) {
          if (berikutnya[nomor]) continue;
          const berikut = terbaca[indeks];
          if (berikut) berikutnya[nomor] = berikut;
          indeks += 1;
        }
        return berikutnya;
      });

      if (adaYangGagal) setGalat(PESAN_GAGAL_BACA);
    },
    [],
  );

  const hapusFoto = useCallback((nomor: number) => {
    setGalat(null);
    setFoto((sebelumnya) => {
      const berikutnya = { ...sebelumnya };
      delete berikutnya[nomor];
      return berikutnya;
    });
  }, []);

  return { foto, galat, setGalat, pilihFoto, isiSlotKosong, hapusFoto };
}
