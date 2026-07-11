import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/auth";

import { toast } from "./use-toast";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (user: any) => void;
  logout: () => void;
  updateUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intercept fetch to handle 401 Unauthorized globally (session expiration)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        const pathname = window.location.pathname;
        if (pathname !== "/login" && pathname !== "/register" && pathname !== "/") {
          setUser(null);
          toast({
            title: "انتهت صلاحية الجلسة",
            description: "يرجى تسجيل الدخول مرة أخرى لمتابعة الاستخدام.",
            variant: "destructive",
          });
        }
      }
      return response;
    };

    // On app mount, verify cookie authenticity with the backend
    authService.getMe()
      .then((latestUser) => {
        setUser(latestUser);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
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
    // Clear cookie on the backend
    authService.logout()
      .then(() => {
        setUser(null);
      })
      .catch(() => {
        // Fallback: clear state locally anyway
        setUser(null);
      });
  };

  const updateUser = (updatedUser: any) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
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
