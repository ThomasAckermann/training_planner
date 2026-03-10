import { SKILL_LEVEL_COLORS } from "../../lib/constants.js";

const focusAreaColors = {
  SERVING: "#cc1414",
  RECEPTION: "#4a9eff",
  SETTING: "#a78bfa",
  ATTACK: "#ff4d4d",
  BLOCK: "#ff9500",
  DEFENSE: "#4a9eff",
  TACTICS: "#e879f9",
  FITNESS: "#fb923c",
  WARMUP: "#fbbf24",
  FUN: "#f59e0b",
};

export default function Badge({
  variant = "default",
  children,
  className = "",
}) {
  let style = {};
  let baseClasses =
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium";

  if (variant === "skill") {
    const level = children?.toString().toUpperCase();
    const color = SKILL_LEVEL_COLORS[level] || "#888888";
    style = {
      backgroundColor: `${color}22`,
      color,
      border: `1px solid ${color}44`,
    };
  } else if (variant === "focus") {
    const area = children?.toString().toUpperCase();
    const color = focusAreaColors[area] || "#888888";
    style = {
      backgroundColor: `${color}22`,
      color,
      border: `1px solid ${color}44`,
    };
  } else if (variant === "age") {
    style = {
      backgroundColor: "#4a9eff22",
      color: "#4a9eff",
      border: "1px solid #4a9eff44",
    };
  } else {
    style = {
      backgroundColor: "#33333388",
      color: "#888888",
      border: "1px solid #333333",
    };
  }

  return (
    <span className={`${baseClasses} ${className}`} style={style}>
      {children}
    </span>
  );
}
