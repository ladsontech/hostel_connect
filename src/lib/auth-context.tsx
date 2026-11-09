'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { INITIAL_USERS } from './data-store';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: UserRole) => void;
  loginWithCredentials: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: {
    name: string;
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
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[4]);

  useEffect(() => {
    const saved = localStorage.getItem('hostel_connect_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
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
      saveUser(target);
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
