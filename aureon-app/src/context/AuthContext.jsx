import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialUsers } from '../services/mockData';
import { logAuditEvent } from '../services/auditLogger';
import { apiClient } from '../services/apiClient';

const AuthContext = createContext();

const AUTH_USER_KEY = 'aureon_current_user';
const TOKEN_KEY = 'aureon_jwt_access_token';
const REFRESH_TOKEN_KEY = 'aureon_jwt_refresh_token';
const SESSION_TOKEN_KEY = 'aureon_user_session_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);

  const [sessionExpiry, setSessionExpiry] = useState(3600); // 1 hour session timer
  const [failedLoginsCount, setFailedLoginsCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [activeSessions, setActiveSessions] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Clear stale storage on initial mount
  useEffect(() => {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }, []);

  // Session timer countdown & Lockout countdown
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      setSessionExpiry(prev => {
        if (prev <= 1) {
          logout('SESSION_EXPIRED');
          return 3600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          setFailedLoginsCount(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked]);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const login = async (email, password) => {
    if (isLocked) {
      return {
        success: false,
        message: `Account security lockout engaged. Retry in ${Math.ceil(lockoutRemaining / 60)} minutes or contact System Admin.`
      };
    }

    const cleanInput = (email || '').trim().toLowerCase();

    // 1. Try Django REST Framework API Backend (Port 8000)
    try {
      const drfRes = await fetch('http://127.0.0.1:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanInput, password })
      });

      if (drfRes.status === 429) {
        setIsLocked(true);
        setLockoutRemaining(900); // 15 minutes lockout
        return { success: false, message: 'Account locked due to 5 consecutive failed login attempts.' };
      }

      if (drfRes.ok) {
        const drfData = await drfRes.json();
        const loggedUser = drfData.user;
        const newSessionToken = drfData.session_token || `sess_${loggedUser.id}_${Date.now()}`;

        setUser(loggedUser);
        setAccessToken(drfData.access);
        setRefreshToken(drfData.refresh);
        setSessionToken(newSessionToken);
        setFailedLoginsCount(0);

        localStorage.setItem(TOKEN_KEY, drfData.access);
        localStorage.setItem(REFRESH_TOKEN_KEY, drfData.refresh);
        localStorage.setItem(SESSION_TOKEN_KEY, newSessionToken);

        logAuditEvent({
          user: loggedUser,
          role: loggedUser.role_code || loggedUser.role,
          action: 'USER_LOGIN_SUCCESS',
          resource: `Django REST Session Created (${newSessionToken})`,
          status: 'SUCCESS'
        });

        showToast(`Welcome back, ${loggedUser.full_name || loggedUser.name}!`, 'success');
        return { success: true, user: loggedUser };
      }
    } catch (err) {
      // API offline fallback below
    }

    // 2. Client-Side Fallback Validation & Lockout Tracking
    const foundUser = initialUsers.find(u => 
      u.email.toLowerCase() === cleanInput ||
      u.role.toLowerCase().includes(cleanInput) ||
      u.email.split('@')[0].toLowerCase() === cleanInput
    );
    
    if (!foundUser) {
      const newCount = failedLoginsCount + 1;
      setFailedLoginsCount(newCount);
      if (newCount >= 5) {
        setIsLocked(true);
        setLockoutRemaining(900); // 15 minutes lockout
        return { success: false, message: 'Account locked due to 5 consecutive failed login attempts.' };
      }
      return { success: false, message: `Invalid user credentials (${newCount}/5 failed attempts). Try demo logins below.` };
    }

    const newAccess = `jwt_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRefresh = `jwt_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSessToken = `sess_${foundUser.id}_${Date.now()}`;

    setUser(foundUser);
    setAccessToken(newAccess);
    setRefreshToken(newRefresh);
    setSessionToken(newSessToken);
    setFailedLoginsCount(0);

    localStorage.setItem(TOKEN_KEY, newAccess);
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
    localStorage.setItem(SESSION_TOKEN_KEY, newSessToken);

    // Seed mock active session list
    setActiveSessions([
      {
        id: `sess_1`,
        device: 'Current Web Browser (Windows 11 / Chrome)',
        ip: '127.0.0.1 (Localhost)',
        loginAt: new Date().toLocaleTimeString(),
        isCurrent: true
      }
    ]);

    logAuditEvent({
      user: foundUser,
      role: foundUser.role,
      action: 'AUTH_LOGIN_SUCCESS',
      resource: `JWT Token & Session Issued (${newSessToken})`,
      status: 'SUCCESS'
    });

    showToast(`Welcome back, ${foundUser.name || foundUser.full_name}! Signed in as ${foundUser.role}.`, 'success');
    return { success: true, user: foundUser };
  };

  const register = (data) => {
    const newUser = {
      id: `usr_${Date.now()}`,
      name: data.fullName || 'New Engineer',
      full_name: data.fullName || 'New Engineer',
      email: data.email,
      role: data.role || 'Developer',
      department: data.organization || 'Platform Engineering',
      avatar: data.fullName ? data.fullName.split(' ').map(n=>n[0]).join('') : 'NE',
    };
    setUser(newUser);
    showToast(`Account created successfully for ${data.fullName}!`, 'success');
  };

  const logout = async (reason = 'USER_LOGOUT') => {
    if (user) {
      logAuditEvent({
        user: user,
        role: user.role,
        action: reason === 'SESSION_EXPIRED' ? 'AUTH_SESSION_EXPIRED' : 'AUTH_LOGOUT',
        resource: 'User Session Terminated',
        status: 'SUCCESS'
      });
      try {
        await apiClient('/auth/logout', { method: 'POST' });
      } catch (e) {
        // ignore logout errors
      }
    }
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setSessionToken(null);
    setActiveSessions([]);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    showToast('Signed out of Aureon Engineering Workspace.', 'info');
  };

  // Direct login for a selected role account
  const switchRole = (targetRoleId) => {
    const targetUser = initialUsers.find(u => u.role === targetRoleId) || initialUsers[0];
    const newAccess = `jwt_access_${Date.now()}`;
    const newSessToken = `sess_${targetUser.id}_${Date.now()}`;

    setUser(targetUser);
    setAccessToken(newAccess);
    setSessionToken(newSessToken);
    setFailedLoginsCount(0);
    localStorage.setItem(TOKEN_KEY, newAccess);
    localStorage.setItem(SESSION_TOKEN_KEY, newSessToken);

    logAuditEvent({
      user: targetUser,
      role: targetRoleId,
      action: 'ROLE_ACCOUNT_LOGIN',
      resource: `Session Started for ${targetUser.name} (${targetRoleId})`,
      status: 'SUCCESS'
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        accessToken,
        refreshToken,
        sessionToken,
        sessionExpiry,
        failedLoginsCount,
        isLocked,
        lockoutRemaining,
        activeSessions,
        toastMessage,
        login,
        register,
        logout,
        switchRole,
        showToast,
        setToastMessage
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
