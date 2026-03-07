import { type ReactNode, createContext, useContext } from "react";
import type { UserProfile } from "../backend.d";
import { usePhoneAuth } from "./usePhoneAuth";

interface AppContextValue {
  userProfile: UserProfile | null | undefined;
  isLoadingProfile: boolean;
  userId: bigint | null;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const phoneAuth = usePhoneAuth();

  // Build a minimal UserProfile from phone auth session data
  const userProfile: UserProfile | null = phoneAuth.isLoggedIn
    ? {
        userId: phoneAuth.userId ?? BigInt(0),
        name: phoneAuth.userName ?? "",
        email: "",
        phone: phoneAuth.phone ?? "",
      }
    : null;

  return (
    <AppContext.Provider
      value={{
        userProfile,
        isLoadingProfile: false,
        userId: phoneAuth.userId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}

// ─── Local storage helpers ─────────────────────────────────────────────────────
export function useLocalUserId() {
  const phoneAuth = usePhoneAuth();

  const saveUserId = (id: bigint) => {
    localStorage.setItem("tm11_userId", id.toString());
  };

  const clearUserId = () => {
    localStorage.removeItem("tm11_userId");
  };

  return {
    userId: phoneAuth.userId,
    saveUserId,
    clearUserId,
  };
}
