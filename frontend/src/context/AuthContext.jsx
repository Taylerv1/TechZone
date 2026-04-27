import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getProfile, loginUser, logoutUser, registerUser } from '../api/client.js';

const AuthContext = createContext(null);
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => (
    localStorage.getItem(ACCESS_TOKEN_KEY) || ''
  ));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(accessToken));

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
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        if (isMounted) {
          setAccessToken('');
          setUser(null);
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

  function clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken('');
    setUser(null);
  }

  async function login(credentials) {
    const tokens = await loginUser(credentials);
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    setAccessToken(tokens.access);
    const profile = await getProfile(tokens.access);
    setUser(profile);
  }

  async function register(payload) {
    await registerUser(payload);
    await login({
      username: payload.username,
      password: payload.password,
    });
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
