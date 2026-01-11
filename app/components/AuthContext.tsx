'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getAuth, AuthenticatedUser } from '../lib/auth';

type AuthContextType = {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    auth.init().then((authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async () => {
    const auth = getAuth();
    await auth.login();
  }, []);

  const logout = useCallback(async () => {
    const auth = getAuth();
    await auth.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
