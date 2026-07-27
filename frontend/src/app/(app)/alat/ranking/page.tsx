import Ranking from "@/components/tools/Ranking";
import JudulTab from "@/components/ui/JudulTab";

export const metadata = { title: "Ranking Menu — Digify Laris" };

export default function RankingPage() {
  return (
    <>
      <JudulTab slug="ranking" />
      <Ranking />
    </>
  );
}
