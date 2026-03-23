export function SectionTitle({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <header className="yw-section-head">
      {eyebrow && <p className="yw-section-eyebrow">{eyebrow}</p>}
      <h2 className="yw-section-title">{title}</h2>
      {subtitle && <p className="yw-section-desc">{subtitle}</p>}
    </header>
  );
}
