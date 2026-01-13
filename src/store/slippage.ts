import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const DEFAULT_SLIPPAGE_PERCENT = 1; // 1%
export const MAX_SLIPPAGE_PERCENT = 99; // 99%
export const BASIS_POINTS_MULTIPLIER = 10_000;

type SlippageState = {
  slippagePercent: number;
};

type SlippageActions = {
  setSlippagePercent: (percent: number) => void;
};

type SlippageStore = SlippageState & SlippageActions;

const parseSlippageFromStorage = (value: unknown): number => {
  if (typeof value === "number" && value > 0 && value <= MAX_SLIPPAGE_PERCENT) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= MAX_SLIPPAGE_PERCENT) {
      return parsed;
    }
  }
  return DEFAULT_SLIPPAGE_PERCENT;
};

export const useSlippage = create<SlippageStore>()(
  persist(
    (set) => ({
      slippagePercent: DEFAULT_SLIPPAGE_PERCENT,
      setSlippagePercent: (percent: number) => {
        if (percent > 0 && percent <= MAX_SLIPPAGE_PERCENT) {
          set({ slippagePercent: percent });
        }
      },
    }),
    {
      name: "llamabridge-slippage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const validatedPercent = parseSlippageFromStorage(
            state.slippagePercent,
          );
          state.slippagePercent = validatedPercent;
        }
      },
    },
  ),
);
