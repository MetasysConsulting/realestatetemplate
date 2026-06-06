import Image from "next/image";
import Link from "next/link";
import { LearnHeroBanner } from "@/components/learn/LearnHeroBanner";
import type { LearnArticle, LearnArticleSection } from "@/lib/learn-content";

function renderSection(section: LearnArticleSection, index: number) {
  switch (section.type) {
    case "p":
      return <p key={index}>{section.text}</p>;
    case "h2":
      return <h2 key={index}>{section.text}</h2>;
    case "h3":
      return <h3 key={index}>{section.text}</h3>;
    case "ul":
      return (
        <ul key={index}>
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={index}>
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <div key={index} className="learn-callout">
          {section.text}
        </div>
      );
    default:
      return null;
  }
}

type LearnArticleViewProps = {
  article: LearnArticle;
};

export function LearnArticleView({ article }: LearnArticleViewProps) {
  const intro = article.sections[0]?.type === "p" ? article.sections[0] : null;
  const rest = intro ? article.sections.slice(1) : article.sections;

  return (
    <>
      <LearnHeroBanner
        kicker={article.heroKicker}
        title={article.title}
        description={article.meta}
      />

      <div className="learn-page learn-page--body">
        <div className="tf-container">
          <article className="learn-article">
            <Link href={article.backHref} className="learn-backlink">
              ← {article.backLabel}
            </Link>
            {article.heroImageUrl ? (
              <div className="learn-article__hero">
                <Image
                  src={article.heroImageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 760px"
                  priority
                />
              </div>
            ) : null}
            {intro ? <p>{intro.text}</p> : null}
            {rest.map((section, index) => renderSection(section, index))}
          </article>
        </div>
      </div>
    </>
  );
}
