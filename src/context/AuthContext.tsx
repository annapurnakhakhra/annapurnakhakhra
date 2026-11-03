import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { customerService, type CustomerProfilePayload } from '../services/customer';

export interface UserProfile {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (identifier: string | { email?: string; phone?: string; channel?: string }) => Promise<any>;
  verifyOtp: (identifier: string | { email?: string; phone?: string }, otp: string) => Promise<any>;
  updateProfile: (payload: CustomerProfilePayload) => Promise<any>;
  refreshProfile: () => Promise<UserProfile | null>;
  logout: () => void;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  sendOtp: async () => {},
  verifyOtp: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => null,
  logout: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('userToken') || localStorage.getItem('annapurna_token');
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    const currentToken =
      localStorage.getItem('userToken') ||
      localStorage.getItem('annapurna_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('accessToken');

    if (!currentToken) {
      setUser(null);
      return null;
    }

    try {
      const raw = await customerService.getProfile();
      const profile = raw?.data?.customer || raw?.data || raw?.customer || raw;
      if (profile && (profile.id || profile.email || profile.first_name || profile.firstName || profile.phone)) {
        const normalized: UserProfile = {
          ...profile,
          id: profile.id,
          first_name: profile.first_name || profile.firstName || '',
          last_name: profile.last_name || profile.lastName || '',
          email: profile.email || '',
          phone: profile.phone || '',
        };
        setUser(normalized);
        return normalized;
      }
      return null;
    } catch (err) {
      console.error('Failed to load profile in AuthProvider:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setIsLoading(true);
      const currentToken =
        localStorage.getItem('userToken') ||
        localStorage.getItem('annapurna_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('accessToken');

      if (currentToken) {
        setToken(currentToken);
        await fetchProfile();
      } else {
        setToken(null);
        setUser(null);
      }
      if (mounted) setIsLoading(false);
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [fetchProfile]);

  const sendOtp = useCallback(async (identifier: string | { email?: string; phone?: string; channel?: string }) => {
    return await customerService.sendOtp(identifier);
  }, []);

  const verifyOtp = useCallback(async (identifier: string | { email?: string; phone?: string }, otp: string) => {
    const result = await customerService.verifyOtp(identifier, otp);
    const resolvedToken =
      result?.token ||
      result?.jwt ||
      result?.userToken ||
      result?.accessToken ||
      result?.data?.token ||
      result?.data?.jwt ||
      result?.data?.accessToken;

    if (resolvedToken) {
      setToken(resolvedToken);
      localStorage.setItem('userToken', resolvedToken);
      localStorage.setItem('annapurna_token', resolvedToken);
    }

    const responseUser =
      result?.data?.customer ||
      result?.customer ||
      result?.data?.user ||
      result?.user ||
      result?.data;

    const phoneVal =
      typeof identifier === 'string' && !identifier.includes('@')
        ? identifier.replace(/\D/g, '').slice(-10)
        : (typeof identifier === 'object' ? identifier.phone : '');

    const emailVal =
      typeof identifier === 'string' && identifier.includes('@')
        ? identifier.trim().toLowerCase()
        : (typeof identifier === 'object' ? identifier.email : '');

    if (responseUser) {
      setUser({
        ...responseUser,
        id: responseUser.id,
        first_name: responseUser.first_name || responseUser.firstName || '',
        last_name: responseUser.last_name || responseUser.lastName || '',
        email: responseUser.email || emailVal || '',
        phone: responseUser.phone || phoneVal || '',
      });
    } else {
      setUser((prev) => ({
        ...(prev || {}),
        first_name: prev?.first_name || '',
        last_name: prev?.last_name || '',
        email: prev?.email || emailVal || '',
        phone: prev?.phone || phoneVal || '',
      }));
    }

    await fetchProfile();
    return result;
  }, [fetchProfile]);

  const updateProfile = useCallback(async (payload: CustomerProfilePayload) => {
    const result = await customerService.updateProfile(payload);
    await fetchProfile();
    return result;
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    return await fetchProfile();
  }, [fetchProfile]);

  const logout = useCallback(() => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('annapurna_token');
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        sendOtp,
        verifyOtp,
        updateProfile,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
};
