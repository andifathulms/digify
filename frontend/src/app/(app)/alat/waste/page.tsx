import WasteTracker from "@/components/tools/WasteTracker";
import JudulTab from "@/components/ui/JudulTab";

export const metadata = { title: "Bahan Terbuang — Digify Laris" };

export default function WasteTrackerPage() {
  return (
    <>
      <JudulTab slug="waste" />
      <WasteTracker />
    </>
  );
}
