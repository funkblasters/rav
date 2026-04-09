import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { gql } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import { tokenStore } from "@/lib/tokenStore";

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: "ADMIN" | "MEMBER";
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const REFRESH = gql`
  mutation Refresh {
    refresh {
      token
      user { id email displayName role }
    }
  }
`;

const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to restore the session via the refresh token cookie
  useEffect(() => {
    apolloClient
      .mutate({ mutation: REFRESH })
      .then(({ data }) => {
        if (data?.refresh) {
          tokenStore.set(data.refresh.token);
          setUser(data.refresh.user);
        }
      })
      .catch(() => {
        // No valid refresh token — user needs to log in
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((token: string, newUser: AuthUser) => {
    tokenStore.set(token);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    apolloClient
      .mutate({ mutation: LOGOUT })
      .catch(() => {})
      .finally(() => {
        tokenStore.set(null);
        setUser(null);
        apolloClient.clearStore();
      });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
