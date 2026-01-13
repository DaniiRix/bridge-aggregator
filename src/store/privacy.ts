import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type PrivacyState = {
  isPrivacyEnabled: boolean;
};

type PrivacyActions = {
  togglePrivacy: (checked: boolean) => void;
};

type PrivacyStore = PrivacyState & PrivacyActions;

const parseFromStorage = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Boolean(value);
    return parsed;
  }
  return false;
};

export const usePrivacy = create<PrivacyStore>()(
  persist(
    (set) => ({
      isPrivacyEnabled: false,
      togglePrivacy: (checked) => set(() => ({ isPrivacyEnabled: checked })),
    }),
    {
      name: "llamabridge-privacy",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const validatedPrivacy = parseFromStorage(state.isPrivacyEnabled);
          state.isPrivacyEnabled = validatedPrivacy;
        }
      },
    },
  ),
);
