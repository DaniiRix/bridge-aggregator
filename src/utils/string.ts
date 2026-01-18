export const titleCase = (str: string) =>
  str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
  );

export const truncate = (str?: string, length = 4) => {
  if (!str) return "";

  return str.length <= length ? str : `${str.slice(0, length)}...`;
};

export const truncateAddress = (address?: string, length = 4) =>
  address ? `${address.slice(0, length + 2)}...${address.slice(-length)}` : "";

export function normalizeAddress(address: string): string;
export function normalizeAddress(address?: undefined): undefined;
export function normalizeAddress(address?: string) {
  return address?.toLowerCase();
}

export const scramble = (str: string) =>
  str.split("").reduce((a, b) => {
    return a + String.fromCharCode(b.charCodeAt(0) + 2);
  }, "");
