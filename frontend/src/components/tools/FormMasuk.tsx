"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Button from "@/components/ui/Button";
import Kartu from "@/components/ui/Kartu";
import { PesanGagal } from "@/components/ui/Keadaan";

/**
 * Form masuk dan form ganti kata sandi.
 *
 * Keduanya di satu berkas karena memang satu alur: pembeli menerima kata sandi
 * acak lewat email/WhatsApp, masuk, lalu langsung diminta menggantinya.
 */

function Isian({
  label,
  tipe,
  nilai,
  onUbah,
  autoComplete,
}: {
  label: string;
  tipe: "email" | "password";
  nilai: string;
  onUbah: (nilai: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={tipe}
        value={nilai}
        autoComplete={autoComplete}
        onChange={(event) => onUbah(event.target.value)}
        className="w-full px-3 py-2.5 text-base"
        style={{
          minHeight: "var(--tap)",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-sm)",
        }}
      />
    </label>
  );
}

export function FormMasuk() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [sedangKirim, setSedangKirim] = useState(false);

  async function kirim() {
    if (sedangKirim) return;
    setSedangKirim(true);
    setGalat(null);
    try {
      const respons = await fetch("/api/auth/masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, kata_sandi: kataSandi }),
      });
      const data = await respons.json();

      if (!respons.ok) {
        setGalat(data.error ?? "Belum berhasil. Coba ulangi sebentar lagi ya.");
        return;
      }

      // Kata sandi awal dikirim lewat pesan, jadi wajib diganti dulu sebelum
      // masuk ke aplikasi.
      router.push(data.profil?.must_change_password ? "/masuk/ganti-kata-sandi" : "/alat");
      router.refresh();
    } catch {
      setGalat("Koneksi ke server terputus. Periksa internet Anda, lalu coba lagi.");
    } finally {
      setSedangKirim(false);
    }
  }

  return (
    <Kartu
      judul="Masuk ke akun Anda"
      keterangan="Pakai email dan kata sandi yang kami kirim setelah pembayaran."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          kirim();
        }}
      >
        <Isian
          label="Email"
          tipe="email"
          nilai={email}
          onUbah={setEmail}
          autoComplete="email"
        />
        <Isian
          label="Kata sandi"
          tipe="password"
          nilai={kataSandi}
          onUbah={setKataSandi}
          autoComplete="current-password"
        />

        {galat ? <PesanGagal pesan={galat} /> : null}

        <Button type="submit" lebarPenuh nonaktif={sedangKirim}>
          {sedangKirim ? "Sedang masuk…" : "Masuk"}
        </Button>
      </form>

      <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
        Belum menerima kata sandi setelah membayar? Hubungi kami lewat WhatsApp, nanti
        kami kirimkan ulang.
      </p>
    </Kartu>
  );
}

export function FormGantiKataSandi() {
  const router = useRouter();
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [ulangi, setUlangi] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [sedangKirim, setSedangKirim] = useState(false);

  async function kirim() {
    if (sedangKirim) return;

    // Diperiksa di sini supaya user tidak perlu menunggu bolak-balik ke server
    // hanya untuk tahu dua isiannya berbeda.
    if (baru !== ulangi) {
      setGalat("Kata sandi baru dan ulangannya belum sama.");
      return;
    }

    setSedangKirim(true);
    setGalat(null);
    try {
      const respons = await fetch("/api/auth/ganti-kata-sandi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kata_sandi_lama: lama, kata_sandi_baru: baru }),
      });
      const data = await respons.json();

      if (!respons.ok) {
        setGalat(data.error ?? "Belum berhasil. Coba ulangi sebentar lagi ya.");
        return;
      }

      router.push("/alat");
      router.refresh();
    } catch {
      setGalat("Koneksi ke server terputus. Periksa internet Anda, lalu coba lagi.");
    } finally {
      setSedangKirim(false);
    }
  }

  return (
    <Kartu
      judul="Ganti kata sandi dulu"
      keterangan="Kata sandi yang kami kirim lewat pesan dibuat otomatis. Ganti dengan yang hanya Anda yang tahu."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          kirim();
        }}
      >
        <Isian
          label="Kata sandi yang kami kirim"
          tipe="password"
          nilai={lama}
          onUbah={setLama}
          autoComplete="current-password"
        />
        <Isian
          label="Kata sandi baru"
          tipe="password"
          nilai={baru}
          onUbah={setBaru}
          autoComplete="new-password"
        />
        <Isian
          label="Ulangi kata sandi baru"
          tipe="password"
          nilai={ulangi}
          onUbah={setUlangi}
          autoComplete="new-password"
        />

        {galat ? <PesanGagal pesan={galat} /> : null}

        <Button type="submit" lebarPenuh nonaktif={sedangKirim}>
          {sedangKirim ? "Sedang menyimpan…" : "Simpan kata sandi baru"}
        </Button>
      </form>
    </Kartu>
  );
}
