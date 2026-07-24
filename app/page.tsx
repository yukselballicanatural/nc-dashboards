import { redirect } from "next/navigation";

/** Kök sayfa → tek sayfalık Agent dashboard'una yönlendirir. */
export default function RootPage() {
  redirect("/agent");
}
