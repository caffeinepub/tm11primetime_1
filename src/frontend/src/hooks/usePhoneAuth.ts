import { useState } from "react";

const STORAGE_PHONE = "tm11_phone";
const STORAGE_USER_ID = "tm11_userId";
const STORAGE_USER_NAME = "tm11_userName";

function readStorage() {
  const phone = localStorage.getItem(STORAGE_PHONE);
  const userIdStr = localStorage.getItem(STORAGE_USER_ID);
  const userName = localStorage.getItem(STORAGE_USER_NAME);
  return {
    phone: phone ?? null,
    userId: userIdStr ? BigInt(userIdStr) : null,
    userName: userName ?? null,
  };
}

export function usePhoneAuth() {
  const [auth, setAuth] = useState<{
    phone: string | null;
    userId: bigint | null;
    userName: string | null;
  }>(() => readStorage());

  const login = (phone: string, userId: bigint | null, userName: string) => {
    localStorage.setItem(STORAGE_PHONE, phone);
    if (userId !== null) {
      localStorage.setItem(STORAGE_USER_ID, userId.toString());
    }
    localStorage.setItem(STORAGE_USER_NAME, userName);
    setAuth({ phone, userId, userName });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_PHONE);
    localStorage.removeItem(STORAGE_USER_ID);
    localStorage.removeItem(STORAGE_USER_NAME);
    setAuth({ phone: null, userId: null, userName: null });
  };

  const isLoggedIn = !!auth.phone;

  return {
    phone: auth.phone,
    userId: auth.userId,
    userName: auth.userName,
    isLoggedIn,
    login,
    logout,
  };
}
