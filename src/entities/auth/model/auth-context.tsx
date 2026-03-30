"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";

import { sessionQueryOptions } from "../api/auth-api";
import type { AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isError: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sessionQuery = useQuery(sessionQueryOptions());

  const value: AuthContextValue = {
    user: sessionQuery.data?.user ?? null,
    isAuthenticated: Boolean(sessionQuery.data?.user),
    isLoading: sessionQuery.isLoading,
    isError: sessionQuery.isError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
