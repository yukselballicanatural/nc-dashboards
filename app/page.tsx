import { redirect } from "next/navigation";

/** Kök sayfa → önce giriş ekranına yönlendirir. */
export default function RootPage() {
  redirect("/login");
}
