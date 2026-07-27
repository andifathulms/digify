import BiayaMenu from "@/components/tools/BiayaMenu";
import JudulTab from "@/components/ui/JudulTab";

export const metadata = { title: "Biaya Menu — Digify Laris" };

export default function BiayaMenuPage() {
  return (
    <>
      <JudulTab slug="biaya-menu" />
      <BiayaMenu />
    </>
  );
}
