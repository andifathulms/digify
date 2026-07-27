import { redirect } from "next/navigation";

import { FormMasuk } from "@/components/tools/FormMasuk";
import { ambilProfil } from "@/lib/sesiServer";

export const metadata = { title: "Masuk — Digify Laris" };

export default async function MasukPage() {
  // Yang sudah masuk tidak perlu melihat form masuk lagi.
  const profil = await ambilProfil();
  if (profil) {
    redirect(profil.must_change_password ? "/masuk/ganti-kata-sandi" : "/alat");
  }
  return <FormMasuk />;
}
