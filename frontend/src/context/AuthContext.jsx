import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  configureAuthSession,
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
} from '../api/client.js';

const AuthContext = createContext(null);
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => (
    localStorage.getItem(ACCESS_TOKEN_KEY) || ''
  ));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(accessToken));

  function applyTokens(tokens) {
    if (tokens.access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
      setAccessToken(tokens.access);
    }

    if (tokens.refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    }
  }

  function clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken('');
    setUser(null);
  }

  useEffect(() => {
    configureAuthSession({
      getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY) || '',
      getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY) || '',
      updateTokens: applyTokens,
      clearSession,
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      if (!accessToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getProfile(accessToken);
        if (isMounted) {
          setUser(profile);
        }
      } catch {
        if (isMounted) {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  async function login(credentials) {
    const tokens = await loginUser(credentials);
    applyTokens(tokens);
    const profile = await getProfile(tokens.access);
    setUser(profile);
  }

  async function register(payload) {
    return registerUser(payload);
  }

  async function logout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    try {
      if (accessToken && refreshToken) {
        await logoutUser(accessToken, { refresh: refreshToken });
      }
    } catch {
      // Clear the local session even if the backend token is already expired.
    } finally {
      clearSession();
    }
  }

  async function refreshProfile() {
    if (!accessToken) {
      return null;
    }
    const profile = await getProfile(accessToken);
    setUser(profile);
    return profile;
  }

  const value = useMemo(() => ({
    accessToken,
    user,
    isAuthenticated: Boolean(accessToken && user),
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
  }), [accessToken, user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
