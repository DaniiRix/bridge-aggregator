
export const titleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
};

export const truncate = (str?: string, length = 4) => {
    if (!str) return "";

    return str.length <= length ? str : `${str.slice(0, length)}...`;
};

export const truncateAddress = (address: string, length = 4) => {
    return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
};
