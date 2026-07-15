import { redirect } from "next/navigation";

/** Legacy template route — billing page has live Stripe plan data. */
export default function MyPackagePage() {
  redirect("/billing");
}
