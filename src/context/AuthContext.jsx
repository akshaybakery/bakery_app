import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Dynamic Server URL helper
export const getBaseURL = () => {
  const savedUrl = localStorage.getItem('bakery_server_url');
  if (savedUrl) {
    return savedUrl.replace(/\/$/, ''); // Remove trailing slash if present
  }
  
  // If running inside Capacitor mobile app, window.location.origin is localhost or capacitor://
  if (typeof window !== 'undefined' && (window.location.origin.includes('localhost') || window.location.origin.startsWith('capacitor'))) {
    // Mobile APK automatically defaults to your secure Render cloud database!
    return 'https://akshay-bakery.onrender.com';
  }
  
  // Browser proxy default for live website
  if (typeof window !== 'undefined' && window.location.origin.startsWith('http') && !window.location.origin.includes('localhost:5173')) {
    return '';
  }
  
  // Default fallback to live Render cloud server
  return 'https://akshay-bakery.onrender.com';
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverUrl, setServerUrl] = useState(getBaseURL());

  // Listen to changes in server url config
  const updateServerUrl = useCallback((newUrl) => {
    let formattedUrl = newUrl.trim();
    if (formattedUrl) {
      // If user typed only the Render service name (e.g. 'akshay-bakery') without a dot or protocol
      if (!formattedUrl.includes('.') && formattedUrl.toLowerCase() !== 'localhost') {
        formattedUrl = `${formattedUrl}.onrender.com`;
      }
      
      // Auto-prefix protocols if missing
      if (!/^https?:\/\//i.test(formattedUrl)) {
        if (/(^localhost)|(^192\.168)|(^10\.)|(^172\.(1[6-9]|2[0-9]|3[0-1]))/i.test(formattedUrl)) {
          formattedUrl = 'http://' + formattedUrl;
        } else {
          formattedUrl = 'https://' + formattedUrl;
        }
      }
    }
    
    localStorage.setItem('bakery_server_url', formattedUrl);
    setServerUrl(formattedUrl);
    // Reload active session
    checkSession();
  }, [checkSession]);

  // Check if session cookie is valid on load
  const checkSession = useCallback(async () => {
    const baseUrl = getBaseURL();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5 seconds timeout
    
    try {
      const response = await fetch(`${baseUrl}/api/session`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
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
