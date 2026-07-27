import HargaJual from "@/components/tools/HargaJual";
import JudulTab from "@/components/ui/JudulTab";

export const metadata = { title: "Harga Jual — Digify Laris" };

export default function HargaJualPage() {
  return (
    <>
      <JudulTab slug="harga-jual" />
      <HargaJual />
    </>
  );
}
