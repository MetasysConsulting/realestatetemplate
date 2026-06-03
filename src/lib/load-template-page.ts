import { TEMPLATE_PAGE_REGISTRY } from "@/generated/page-registry";

export type TemplatePageData = {
  route: string;
  file: string;
  bodyClass: string;
  title: string;
  html: string;
};

export function loadTemplatePageBySlug(slug: string): TemplatePageData | null {
  return TEMPLATE_PAGE_REGISTRY[slug] ?? null;
}
