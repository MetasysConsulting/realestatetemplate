type LearnHeroBannerProps = {
  kicker: string;
  title: string;
  description?: string;
  compact?: boolean;
  children?: React.ReactNode;
};

export function LearnHeroBanner({
  kicker,
  title,
  description,
  compact = true,
  children,
}: LearnHeroBannerProps) {
  return (
    <div
      className={`learn-hero-banner${compact ? " learn-hero-banner--compact" : ""}`}
    >
      <div className="tf-container">
        <p className="learn-kicker">{kicker}</p>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
    </div>
  );
}
