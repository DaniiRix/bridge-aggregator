export const isInputGreaterThanDecimals = (
  value: string,
  maxDecimals?: number,
): boolean => {
  const decimalGroups = value.split(".");

  return (
    !!maxDecimals &&
    decimalGroups.length > 1 &&
    (decimalGroups[1]?.length as number) > maxDecimals
  );
};

export const formatNumber = (value: string): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value));
};

export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
