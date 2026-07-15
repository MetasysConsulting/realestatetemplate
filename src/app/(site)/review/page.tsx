import { redirect } from "next/navigation";

/** Legacy Proty mock reviews page — not part of the member product. */
export default function ReviewPage() {
  redirect("/dashboard");
}
