import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/auth";
import type { AuthUser } from "@shared/dtos-and-types";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (user: any) => void;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intercept fetch globally: if an authenticated API call returns 401 Unauthorized, reset user
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        const url =
          typeof args[0] === "string"
            ? args[0]
            : (args[0] as Request)?.url || "";
        const isAuthAttempt =
          url.includes("/auth/login") || url.includes("/auth/register");

        if (!isAuthAttempt) {
          setUser(null);
        }
      }
      return response;
    };

    // Verify session on app mount
    authService.getMe().then((latestUser) => {
      setUser(latestUser || null);
      setLoading(false);
    });

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const login = (newUser: any) => {
    setUser(newUser);
  };

  const logout = () => {
    authService
      .logout()
      .finally(() => {
        setUser(null);
      });
  };

  const refreshUser = async () => {
    try {
      const latestUser = await authService.getMe();
      setUser(latestUser || null);
      return latestUser || null;
    } catch {
      setUser(null);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
