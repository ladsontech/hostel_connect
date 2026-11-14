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

export type RoomOfferingKind = 'single_only' | 'double_only' | 'both' | 'other' | 'none';

/** Returns true if a room type is any Single variant (standard or self-contained). */
export function isSingleRoomType(type?: string): boolean {
  return type === 'single' || type === 'self_contained_single';
}

/** Returns true if a room type is any Double variant (standard or self-contained). */
export function isDoubleRoomType(type?: string): boolean {
  return type === 'double' || type === 'self_contained_double';
}

/**
 * Summarizes whether a hostel offers Single rooms alone, Double rooms alone, or both.
 */
export function getRoomOfferingSummary(rooms: Array<{ type?: string }> = []): {
  kind: RoomOfferingKind;
  label: string;
  shortLabel: string;
  hasSingle: boolean;
  hasDouble: boolean;
} {
  if (!rooms || rooms.length === 0) {
    return { kind: 'none', label: 'No rooms listed', shortLabel: 'No rooms', hasSingle: false, hasDouble: false };
  }
  const hasSingle = rooms.some((r) => isSingleRoomType(r.type));
  const hasDouble = rooms.some((r) => isDoubleRoomType(r.type));

  if (hasSingle && !hasDouble) {
    return { kind: 'single_only', label: 'Single Rooms Only', shortLabel: 'Single Only', hasSingle: true, hasDouble: false };
  }
  if (hasDouble && !hasSingle) {
    return { kind: 'double_only', label: 'Double Rooms Only', shortLabel: 'Double Only', hasSingle: false, hasDouble: true };
  }
  if (hasSingle && hasDouble) {
    return { kind: 'both', label: 'Single & Double', shortLabel: 'Single & Double', hasSingle: true, hasDouble: true };
  }
  return { kind: 'other', label: 'Shared / Group Rooms', shortLabel: 'Shared Rooms', hasSingle: false, hasDouble: false };
}

/**
 * Evaluates whether a hostel's rooms match a roomType filter (supporting both broad and single/double-only filters).
 */
export function matchesRoomTypeFilter(rooms: Array<{ type?: string }> = [], roomType?: string | null): boolean {
  if (!roomType) return true;
  if (roomType === 'any_single') return rooms.some((r) => isSingleRoomType(r.type));
  if (roomType === 'any_double') return rooms.some((r) => isDoubleRoomType(r.type));
  if (roomType === 'single_only') return getRoomOfferingSummary(rooms).kind === 'single_only';
  if (roomType === 'double_only') return getRoomOfferingSummary(rooms).kind === 'double_only';
  if (roomType === 'both') return getRoomOfferingSummary(rooms).kind === 'both';
  return rooms.some((r) => r.type === roomType);
}

/** Evaluates whether a single room entry matches an active roomType filter. */
export function matchesIndividualRoomType(room: { type?: string }, roomType?: string | null): boolean {
  if (!roomType) return true;
  if (roomType === 'any_single' || roomType === 'single_only') return isSingleRoomType(room.type);
  if (roomType === 'any_double' || roomType === 'double_only') return isDoubleRoomType(room.type);
  if (roomType === 'both') return isSingleRoomType(room.type) || isDoubleRoomType(room.type);
  return room.type === roomType;
}
