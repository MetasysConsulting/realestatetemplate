import { TemplatePage } from "@/components/template/TemplatePage";
import { loadTemplatePageBySlug } from "@/lib/load-template-page";

export default function NotFound() {
  const data = loadTemplatePageBySlug("template-404");

  if (data) {
    return <TemplatePage html={data.html} bodyClass={data.bodyClass} />;
  }

  return (
    <main style={{ padding: 48, textAlign: "center" }}>
      <h1>404</h1>
      <p>Page not found.</p>
    </main>
  );
}
