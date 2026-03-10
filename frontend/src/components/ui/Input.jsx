import { forwardRef } from "react";

const Input = forwardRef(function Input(
  {
    label,
    error,
    icon: Icon,
    className = "",
    containerClassName = "",
    ...props
  },
  ref,
) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-sm font-medium text-text-primary font-ui">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          className={[
            "w-full bg-surface2 border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
            "transition-colors duration-150",
            error ? "border-danger" : "border-border-color",
            Icon ? "pl-9" : "",
            className,
          ].join(" ")}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger font-ui">{error}</p>}
    </div>
  );
});

export default Input;
