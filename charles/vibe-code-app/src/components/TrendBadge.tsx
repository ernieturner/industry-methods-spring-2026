import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatPercent } from "../lib/formatters";

interface TrendBadgeProps {
  value: number | null | undefined;
}

export const TrendBadge = ({ value }: TrendBadgeProps) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return (
      <span className="trend-badge trend-neutral">
        <Minus size={14} />
        n/a
      </span>
    );
  }

  if (value > 0) {
    return (
      <span className="trend-badge trend-positive">
        <ArrowUpRight size={14} />
        {formatPercent(value)}
      </span>
    );
  }

  if (value < 0) {
    return (
      <span className="trend-badge trend-negative">
        <ArrowDownRight size={14} />
        {formatPercent(value)}
      </span>
    );
  }

  return (
    <span className="trend-badge trend-neutral">
      <Minus size={14} />
      {formatPercent(0)}
    </span>
  );
};
