export type UserRole = 'student' | 'broker' | 'custodian' | 'admin';
export type AdminRole = 'superadmin' | 'verifier' | 'moderator' | 'finance';

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  adminRole?: AdminRole;
  status: 'active' | 'suspended' | 'deleted';
  isVerified: boolean;
  avatarUrl?: string;
  
  // Student specific
  university?: string;
  course?: string;
  
  // Broker & Custodian specific
  idNumber?: string;
  businessName?: string;
  scoutCount?: number;
  
  createdAt: string;
}

export type HostelStatus = 'unclaimed' | 'claimed' | 'suspended';

export interface RoomType {
  id: string;
  hostelId: string;
  name: string; // e.g. Single, Double, Self-contained Single, 4 in a room
  type: 'single' | 'double' | 'triple' | 'quad' | 'self_contained_single' | 'self_contained_double';
  rentUgx: number; // Stored as integer UGX
  roomsTotal: number;
  roomsAvailable: number;
  updatedAt: string;
  updatedBy: string; // Custodian user ID
}

export interface HostelPhoto {
  id: string;
  url: string;
  caption?: string;
  isCover: boolean;
  order: number;
}

export interface Hostel {
  id: string;
  name: string;
  normalizedName: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  landmark: string;
  area: string; // e.g., Kikoni, Makerere, Nakawa, Banda, Sir Apollo, Katanga
  campus: string; // e.g., Makerere University, MUBS, Kyambogo University
  distanceCampusApprox: string; // e.g. "5 min walk from Makerere Main Gate"
  status: HostelStatus;
  verifiedOwnerId?: string; // Custodian who owns it
  scoutUserId?: string; // First seller who added the hostel
  ratingAvg: number;
  ratingCount: number;
  genderPolicy: 'mixed' | 'girls_only' | 'boys_only';
  amenities: string[]; // ['water', 'security', 'wifi', 'power_backup', 'meals', 'shuttle', 'gym']
  photos: HostelPhoto[];
  rooms: RoomType[];
  lastAvailabilityConfirmedAt: string;
  createdAt: string;
  viewCount: number;
  saveCount: number;
}

export interface Offer {
  id: string;
  hostelId: string;
  userId: string;
  userName: string;
  userRole: 'custodian' | 'broker';
  isVerified: boolean;
  isAuthorised: boolean; // Custodian approved for this hostel
  accessFeeUgx: number; // Mandatory for brokers, 0 or positive UGX
  contactPhone: string;
  whatsapp: string;
  status: 'active' | 'hidden';
  notes?: string;
  createdAt: string;
  responseRatePct: number;
}

export type LeadType = 'contact_tap' | 'call' | 'whatsapp' | 'save';

export interface Lead {
  id: string;
  studentId: string;
  studentName?: string;
  studentPhone?: string;
  hostelId: string;
  offerId?: string;
  type: LeadType;
  timestamp: string;
}

export interface SubscriptionPlan {
  id: string;
  role: 'custodian' | 'broker';
  name: string;
  priceUgx: number;
  hostelCap: number; // e.g. 1 for custodian, 5 or 20 for broker tiers
  durationDays: number; // typically 120 days for a university semester
  features: string[];
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  isTrial: boolean;
  startDate: string;
  endDate: string;
  activeHostelIds: string[];
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  subscriptionId: string;
  amountUgx: number;
  provider: 'mtn_momo' | 'airtel_money';
  phone: string;
  reference: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}

export interface Review {
  id: string;
  hostelId: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  rating: number; // 1 to 5
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  sellerReply?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterPhone?: string;
  targetType: 'hostel' | 'offer' | 'review';
  targetId: string;
  targetName: string;
  reason: 'fake_listing' | 'wrong_price' | 'wrong_photos' | 'already_taken' | 'duplicate' | 'scam' | 'abusive';
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  actionTaken?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
  timestamp: string;
}
