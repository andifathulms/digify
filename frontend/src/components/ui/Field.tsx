"use client";

import { useId } from "react";

import { formatAngka, parseAngka } from "@/lib/format";

/**
 * Isian form.
 *
 * Aturan yang dipegang di sini:
 * - Tinggi minimum 44px (target sentuh, PRD §4).
 * - Input angka memunculkan keyboard numerik di HP.
 * - Nilai rupiah tampil terformat ("Rp 12.500"), tapi yang dikirim ke API
 *   tetap angka biasa.
 * - Teks bantuan dihubungkan lewat `aria-describedby`, bukan sekadar
 *   diletakkan di dekatnya, supaya pembaca layar ikut membacakannya.
 *
 * Tampilannya diatur kelas `.isian` di globals.css — hover dan fokus tidak
 * bisa dinyatakan lewat atribut style inline.
 */

function Label({
  htmlFor,
  teks,
  bantuan,
  idBantuan,
}: {
  htmlFor: string;
  teks: string;
  bantuan?: string;
  idBantuan: string;
}) {
  return (
    <>
      <label htmlFor={htmlFor} className="text-sm leading-snug font-semibold">
        {teks}
      </label>
      {bantuan ? (
        <p
          id={idBantuan}
          className="text-xs leading-relaxed"
          style={{ color: "var(--ink-dim)" }}
        >
          {bantuan}
        </p>
      ) : null}
    </>
  );
}

export function FieldTeks({
  label,
  bantuan,
  nilai,
  onUbah,
  placeholder,
}: {
  label: string;
  bantuan?: string;
  nilai: string;
  onUbah: (nilai: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  const idBantuan = `${id}-bantuan`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} teks={label} bantuan={bantuan} idBantuan={idBantuan} />
      <input
        id={id}
        type="text"
        value={nilai}
        placeholder={placeholder}
        aria-describedby={bantuan ? idBantuan : undefined}
        onChange={(event) => onUbah(event.target.value)}
        className="isian px-3 py-2.5 text-base"
      />
    </div>
  );
}

export function FieldAngka({
  label,
  bantuan,
  nilai,
  onUbah,
  satuan,
  rupiah = false,
}: {
  label: string;
  bantuan?: string;
  nilai: number;
  onUbah: (nilai: number) => void;
  satuan?: string;
  rupiah?: boolean;
}) {
  const id = useId();
  const idBantuan = `${id}-bantuan`;
  const tampil = rupiah ? formatAngka(nilai) : String(nilai);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} teks={label} bantuan={bantuan} idBantuan={idBantuan} />
      <div className="relative flex items-center">
        {rupiah ? (
          <span
            aria-hidden
            className="tabular pointer-events-none absolute left-3 text-sm font-semibold"
            style={{ color: "var(--ink-soft)" }}
          >
            Rp
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          // inputMode numeric: keyboard angka di HP, bukan keyboard huruf.
          inputMode="numeric"
          value={tampil}
          aria-describedby={bantuan ? idBantuan : undefined}
          onChange={(event) => onUbah(parseAngka(event.target.value))}
          className={`isian tabular py-2.5 text-base font-semibold ${
            rupiah ? "pl-10" : "pl-3"
          } ${satuan ? "pr-16" : "pr-3"}`}
        />
        {satuan ? (
          <span
            aria-hidden
            className="pointer-events-none absolute right-2.5 rounded-[var(--radius-xs)] px-1.5 py-0.5 text-xs font-semibold"
            style={{ background: "var(--surface-2)", color: "var(--ink-dim)" }}
          >
            {satuan}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function FieldTeksPanjang({
  label,
  bantuan,
  nilai,
  onUbah,
  baris = 6,
  placeholder,
}: {
  label: string;
  bantuan?: string;
  nilai: string;
  onUbah: (nilai: string) => void;
  baris?: number;
  placeholder?: string;
}) {
  const id = useId();
  const idBantuan = `${id}-bantuan`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} teks={label} bantuan={bantuan} idBantuan={idBantuan} />
      <textarea
        id={id}
        rows={baris}
        value={nilai}
        placeholder={placeholder}
        aria-describedby={bantuan ? idBantuan : undefined}
        onChange={(event) => onUbah(event.target.value)}
        className="isian px-3 py-2.5 text-base leading-relaxed"
      />
    </div>
  );
}

export function FieldPilihan({
  label,
  bantuan,
  nilai,
  pilihan,
  onUbah,
}: {
  label: string;
  bantuan?: string;
  nilai: string;
  pilihan: readonly string[];
  onUbah: (nilai: string) => void;
}) {
  const id = useId();
  const idBantuan = `${id}-bantuan`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} teks={label} bantuan={bantuan} idBantuan={idBantuan} />
      <div className="relative flex items-center">
        <select
          id={id}
          value={nilai}
          aria-describedby={bantuan ? idBantuan : undefined}
          onChange={(event) => onUbah(event.target.value)}
          className="isian cursor-pointer appearance-none py-2.5 pr-10 pl-3 text-base"
        >
          {pilihan.map((opsi) => (
            <option key={opsi} value={opsi}>
              {opsi}
            </option>
          ))}
        </select>
        {/* Panah bawaan browser tampil beda-beda di tiap HP; digambar sendiri
         * supaya satu bentuk di mana pun. */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-3.5 text-xs"
          style={{ color: "var(--ink-dim)" }}
        >
          ▼
        </span>
      </div>
    </div>
  );
}
