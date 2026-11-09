'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { INITIAL_USERS } from './data-store';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: UserRole) => void;
  loginWithPhone: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: {
    name: string;
    phone: string;
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
  // Default to Mary (Student) for instant student browsing, or null
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[4]); // Mary Atuhaire

  useEffect(() => {
    const saved = localStorage.getItem('hostel_connect_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        // use default
      }
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

  const loginWithPhone = async (phone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    if (otp !== '123456' && otp.length !== 6) {
      return { success: false, error: 'Invalid 6-digit OTP code. (Demo code: 123456)' };
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    const user = INITIAL_USERS.find(u => u.phone.includes(cleanPhone.slice(-9)));

    if (user) {
      saveUser(user);
      return { success: true };
    }

    // Auto-create simple student user if not found
    const newUser: User = {
      id: `usr_${Date.now()}`,
      phone,
      name: 'Hostel Seeker',
      role: 'student',
      status: 'active',
      isVerified: true,
      createdAt: new Date().toISOString()
    };
    saveUser(newUser);
    return { success: true };
  };

  const registerUser = async (data: {
    name: string;
    phone: string;
    role: UserRole;
    university?: string;
    course?: string;
    businessName?: string;
    idNumber?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      phone: data.phone,
      name: data.name,
      role: data.role,
      status: 'active',
      isVerified: data.role === 'student', // Students verified by phone OTP
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
        loginWithPhone,
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
