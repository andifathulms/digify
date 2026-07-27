"use client";

import { useCallback, useEffect, useState } from "react";

import { apiGet, apiPut, pesanError } from "@/lib/api";

/**
 * Satu daftar menu yang dipakai bersama Tab 3, 4, 5, dan 7.
 *
 * Sebelum ada ini, user harus mengetik ulang seluruh daftar menunya di tiap
 * tab — di layar HP, dengan jempol. Itu titik paling mungkin orang menyerah
 * (PRD §7.3, insight prioritas #1).
 */

export type MenuTersimpan = {
  name: string;
  cogs: number;
  price: number;
  weekly_sales: number;
  status: "GREEN" | "YELLOW" | "RED" | "";
};

type Balasan = { menu: MenuTersimpan[] };

/** Angka datang dari DRF DecimalField sebagai string ("8500"). */
function keAngka(nilai: unknown): number {
  const angka = Number(nilai);
  return Number.isFinite(angka) ? angka : 0;
}

function rapikan(menu: MenuTersimpan[]): MenuTersimpan[] {
  return menu.map((baris) => ({
    name: String(baris.name ?? ""),
    cogs: keAngka(baris.cogs),
    price: keAngka(baris.price),
    weekly_sales: keAngka(baris.weekly_sales),
    status: baris.status ?? "",
  }));
}

export function useMenuTersimpan() {
  const [menu, setMenu] = useState<MenuTersimpan[] | null>(null);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesanSimpan, setPesanSimpan] = useState<string | null>(null);

  useEffect(() => {
    let dibatalkan = false;
    apiGet<Balasan>("/menu")
      .then((data) => {
        if (!dibatalkan) setMenu(rapikan(data.menu));
      })
      .catch(() => {
        // Gagal memuat daftar tersimpan bukan alasan mengunci seluruh tab.
        // Form tetap bisa dipakai dengan data contoh.
        if (!dibatalkan) setMenu([]);
      });
    return () => {
      dibatalkan = true;
    };
  }, []);

  const simpan = useCallback(async (daftar: MenuTersimpan[]) => {
    setSedangSimpan(true);
    setGalat(null);
    setPesanSimpan(null);
    try {
      const bersih = daftar.filter((baris) => baris.name.trim() !== "");
      const data = await apiPut<Balasan, { menu: MenuTersimpan[] }>("/menu", {
        menu: bersih,
      });
      setMenu(rapikan(data.menu));
      setPesanSimpan(
        `Daftar menu tersimpan. Sekarang otomatis terisi di alat Ranking, Optimasi, Laporan, dan Ide Menu.`,
      );
    } catch (error) {
      setGalat(pesanError(error));
    } finally {
      setSedangSimpan(false);
    }
  }, []);

  return { menu, simpan, sedangSimpan, galat, pesanSimpan };
}
