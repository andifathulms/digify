import Laporan from "@/components/tools/Laporan";
import JudulTab from "@/components/ui/JudulTab";

export const metadata = { title: "Laporan Final — Digify Laris" };

export default function LaporanPage() {
  return (
    <>
      <JudulTab slug="laporan" />
      <Laporan />
    </>
  );
}
