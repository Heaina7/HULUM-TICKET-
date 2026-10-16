import { redirect } from "next/navigation";
import { getCurrentUserOrNull } from "@/services/profile";

export default async function RootPage() {
  const user = await getCurrentUserOrNull();
  redirect(user ? "/dashboard" : "/kiosk");
}
