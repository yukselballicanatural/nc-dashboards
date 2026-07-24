import type { Metadata } from "next";
import { LoginScreen } from "@/components/login/LoginScreen";

export const metadata: Metadata = {
  title: "Natural Clinic — Giriş",
};

export default function LoginPage() {
  return <LoginScreen />;
}
