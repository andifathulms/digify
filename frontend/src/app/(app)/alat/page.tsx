import { redirect } from "next/navigation";

export default function AlatPage() {
  // Tab 1 adalah titik masuk yang wajar: semua tab lain butuh angka biaya.
  redirect("/alat/biaya-menu");
}
