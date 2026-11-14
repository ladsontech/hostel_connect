'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { INITIAL_USERS } from './data-store';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: UserRole) => void;
  updateUserProfile: (updates: {
    avatarUrl?: string;
    name?: string;
    phone?: string;
    businessName?: string;
  }) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithCredentials: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: {
    name: string;
    email?: string;
    phone?: string;
    phoneOrEmail: string;
    password?: string;
    role: UserRole;
    university?: string;
    course?: string;
    businessName?: string;
    idNumber?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to Mary (Student)
  const [currentUser, setCurrentUser] = useState<User | null>(
    () => INITIAL_USERS.find(u => u.role === 'student') || INITIAL_USERS[6] || INITIAL_USERS[0]
  );

  const PROFILE_OVERRIDES_KEY = 'hostel_connect_user_profiles';

  const getSavedProfileOverride = (userId: string): Partial<User> | null => {
    try {
      const raw = localStorage.getItem(PROFILE_OVERRIDES_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw);
      return map && typeof map === 'object' ? map[userId] || null : null;
    } catch {
      return null;
    }
  };

  const persistProfileOverride = (user: User) => {
    try {
      const raw = localStorage.getItem(PROFILE_OVERRIDES_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[user.id] = {
        avatarUrl: user.avatarUrl,
        name: user.name,
        phone: user.phone,
        businessName: user.businessName,
      };
      localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(map));
    } catch {
      // Ignore storage quota errors gracefully
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('hostel_connect_user');
    if (saved) {
      try {
        const parsed: User = JSON.parse(saved);
        const override = parsed?.id ? getSavedProfileOverride(parsed.id) : null;
        setCurrentUser(override ? { ...parsed, ...override } : parsed);
      } catch (e) {}
    }
  }, []);

  const saveUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('hostel_connect_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hostel_connect_user');
    }
  };

  const switchRole = (role: UserRole) => {
    const target = INITIAL_USERS.find(u => u.role === role);
    if (target) {
      const override = getSavedProfileOverride(target.id);
      const merged = override ? { ...target, ...override } : target;
      saveUser(merged);

      // Sync latest avatar & profile from server in background if available
      fetch(`/api/v1/users/profile?userId=${encodeURIComponent(target.id)}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data?.success && data.user) {
            saveUser({ ...merged, ...data.user });
          }
        })
        .catch(() => {});
    }
  };

  const updateUserProfile = async (updates: {
    avatarUrl?: string;
    name?: string;
    phone?: string;
    businessName?: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'You must be signed in to update your profile.' };
    }

    const optimisticUser: User = {
      ...currentUser,
      ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.businessName !== undefined ? { businessName: updates.businessName } : {}),
    };

    saveUser(optimisticUser);
    persistProfileOverride(optimisticUser);

    try {
      const res = await fetch('/api/v1/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          role: currentUser.role,
          name: optimisticUser.name,
          phone: optimisticUser.phone,
          businessName: optimisticUser.businessName,
          avatarUrl: updates.avatarUrl,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const merged = { ...optimisticUser, ...data.user };
        saveUser(merged);
        persistProfileOverride(merged);
        return { success: true, user: merged };
      }
      return { success: false, error: data.error || 'Failed to save profile update.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error while updating profile.' };
    }
  };

  const loginWithCredentials = async (
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!identifier || identifier.trim().length === 0) {
      return { success: false, error: 'Please enter your phone number or email address' };
    }

    const cleanInput = identifier.trim().toLowerCase();
    
    // Check if matching an existing seed user by email or phone digits
    const user = INITIAL_USERS.find(u => {
      const matchEmail = u.email && u.email.toLowerCase() === cleanInput;
      const matchPhone = u.phone && cleanInput.includes(u.phone.replace(/\D/g, '').slice(-9));
      return matchEmail || matchPhone;
    });

    if (user) {
      saveUser(user);
      return { success: true };
    }

    // Auto-create or login seamlessly without OTP
    const isEmail = cleanInput.includes('@');
    const newUser: User = {
      id: `usr_${Date.now()}`,
      phone: isEmail ? '+256700000000' : identifier,
      email: isEmail ? identifier : undefined,
      name: isEmail ? identifier.split('@')[0] : 'Campus Student',
      role: 'student',
      status: 'active',
      isVerified: true,
      createdAt: new Date().toISOString()
    };
    saveUser(newUser);
    return { success: true };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    // Instant Google OAuth simulation
    const googleUser: User = {
      id: `usr_google_${Date.now()}`,
      name: 'Google Student Account',
      email: 'student@gmail.com',
      phone: '+256770123456',
      role: 'student',
      status: 'active',
      isVerified: true,
      university: 'Makerere University',
      createdAt: new Date().toISOString()
    };
    saveUser(googleUser);
    return { success: true };
  };

  const registerUser = async (data: {
    name: string;
    email?: string;
    phone?: string;
    phoneOrEmail?: string;
    password?: string;
    role: UserRole;
    university?: string;
    course?: string;
    businessName?: string;
    idNumber?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const emailVal = data.email || (data.phoneOrEmail && data.phoneOrEmail.includes('@') ? data.phoneOrEmail : undefined);
    const phoneVal = data.phone || (data.phoneOrEmail && !data.phoneOrEmail.includes('@') ? data.phoneOrEmail : '+256700000000');
    const newUser: User = {
      id: `usr_${Date.now()}`,
      phone: phoneVal,
      email: emailVal,
      name: data.name,
      role: data.role,
      status: 'active',
      isVerified: true,
      university: data.university,
      course: data.course,
      businessName: data.businessName,
      idNumber: data.idNumber,
      createdAt: new Date().toISOString()
    };

    saveUser(newUser);
    return { success: true };
  };

  const logout = () => {
    saveUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser: saveUser,
        switchRole,
        updateUserProfile,
        loginWithCredentials,
        loginWithGoogle,
        registerUser,
        logout,
        isAuthenticated: !!currentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
