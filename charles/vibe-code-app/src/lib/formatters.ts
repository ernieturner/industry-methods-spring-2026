const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactUsdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const btcFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatUsd = (value: number, compact = false): string => {
  if (Math.abs(value) < 1 && value !== 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(value);
  }

  return (compact ? compactUsdFormatter : usdFormatter).format(value);
};

export const formatBtc = (value: number): string => `${btcFormatter.format(value)} BTC`;

export const formatInteger = (value: number): string =>
  integerFormatter.format(value);

export const formatPercent = (value: number, signed = true): string => {
  const absolute = Math.abs(value).toFixed(2);

  if (!signed) {
    return `${value.toFixed(2)}%`;
  }

  if (value > 0) {
    return `+${absolute}%`;
  }

  if (value < 0) {
    return `-${absolute}%`;
  }

  return "0.00%";
};

export const formatDateTime = (unixSeconds: number): string =>
  dateTimeFormatter.format(new Date(unixSeconds * 1000));
