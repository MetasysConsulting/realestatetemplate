import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplatePage } from "@/components/template/TemplatePage";
import { isPropertyDetailRoute } from "@/lib/property-gate";
import { fetchHomeCategoryRows } from "@/lib/listings-repository";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";
import {
  TEMPLATE_PAGES,
  getTemplateMetaByRoute,
} from "@/lib/template-manifest";

export const revalidate = 3600;
export const dynamicParams = false;

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
  return TEMPLATE_PAGES.map((page) => {
    if (page.route === "/") {
      return { slug: [] };
    }
    return { slug: page.route.replace(/^\//, "").split("/") };
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const route = resolveRoute((await params).slug);
  const meta = getTemplateMetaByRoute(route);
  return {
    title: meta?.title ?? "Proty - Real Estate",
  };
}

export default async function TemplateRoutePage({ params }: PageProps) {
  const route = resolveRoute((await params).slug);
  const pageMeta = getTemplateMetaByRoute(route);

  if (!pageMeta) {
    notFound();
  }

  const data = loadTemplatePageBySlug(pageMeta.slug);

  if (!data) {
    notFound();
  }

  const homeCategoryRows = route === "/" ? await fetchHomeCategoryRows() : {};

  return (
    <TemplatePage
      html={data.html}
      bodyClass={data.bodyClass}
      propertyGate={isPropertyDetailRoute(route)}
      showHomeCategoryRows={route === "/"}
      showLoanSteps={route === "/"}
      showNeighborhoodsCarousel={route === "/"}
      homeCategoryRows={homeCategoryRows}
    />
  );
}
