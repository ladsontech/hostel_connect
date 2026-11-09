import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats integer amount to Ugandan Shilling (UGX) standard currency string
 * e.g., 850000 -> "UGX 850,000"
 */
export function formatUGX(amount: number): string {
  if (isNaN(amount)) return 'UGX 0';
  return `UGX ${Math.round(amount).toLocaleString('en-US')}`;
}

/**
 * Format date in Africa/Kampala local format
 */
export function formatDateEAT(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-UG', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Africa/Kampala',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Generate standard WhatsApp click-to-chat deep link
 */
export function getWhatsAppDeepLink(phone: string, text: string): string {
  // Normalize phone number (strip +, spaces, dashes)
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '256' + cleanPhone.slice(1);
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generate tel: phone dialer link
 */
export function getPhoneDialerLink(phone: string): string {
  return `tel:${phone.replace(/\s+/g, '')}`;
}
