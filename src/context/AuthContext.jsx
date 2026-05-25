import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Dynamic Server URL helper
export const getBaseURL = () => {
  const savedUrl = localStorage.getItem('bakery_server_url');
  if (savedUrl) {
    return savedUrl.replace(/\/$/, ''); // Remove trailing slash if present
  }
  // Browser proxy default
  if (typeof window !== 'undefined' && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost:5173')) {
    return '';
  }
  // Default fallback to local Express server
  return 'http://localhost:5000';
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverUrl, setServerUrl] = useState(getBaseURL());

  // Listen to changes in server url config
  const updateServerUrl = useCallback((newUrl) => {
    localStorage.setItem('bakery_server_url', newUrl);
    setServerUrl(newUrl);
    // Reload active session
    checkSession();
  }, []);

  // Check if session cookie is valid on load
  const checkSession = useCallback(async () => {
    const baseUrl = getBaseURL();
    try {
      const response = await fetch(`${baseUrl}/api/session`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error checking active session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession, serverUrl]);

  // Login with PIN
  const login = useCallback(async (pin, role) => {
    const baseUrl = getBaseURL();
    try {
      const response = await fetch(`${baseUrl}/api/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ pin, role })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate.');
      }
      
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('Login authentication error:', err);
      throw err;
    }
  }, []);

  // Logout session
  const logout = useCallback(async () => {
    const baseUrl = getBaseURL();
    try {
      await fetch(`${baseUrl}/api/session`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Logout request error:', err);
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkSession, serverUrl, updateServerUrl }}>
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
