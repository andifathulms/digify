import { redirect } from "next/navigation";

import { FormGantiKataSandi } from "@/components/tools/FormMasuk";
import { ambilProfil } from "@/lib/sesiServer";

export const metadata = { title: "Ganti Kata Sandi — Digify Laris" };

export default async function GantiKataSandiPage() {
  const profil = await ambilProfil();
  if (!profil) redirect("/masuk");
  if (!profil.must_change_password) redirect("/alat");

  return <FormGantiKataSandi />;
}
