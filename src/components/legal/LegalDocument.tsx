import type { LegalSection } from "@/lib/legal-content";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-content";

type LegalDocumentProps = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalDocument({ title, intro, sections }: LegalDocumentProps) {
  return (
    <article className="legal-document">
      <header className="legal-document__header">
        <h1>{title}</h1>
        <p className="legal-document__intro">{intro}</p>
        <p className="legal-document__updated">Last updated: {LEGAL_LAST_UPDATED}</p>
        <p className="legal-document__notice">
          Placeholder for launch — REOVANA should replace this with final client/legal review.
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.title} className="legal-document__section">
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
