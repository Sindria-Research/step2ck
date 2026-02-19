import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { User } from '../api/types';
import { api } from '../api/api';
import { setToken } from '../api/request';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialised = useRef(false);

  const fetchBackendUser = useCallback(async () => {
    try {
      const u = await api.auth.me();
      setUser(u);
    } catch {
      setToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          setToken(data.session.access_token);
          await fetchBackendUser();
        } else {
          setToken(null);
          setUser(null);
        }
      } else {
        const token = localStorage.getItem('token');
        if (!token) {
          setUser(null);
        } else {
          await fetchBackendUser();
        }
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchBackendUser]);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    const AUTH_INIT_TIMEOUT_MS = 8_000;
    const timeout = setTimeout(() => {
      setLoading(false);
    }, AUTH_INIT_TIMEOUT_MS);

    refreshUser().finally(() => clearTimeout(timeout));

    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.access_token) {
            setToken(session.access_token);
            await fetchBackendUser();
          }
        } else if (event === 'SIGNED_OUT') {
          setToken(null);
          setUser(null);
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser, fetchBackendUser]);

  const login = useCallback(
    async (email: string, password?: string) => {
      const res = await api.auth.login(email, password);
      setToken(res.access_token);
      setUser(res.user);
    },
    [],
  );

  const loginWithGoogle = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
