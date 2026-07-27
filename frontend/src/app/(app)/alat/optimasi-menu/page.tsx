import OptimasiMenu from "@/components/tools/OptimasiMenu";
import JudulTab from "@/components/ui/JudulTab";

export const metadata = { title: "Optimasi Menu — Digify Laris" };

export default function OptimasiMenuPage() {
  return (
    <>
      <JudulTab slug="optimasi-menu" />
      <OptimasiMenu />
    </>
  );
}
