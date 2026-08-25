import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getCurrentUser } from './dailyLogApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user_info');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await getCurrentUser();
          if (res && res.data) {
            const savedUser = localStorage.getItem('user_info');
            const parsedSavedUser = savedUser ? JSON.parse(savedUser) : {};
            const mergedUser = {
              ...res.data,
              designation: parsedSavedUser.designation || 'Software Engineer',
            };
            setUser(mergedUser);
            localStorage.setItem('user_info', JSON.stringify(mergedUser));
          }
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          logoutLocally();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const saveAuthData = (userData, accessToken, customDesignation = null) => {
    const finalUser = {
      ...userData,
      designation: customDesignation || userData.designation || 'Software Engineer',
    };
    setUser(finalUser);
    setToken(accessToken);
    localStorage.setItem('user_info', JSON.stringify(finalUser));
    localStorage.setItem('access_token', accessToken);
  };

  const logoutLocally = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user_info');
    localStorage.removeItem('access_token');
  };

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    if (res && res.data) {
      saveAuthData(res.data.user, res.data.access_token);
      return res;
    }
    throw new Error('Login failed');
  };

  const register = async (name, email, password, password_confirmation, designation = 'Software Engineer') => {
    const res = await registerUser({ name, email, password, password_confirmation });
    if (res && res.data) {
      saveAuthData(res.data.user, res.data.access_token, designation);
      return res;
    }
    throw new Error('Registration failed');
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      logoutLocally();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
