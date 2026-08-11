"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Button from "@/components/ui/Button";
import { FieldAngka, FieldTeks } from "@/components/ui/Field";
import { PesanGagal } from "@/components/ui/Keadaan";

/**
 * Tindakan atas satu pembeli: tambah jatah, reset kata sandi, nonaktifkan.
 *
 * Satu-satunya bagian panel yang perlu "use client" — sisanya cuma menampilkan
 * angka dan lebih baik dirender di server.
 *
 * Kata sandi hasil reset ditampilkan SEKALI di layar ini dan tidak disimpan di
 * mana pun dalam bentuk yang bisa dibaca ulang. Itu memang cara kerjanya di
 * backend, dan operasional perlu tahu supaya menyalinnya sebelum menutup
 * halaman — bukan menutup dulu lalu mencarinya lagi.
 */
export default function TindakanKlien({
  userId,
  aktif,
  sisaHariIni,
  kredensialTerkirim,
}: {
  userId: number;
  aktif: boolean;
  sisaHariIni: number;
  kredensialTerkirim: boolean;
}) {
  const router = useRouter();
  const [jumlah, setJumlah] = useState(5);
  const [alasan, setAlasan] = useState("");
  const [sedang, setSedang] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [sandiBaru, setSandiBaru] = useState<string | null>(null);

  async function kirim(jalur: string, isi: Record<string, unknown>, nama: string) {
    setSedang(nama);
    setGalat(null);
    setPesan(null);
    setSandiBaru(null);
    try {
      const respons = await fetch(`/api/panel/klien/${userId}/${jalur}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isi),
      });
      const data = await respons.json().catch(() => ({}));
      if (!respons.ok) {
        setGalat(data.error ?? "Belum berhasil. Coba ulangi sebentar lagi ya.");
        return;
      }
      setPesan(data.pesan ?? "Berhasil.");
      if (data.kata_sandi) setSandiBaru(data.kata_sandi);
      // Angka sisa jatah dan status akun ikut berubah, jadi halamannya
      // diminta memuat ulang datanya sendiri.
      router.refresh();
    } catch {
      setGalat("Koneksi terputus. Periksa internet Anda, lalu coba lagi.");
    } finally {
      setSedang(null);
    }
  }

  return (
    <section
      className="mt-6 p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <h2 className="judul-kecil text-lg">Tindakan</h2>

      {galat ? (
        <div className="mt-3">
          <PesanGagal pesan={galat} />
        </div>
      ) : null}

      {pesan ? (
        <p
          className="teks-rapi mt-3 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm"
          style={{ background: "var(--green-wash)", color: "var(--green)" }}
        >
          {pesan}
        </p>
      ) : null}

      {sandiBaru ? (
        <div
          className="mt-3 px-3.5 py-3"
          style={{
            background: "var(--yellow-wash)",
            borderLeft: "3px solid var(--yellow)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <p className="text-sm font-semibold">Salin sekarang — hanya ditampilkan sekali:</p>
          <p className="tabular mt-1.5 text-lg font-semibold">{sandiBaru}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">Tambah jatah hari ini</p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
            Sisa jatah sekarang {sisaHariIni}. Tambahan hanya berlaku hari ini dan habis sendiri
            besok.
          </p>
          <div className="mt-2.5 flex flex-col gap-2.5">
            <FieldAngka label="Berapa tambahan?" nilai={jumlah} onUbah={setJumlah} satuan="panggilan" />
            <FieldTeks
              label="Alasan (boleh dikosongkan)"
              nilai={alasan}
              onUbah={setAlasan}
              placeholder="Misalnya: komplain kehabisan jatah"
            />
            <Button
              peran="kedua"
              memuat={sedang === "bonus"}
              onClick={() => kirim("bonus", { jumlah, alasan }, "bonus")}
            >
              Tambah jatah
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">Akun</p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
            {kredensialTerkirim
              ? "Kredensialnya sudah pernah terkirim."
              : "Kredensialnya BELUM pernah terkirim — pembeli ini mungkin tidak tahu kata sandinya."}{" "}
            Menonaktifkan akun tidak menghapusnya — riwayatnya tetap ada dan bisa diaktifkan lagi.
          </p>
          <div className="mt-2.5 flex flex-col gap-2.5">
            {/* Tombol utama saat kredensialnya belum sampai: itu satu-satunya
                hal yang menghalangi pembeli ini memakai apa yang sudah
                dibayarnya. */}
            <Button
              peran={kredensialTerkirim ? "kedua" : "utama"}
              memuat={sedang === "kredensial"}
              onClick={() => kirim("kirim-kredensial", {}, "kredensial")}
            >
              Kirim kata sandi baru lewat email
            </Button>
            <Button
              peran="kedua"
              memuat={sedang === "sandi"}
              onClick={() => kirim("reset-sandi", {}, "sandi")}
            >
              Buat kata sandi baru tanpa kirim email
            </Button>
            <Button
              peran={aktif ? "bahaya" : "kedua"}
              memuat={sedang === "aktif"}
              onClick={() => kirim("aktif", { aktif: !aktif }, "aktif")}
            >
              {aktif ? "Nonaktifkan akun" : "Aktifkan kembali"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
