interface SparklineProps {
  points: number[];
  trend: number | null | undefined;
}

export const Sparkline = ({ points, trend }: SparklineProps) => {
  if (points.length < 2) {
    return <span className="sparkline-empty">No data</span>;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const denominator = Math.max(points.length - 1, 1);

  const chartPoints = points
    .map((point, index) => {
      const x = (index / denominator) * 100;
      const y = 100 - ((point - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const fillPoints = `${chartPoints} 100,100 0,100`;
  const positive = (trend ?? 0) >= 0;

  return (
    <svg
      className="sparkline"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon
        points={fillPoints}
        className={positive ? "sparkline-fill-positive" : "sparkline-fill-negative"}
      />
      <polyline
        points={chartPoints}
        className={positive ? "sparkline-line-positive" : "sparkline-line-negative"}
      />
    </svg>
  );
};
