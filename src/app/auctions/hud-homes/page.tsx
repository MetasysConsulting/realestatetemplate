import { redirect } from "next/navigation";

export default function LegacyHudHomesRedirect() {
  redirect("/properties/hud-home");
}
