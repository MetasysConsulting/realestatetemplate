import Link from "next/link";
import { SiteLayout } from "@/components/layout/SiteLayout";

export default function NotFound() {
  return (
    <SiteLayout>
      <section className="tf-spacing-1 text-center">
        <div className="tf-container">
          <h1 className="title">404</h1>
          <p className="text-1 mb-20">Page not found.</p>
          <Link href="/" className="tf-btn bg-color-primary pd-23">
            Back to home
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
