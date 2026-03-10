import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const variantClasses = {
  primary: "bg-accent text-bg font-semibold hover:bg-accent/90 active:scale-95",
  secondary:
    "bg-surface2 text-text-primary border border-border-color hover:bg-surface2/80 active:scale-95",
  ghost: "bg-transparent text-text-primary hover:bg-surface2 active:scale-95",
  danger:
    "bg-danger text-white font-semibold hover:bg-danger/90 active:scale-95",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-lg gap-2",
};

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    children,
    className = "",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-ui transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
});

export default Button;
