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