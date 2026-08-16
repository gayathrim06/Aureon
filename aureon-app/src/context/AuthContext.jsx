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

  // Restore user from localStorage on mount or set default
  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
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
        const rawUser = drfData.user;
        const loggedUser = {
          ...rawUser,
          role: rawUser.role_code || rawUser.role,
          name: rawUser.full_name || rawUser.name,
          avatar: rawUser.avatar_url || rawUser.avatar_preset || rawUser.profile_image || rawUser.avatar
        };
        const newSessionToken = drfData.session_token || `sess_${loggedUser.id}_${Date.now()}`;

        setUser(loggedUser);
        setAccessToken(drfData.access);
        setRefreshToken(drfData.refresh);
        setSessionToken(newSessionToken);
        setFailedLoginsCount(0);

        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(loggedUser));
        localStorage.setItem(TOKEN_KEY, drfData.access);
        localStorage.setItem(REFRESH_TOKEN_KEY, drfData.refresh);
        localStorage.setItem(SESSION_TOKEN_KEY, newSessionToken);

        logAuditEvent({
          user: loggedUser,
          role: loggedUser.role,
          action: 'USER_LOGIN_SUCCESS',
          resource: `Django REST Session Created (${newSessionToken})`,
          status: 'SUCCESS'
        });

        showToast(`Welcome back, ${loggedUser.name}! Authenticated via REST API.`, 'success');
        return { success: true, user: loggedUser };
      }
    } catch (err) {
      // Offline fallback
    }

    // 2. Client-Side Fallback Validation
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
        setLockoutRemaining(900);
        return { success: false, message: 'Account locked due to 5 consecutive failed login attempts.' };
      }
      return { success: false, message: `Invalid user credentials (${newCount}/5 failed attempts). Try 1-Click logins below.` };
    }

    const newAccess = `jwt_access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRefresh = `jwt_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSessToken = `sess_${foundUser.id}_${Date.now()}`;

    setUser(foundUser);
    setAccessToken(newAccess);
    setRefreshToken(newRefresh);
    setSessionToken(newSessToken);
    setFailedLoginsCount(0);

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(foundUser));
    localStorage.setItem(TOKEN_KEY, newAccess);
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
    localStorage.setItem(SESSION_TOKEN_KEY, newSessToken);

    logAuditEvent({
      user: foundUser,
      role: foundUser.role,
      action: 'AUTH_LOGIN_SUCCESS',
      resource: `JWT Token & Session Issued (${newSessToken})`,
      status: 'SUCCESS'
    });

    showToast(`Welcome back, ${foundUser.name}! Signed in as ${foundUser.role}.`, 'success');
    return { success: true, user: foundUser };
  };

  const register = (data) => {
    const newUser = {
      id: `usr_${Date.now()}`,
      name: data.fullName || 'New Engineer',
      full_name: data.fullName || 'New Engineer',
      email: data.email,
      role: data.role || 'Developer',
      department: data.department || 'Platform Engineering',
      avatar: data.fullName ? data.fullName.split(' ').map(n=>n[0]).join('') : 'NE',
    };
    setUser(newUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
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
      const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      try {
        await fetch('http://127.0.0.1:8000/api/v1/auth/logout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': accessToken ? `Bearer ${accessToken}` : ''
          },
          body: JSON.stringify({ refresh: storedRefresh })
        });
      } catch (e) {
        // ignore network error on logout
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
    sessionStorage.clear();
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    showToast('Signed out securely. All session data wiped.', 'info');
  };

  // Direct login for a selected role account (1-Click Login)
  const switchRole = (targetRoleId) => {
    const targetUser = initialUsers.find(u => u.role === targetRoleId) || initialUsers[0];
    const newAccess = `jwt_access_${Date.now()}`;
    const newSessToken = `sess_${targetUser.id}_${Date.now()}`;

    setUser(targetUser);
    setAccessToken(newAccess);
    setSessionToken(newSessToken);
    setFailedLoginsCount(0);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(targetUser));
    localStorage.setItem(TOKEN_KEY, newAccess);
    localStorage.setItem(SESSION_TOKEN_KEY, newSessToken);

    logAuditEvent({
      user: targetUser,
      role: targetRoleId,
      action: 'ROLE_ACCOUNT_LOGIN',
      resource: `Session Started for ${targetUser.name} (${targetRoleId})`,
      status: 'SUCCESS'
    });
    showToast(`Welcome, ${targetUser.name}! Signed in as ${targetRoleId.replace('ROLE_', '')}.`, 'success');
  };

  const updateProfile = async (updatedFields) => {
    setUser(prevUser => {
      const newUser = {
        ...(prevUser || {}),
        ...updatedFields,
        name: updatedFields.name || updatedFields.full_name || prevUser?.name || prevUser?.full_name || 'User',
        full_name: updatedFields.full_name || updatedFields.name || prevUser?.full_name || prevUser?.name || 'User',
        designation: updatedFields.designation || updatedFields.title || prevUser?.designation || prevUser?.title || 'Software Engineer',
        title: updatedFields.title || updatedFields.designation || prevUser?.title || prevUser?.designation || 'Software Engineer',
        department: updatedFields.department || prevUser?.department || 'Engineering',
        skills: updatedFields.skills || prevUser?.skills || ['React.js', 'Django', 'Python', 'Git']
      };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      return newUser;
    });

    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await fetch('http://127.0.0.1:8000/api/v1/users/me/', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            full_name: updatedFields.name || updatedFields.full_name,
            designation: updatedFields.designation || updatedFields.title,
            department: updatedFields.department
          })
        });
      } catch (err) {
        // Fallback to local storage update
      }
    }
    showToast('Profile updated successfully!', 'success');
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
        updateProfile,
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
