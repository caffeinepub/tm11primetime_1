import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserProfile } from "../backend.d";
import { useInternetIdentity } from "./useInternetIdentity";
import { useCallerUserProfile } from "./useQueries";

interface AppContextValue {
  userProfile: UserProfile | null | undefined;
  isLoadingProfile: boolean;
  userId: bigint | null;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading } = useCallerUserProfile();

  const userId = userProfile?.userId ?? null;

  return (
    <AppContext.Provider
      value={{
        userProfile: identity ? userProfile : null,
        isLoadingProfile: isLoading,
        userId,
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

// ─── Local storage helpers for demo purposes ─────────────────────────────────
export function useLocalUserId() {
  const [userId, setUserId] = useState<bigint | null>(() => {
    const stored = localStorage.getItem("tm11_userId");
    return stored ? BigInt(stored) : null;
  });

  const saveUserId = (id: bigint) => {
    localStorage.setItem("tm11_userId", id.toString());
    setUserId(id);
  };

  const clearUserId = () => {
    localStorage.removeItem("tm11_userId");
    setUserId(null);
  };

  return { userId, saveUserId, clearUserId };
}
