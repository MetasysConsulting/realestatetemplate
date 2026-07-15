import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplatePage } from "@/components/template/TemplatePage";
import { isPropertyDetailRoute } from "@/lib/property-gate";
import { fetchHomeCategoryRows } from "@/lib/listings-repository";
import { fetchHomeNeighborhoods } from "@/lib/fetch-home-neighborhoods";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";
import {
  TEMPLATE_PAGES,
  getTemplateMetaByRoute,
} from "@/lib/template-manifest";

export const revalidate = 3600;
export const dynamicParams = false;

/**
 * Member / billing routes are real App Router pages under `(site)/`.
 * Keep them out of the Proty catch-all or mock HTML wins the build.
 */
const TEMPLATE_ROUTE_OVERRIDES = new Set([
  "/dashboard",
  "/my-favorites",
  "/my-save-search",
  "/my-profile",
  "/my-package",
  "/my-property",
  "/billing",
  "/review",
]);

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

function resolveRoute(slug?: string[]): string {
  if (!slug?.length) {
    return "/";
  }
  return `/${slug.join("/")}`;
}

export async function generateStaticParams() {
  return TEMPLATE_PAGES.filter((page) => !TEMPLATE_ROUTE_OVERRIDES.has(page.route)).map(
    (page) => {
      if (page.route === "/") {
        return { slug: [] };
      }
      return { slug: page.route.replace(/^\//, "").split("/") };
    },
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const route = resolveRoute((await params).slug);
  if (TEMPLATE_ROUTE_OVERRIDES.has(route)) {
    notFound();
  }
  const meta = getTemplateMetaByRoute(route);
  return {
    title: meta?.title ?? "Proty - Real Estate",
  };
}

export default async function TemplateRoutePage({ params }: PageProps) {
  const route = resolveRoute((await params).slug);
  if (TEMPLATE_ROUTE_OVERRIDES.has(route)) {
    notFound();
  }
  const pageMeta = getTemplateMetaByRoute(route);

  if (!pageMeta) {
    notFound();
  }

  const data = loadTemplatePageBySlug(pageMeta.slug);

  if (!data) {
    notFound();
  }

  // Homepage cards are open teaser rows (price + address shown). Paywall applies on detail pages.
  const homeCategoryRows = route === "/" ? await fetchHomeCategoryRows() : {};
  const homeNeighborhoods = route === "/" ? await fetchHomeNeighborhoods() : [];

  return (
    <TemplatePage
      html={data.html}
      bodyClass={data.bodyClass}
      propertyGate={isPropertyDetailRoute(route)}
      showHomeCategoryRows={route === "/"}
      showLoanSteps={route === "/"}
      showNeighborhoodsCarousel={route === "/"}
      homeCategoryRows={homeCategoryRows}
      homeNeighborhoods={homeNeighborhoods}
      browseSoftGate={false}
    />
  );
}
