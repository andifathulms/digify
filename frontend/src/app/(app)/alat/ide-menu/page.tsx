import IdeMenu from "@/components/tools/IdeMenu";
import JudulTab from "@/components/ui/JudulTab";

export const metadata = { title: "Ide Menu Baru — Digify Laris" };

export default function IdeMenuPage() {
  return (
    <>
      <JudulTab slug="ide-menu" />
      <IdeMenu />
    </>
  );
}
