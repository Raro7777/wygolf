export function PageBanner({
  variant = "error",
  children,
}: {
  variant?: "error" | "warn" | "info";
  children: React.ReactNode;
}) {
  const v =
    variant === "warn"
      ? "yw-banner--warn"
      : variant === "info"
        ? "yw-banner--info"
        : "yw-banner--error";
  return <div className={`yw-banner ${v}`}>{children}</div>;
}
