export default function Card({
  children,
  className = "",
  hoverable = false,
  onClick,
}) {
  return (
    <div
      className={[
        "rounded-xl border p-4",
        "bg-surface border-border-color",
        hoverable
          ? "transition-all duration-200 hover:scale-[1.02] hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 cursor-pointer"
          : "",
        className,
      ].join(" ")}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
