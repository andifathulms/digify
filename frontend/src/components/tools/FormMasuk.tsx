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

/**
 * Satu isian.
 *
 * Isian kata sandi punya tombol "Lihat". Kata sandi awal di produk ini dibuat
 * acak dan dikirim lewat WhatsApp — mengetiknya ulang dari layar sebelah,
 * dengan bulatan hitam sebagai satu-satunya umpan balik, adalah cara pasti
 * membuat orang gagal masuk tiga kali lalu menghubungi CS.
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
  const [terlihat, setTerlihat] = useState(false);
  const kataSandi = tipe === "password";

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <div className="relative flex items-center">
        <input
          type={kataSandi && terlihat ? "text" : tipe}
          value={nilai}
          autoComplete={autoComplete}
          onChange={(event) => onUbah(event.target.value)}
          className={`isian py-2.5 pl-3 text-base ${kataSandi ? "pr-20" : "pr-3"}`}
        />
        {kataSandi ? (
          <button
            type="button"
            onClick={() => setTerlihat((sebelumnya) => !sebelumnya)}
            className="absolute right-1.5 cursor-pointer rounded-[var(--radius-xs)] px-2.5 py-1.5 text-xs font-semibold"
            style={{ color: "var(--blue-600)", background: "var(--blue-wash)" }}
          >
            {terlihat ? "Sembunyikan" : "Lihat"}
          </button>
        ) : null}
      </div>
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

        <Button type="submit" lebarPenuh memuat={sedangKirim}>
          {sedangKirim ? "Sedang masuk…" : "Masuk"}
        </Button>
      </form>

      <p
        className="teks-rapi mt-5 border-t pt-4 text-sm leading-relaxed"
        style={{ color: "var(--ink-dim)", borderColor: "var(--line)" }}
      >
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

        <Button type="submit" lebarPenuh memuat={sedangKirim}>
          {sedangKirim ? "Sedang menyimpan…" : "Simpan kata sandi baru"}
        </Button>
      </form>
    </Kartu>
  );
}
