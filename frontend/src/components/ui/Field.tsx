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
 */

const gayaDasar: React.CSSProperties = {
  minHeight: "var(--tap)",
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-sm)",
  color: "var(--ink)",
};

function Label({ htmlFor, teks, bantuan }: { htmlFor: string; teks: string; bantuan?: string }) {
  return (
    <>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {teks}
      </label>
      {bantuan ? (
        <p className="text-xs" style={{ color: "var(--ink-dim)" }}>
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
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} teks={label} bantuan={bantuan} />
      <input
        id={id}
        type="text"
        value={nilai}
        placeholder={placeholder}
        onChange={(event) => onUbah(event.target.value)}
        className="w-full px-3 py-2.5 text-base"
        style={gayaDasar}
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
  const tampil = rupiah ? formatAngka(nilai) : String(nilai);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} teks={label} bantuan={bantuan} />
      <div className="relative flex items-center">
        {rupiah ? (
          <span
            aria-hidden
            className="tabular absolute left-3 text-sm"
            style={{ color: "var(--ink-dim)" }}
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
          onChange={(event) => onUbah(parseAngka(event.target.value))}
          className={`tabular w-full py-2.5 text-base ${rupiah ? "pl-10" : "pl-3"} ${
            satuan ? "pr-14" : "pr-3"
          }`}
          style={gayaDasar}
        />
        {satuan ? (
          <span
            aria-hidden
            className="absolute right-3 text-sm"
            style={{ color: "var(--ink-dim)" }}
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
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} teks={label} bantuan={bantuan} />
      <textarea
        id={id}
        rows={baris}
        value={nilai}
        placeholder={placeholder}
        onChange={(event) => onUbah(event.target.value)}
        className="w-full px-3 py-2.5 text-base leading-relaxed"
        style={gayaDasar}
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
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} teks={label} bantuan={bantuan} />
      <select
        id={id}
        value={nilai}
        onChange={(event) => onUbah(event.target.value)}
        className="w-full px-3 py-2.5 text-base"
        style={gayaDasar}
      >
        {pilihan.map((opsi) => (
          <option key={opsi} value={opsi}>
            {opsi}
          </option>
        ))}
      </select>
    </div>
  );
}
