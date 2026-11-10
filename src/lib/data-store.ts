import {
  Hostel,
  Offer,
  User,
  Lead,
  SubscriptionPlan,
  UserSubscription,
  PaymentTransaction,
  Review,
  Report,
  AuditLog
} from '@/types';

// In-memory persistent state store for mock / runtime operations
export interface AppDatabase {
  users: User[];
  hostels: Hostel[];
  offers: Offer[];
  leads: Lead[];
  plans: SubscriptionPlan[];
  subscriptions: UserSubscription[];
  payments: PaymentTransaction[];
  reviews: Review[];
  reports: Report[];
  auditLogs: AuditLog[];
}

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_custodian_standard',
    role: 'custodian',
    name: 'Custodian Semester Pass',
    priceUgx: 50000, // 50,000 UGX per hostel per semester
    hostelCap: 1,
    durationDays: 120,
    features: [
      'Official Verified Owner badge',
      'Authoritative rent and room availability controls',
      'Approve & manage broker agents',
      'Full lead analytics (WhatsApp, Calls, Saves)',
      'Direct phone & WhatsApp contact on listing'
    ]
  },
  {
    id: 'plan_broker_starter',
    role: 'broker',
    name: 'Broker Starter Tier',
    priceUgx: 35000,
    hostelCap: 5,
    durationDays: 120,
    features: [
      'Attach offers to up to 5 hostels',
      'Disclose custom access fee per offer',
      'Verified Broker badge (with ID verification)',
      'Lead notifications & analytics'
    ]
  },
  {
    id: 'plan_broker_pro',
    role: 'broker',
    name: 'Broker Pro Campus Tier',
    priceUgx: 80000,
    hostelCap: 20,
    durationDays: 120,
    features: [
      'Attach offers to up to 20 hostels',
      'Priority offer listing rank in contact modal',
      'Weekly performance summary report',
      'Authorised Agent application to custodians'
    ]
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin_1',
    phone: '+256700000001',
    name: 'Sarah Akello (Admin)',
    email: 'admin@hostelconnect.ug',
    role: 'admin',
    adminRole: 'superadmin',
    status: 'active',
    isVerified: true,
    createdAt: '2026-01-01T08:00:00Z'
  },
  {
    id: 'usr_custodian_olympia',
    phone: '+256772111222',
    name: 'Patrick Mukasa',
    email: 'olympia@hostels.ug',
    role: 'custodian',
    status: 'active',
    isVerified: true,
    businessName: 'Olympia Hostels Ltd',
    idNumber: 'CM8920199201X',
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'usr_custodian_douglas',
    phone: '+256701333444',
    name: 'Grace Namubiru',
    role: 'custodian',
    status: 'active',
    isVerified: true,
    businessName: 'Douglas Villa Management',
    createdAt: '2026-01-12T11:30:00Z'
  },
  {
    id: 'usr_broker_brian',
    phone: '+256755888999',
    name: 'Brian Kigozi (Campus Scout)',
    role: 'broker',
    status: 'active',
    isVerified: true,
    idNumber: 'CM9901234455A',
    scoutCount: 4,
    createdAt: '2026-01-15T14:00:00Z'
  },
  {
    id: 'usr_student_mary',
    phone: '+256788555666',
    name: 'Mary Atuhaire',
    email: 'mary.atuhaire@students.mak.ac.ug',
    role: 'student',
    status: 'active',
    isVerified: true,
    university: 'Makerere University',
    course: 'BSc Software Engineering (Year 2)',
    createdAt: '2026-02-01T09:15:00Z'
  }
];

export const INITIAL_HOSTELS: Hostel[] = [
  {
    id: 'hst_olympia',
    name: 'Olympia Hostel',
    normalizedName: 'olympia',
    description: 'Premier student residence in Kikoni offering spacious modern self-contained rooms, 24/7 standby generator, high-speed WiFi, gym, swimming pool, and tight security with CCTV.',
    lat: 0.3345,
    lng: 32.5621,
    address: 'Kikoni, off Sir Apollo Kaggwa Road',
    landmark: 'Behind Makerere College School sports grounds',
    area: 'Kikoni',
    campus: 'Makerere University',
    distanceCampusApprox: '4 min walk to Makerere Western Gate',
    status: 'claimed',
    verifiedOwnerId: 'usr_custodian_olympia',
    scoutUserId: 'usr_broker_brian',
    ratingAvg: 4.8,
    ratingCount: 38,
    genderPolicy: 'mixed',
    amenities: ['water', 'security', 'wifi', 'power_backup', 'meals', 'shuttle', 'gym'],
    photos: [
      {
        id: 'p1',
        url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80',
        caption: 'Olympia Front Exterior & Compound',
        isCover: true,
        order: 1
      },
      {
        id: 'p2',
        url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
        caption: 'Spacious Self-contained Single Room',
        isCover: false,
        order: 2
      },
      {
        id: 'p3',
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80',
        caption: 'Study desk & wardrobe area',
        isCover: false,
        order: 3
      }
    ],
    rooms: [
      {
        id: 'rm_oly_single_sc',
        hostelId: 'hst_olympia',
        name: 'Single Self-Contained',
        type: 'self_contained_single',
        rentUgx: 1800000,
        roomsTotal: 60,
        roomsAvailable: 8,
        updatedAt: '2026-02-05T12:00:00Z',
        updatedBy: 'usr_custodian_olympia'
      },
      {
        id: 'rm_oly_double_sc',
        hostelId: 'hst_olympia',
        name: 'Double Self-Contained',
        type: 'self_contained_double',
        rentUgx: 1250000,
        roomsTotal: 80,
        roomsAvailable: 14,
        updatedAt: '2026-02-05T12:00:00Z',
        updatedBy: 'usr_custodian_olympia'
      }
    ],
    lastAvailabilityConfirmedAt: '2026-02-05T12:00:00Z',
    createdAt: '2026-01-10T10:00:00Z',
    viewCount: 1420,
    saveCount: 312
  },
  {
    id: 'hst_douglas',
    name: 'Douglas Villa Hostel',
    normalizedName: 'douglas',
    description: 'Renowned vibrant student hostel in Kikoni known for strong student community, shuttle service to campus, constant water reservoir, clean cafeteria, and study halls.',
    lat: 0.3361,
    lng: 32.5645,
    address: 'Kikoni B, Near Caltec Academy',
    landmark: 'Adjacent to St. Marys Hall',
    area: 'Kikoni',
    campus: 'Makerere University',
    distanceCampusApprox: '7 min walk / free shuttle every 20 mins',
    status: 'claimed',
    verifiedOwnerId: 'usr_custodian_douglas',
    ratingAvg: 4.5,
    ratingCount: 29,
    genderPolicy: 'mixed',
    amenities: ['water', 'security', 'wifi', 'power_backup', 'meals', 'shuttle'],
    photos: [
      {
        id: 'p4',
        url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
        caption: 'Douglas Villa Main Block',
        isCover: true,
        order: 1
      },
      {
        id: 'p5',
        url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef3?auto=format&fit=crop&w=1000&q=80',
        caption: 'Double room with balcony',
        isCover: false,
        order: 2
      },
      {
        id: 'p6',
        url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80',
        caption: 'Reading room & common area',
        isCover: false,
        order: 3
      }
    ],
    rooms: [
      {
        id: 'rm_doug_single',
        hostelId: 'hst_douglas',
        name: 'Single Non-Self Contained',
        type: 'single',
        rentUgx: 1100000,
        roomsTotal: 40,
        roomsAvailable: 5,
        updatedAt: '2026-02-04T10:00:00Z',
        updatedBy: 'usr_custodian_douglas'
      },
      {
        id: 'rm_doug_double',
        hostelId: 'hst_douglas',
        name: 'Double Shared Room',
        type: 'double',
        rentUgx: 850000,
        roomsTotal: 90,
        roomsAvailable: 19,
        updatedAt: '2026-02-04T10:00:00Z',
        updatedBy: 'usr_custodian_douglas'
      }
    ],
    lastAvailabilityConfirmedAt: '2026-02-04T10:00:00Z',
    createdAt: '2026-01-12T11:30:00Z',
    viewCount: 980,
    saveCount: 195
  },
  {
    id: 'hst_dreamworld',
    name: 'Dream World Hostel',
    normalizedName: 'dream world',
    description: 'Executive student living in Nakawa just a stone throw away from MUBS main entrance. Features quiet study suites, backup solar & power, and on-site canteen.',
    lat: 0.3298,
    lng: 32.6178,
    address: 'Nakawa Kinawataka Road',
    landmark: 'Opposite MUBS Small Gate',
    area: 'Nakawa',
    campus: 'MUBS',
    distanceCampusApprox: '3 min walk to MUBS Small Gate',
    status: 'unclaimed',
    scoutUserId: 'usr_broker_brian',
    ratingAvg: 4.6,
    ratingCount: 16,
    genderPolicy: 'mixed',
    amenities: ['water', 'security', 'wifi', 'power_backup', 'meals'],
    photos: [
      {
        id: 'p7',
        url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80',
        caption: 'Dream World Hostel Building',
        isCover: true,
        order: 1
      },
      {
        id: 'p8',
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
        caption: 'Room interior with natural lighting',
        isCover: false,
        order: 2
      },
      {
        id: 'p9',
        url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80',
        caption: 'Balcony view of Nakawa hills',
        isCover: false,
        order: 3
      }
    ],
    rooms: [
      {
        id: 'rm_dw_single',
        hostelId: 'hst_dreamworld',
        name: 'Single Room',
        type: 'single',
        rentUgx: 1300000,
        roomsTotal: 30,
        roomsAvailable: 4,
        updatedAt: '2026-02-02T09:00:00Z',
        updatedBy: 'usr_broker_brian'
      },
      {
        id: 'rm_dw_double',
        hostelId: 'hst_dreamworld',
        name: 'Double Room',
        type: 'double',
        rentUgx: 950000,
        roomsTotal: 45,
        roomsAvailable: 7,
        updatedAt: '2026-02-02T09:00:00Z',
        updatedBy: 'usr_broker_brian'
      }
    ],
    lastAvailabilityConfirmedAt: '2026-02-02T09:00:00Z',
    createdAt: '2026-01-18T14:20:00Z',
    viewCount: 750,
    saveCount: 140
  },
  {
    id: 'hst_baskon',
    name: 'Baskon Hostel',
    normalizedName: 'baskon',
    description: 'Serene and affordable accommodation in Banda for Kyambogo University students. Ample security, secure motorcycle parking, reliable water pump, and fast internet.',
    lat: 0.3512,
    lng: 32.6321,
    address: 'Banda Zone 2, Near Kyambogo East Gate',
    landmark: 'Behind Banda Catholic Church',
    area: 'Banda',
    campus: 'Kyambogo University',
    distanceCampusApprox: '6 min walk to East Gate',
    status: 'unclaimed',
    ratingAvg: 4.3,
    ratingCount: 11,
    genderPolicy: 'mixed',
    amenities: ['water', 'security', 'wifi', 'power_backup'],
    photos: [
      {
        id: 'p10',
        url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
        caption: 'Baskon Hostel compound',
        isCover: true,
        order: 1
      },
      {
        id: 'p11',
        url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80',
        caption: 'Clean student room layout',
        isCover: false,
        order: 2
      },
      {
        id: 'p12',
        url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
        caption: 'Shared kitchen and washing bay',
        isCover: false,
        order: 3
      }
    ],
    rooms: [
      {
        id: 'rm_bas_single',
        hostelId: 'hst_baskon',
        name: 'Single Standard',
        type: 'single',
        rentUgx: 800000,
        roomsTotal: 25,
        roomsAvailable: 3,
        updatedAt: '2026-02-01T15:00:00Z',
        updatedBy: 'system'
      },
      {
        id: 'rm_bas_double',
        hostelId: 'hst_baskon',
        name: 'Double Standard',
        type: 'double',
        rentUgx: 600000,
        roomsTotal: 50,
        roomsAvailable: 11,
        updatedAt: '2026-02-01T15:00:00Z',
        updatedBy: 'system'
      }
    ],
    lastAvailabilityConfirmedAt: '2026-02-01T15:00:00Z',
    createdAt: '2026-01-20T16:00:00Z',
    viewCount: 520,
    saveCount: 88
  }
];

export const INITIAL_OFFERS: Offer[] = [
  // Olympia Custodian
  {
    id: 'off_oly_custodian',
    hostelId: 'hst_olympia',
    userId: 'usr_custodian_olympia',
    userName: 'Patrick Mukasa (Hostel Custodian)',
    userRole: 'custodian',
    isVerified: true,
    isAuthorised: true,
    accessFeeUgx: 0, // No access fee for custodians!
    contactPhone: '+256772111222',
    whatsapp: '+256772111222',
    status: 'active',
    notes: 'Direct Custodian office. Call during 8am - 6pm for physical room viewing.',
    createdAt: '2026-01-10T10:00:00Z',
    responseRatePct: 98
  },
  // Douglas Villa Custodian
  {
    id: 'off_doug_custodian',
    hostelId: 'hst_douglas',
    userId: 'usr_custodian_douglas',
    userName: 'Grace Namubiru (Warden)',
    userRole: 'custodian',
    isVerified: true,
    isAuthorised: true,
    accessFeeUgx: 0,
    contactPhone: '+256701333444',
    whatsapp: '+256701333444',
    status: 'active',
    notes: 'Management desk open Mon - Sat.',
    createdAt: '2026-01-12T11:30:00Z',
    responseRatePct: 95
  },
  // Dream World Broker Brian (Unauthorised / Independent)
  {
    id: 'off_dw_broker_brian',
    hostelId: 'hst_dreamworld',
    userId: 'usr_broker_brian',
    userName: 'Brian Kigozi (Independent Broker)',
    userRole: 'broker',
    isVerified: true,
    isAuthorised: false,
    accessFeeUgx: 15000,
    contactPhone: '+256755888999',
    whatsapp: '+256755888999',
    status: 'active',
    notes: 'Can guide you to available rooms and introduce to caretaker.',
    createdAt: '2026-01-18T14:30:00Z',
    responseRatePct: 88
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'ld_1',
    studentId: 'usr_student_mary',
    studentName: 'Mary Atuhaire',
    studentPhone: '+256788555666',
    hostelId: 'hst_olympia',
    offerId: 'off_oly_custodian',
    type: 'whatsapp',
    timestamp: '2026-02-06T14:22:10Z'
  },
  {
    id: 'ld_2',
    studentId: 'usr_student_mary',
    studentName: 'Mary Atuhaire',
    studentPhone: '+256788555666',
    hostelId: 'hst_olympia',
    offerId: 'off_oly_broker_brian',
    type: 'contact_tap',
    timestamp: '2026-02-06T14:20:00Z'
  },
  {
    id: 'ld_3',
    studentId: 'usr_student_mary',
    studentName: 'Mary Atuhaire',
    studentPhone: '+256788555666',
    hostelId: 'hst_douglas',
    type: 'save',
    timestamp: '2026-02-05T18:10:00Z'
  }
];

export const INITIAL_SUBSCRIPTIONS: UserSubscription[] = [
  {
    id: 'sub_cust_olympia',
    userId: 'usr_custodian_olympia',
    planId: 'plan_custodian_standard',
    status: 'active',
    isTrial: false,
    startDate: '2026-01-10T10:00:00Z',
    endDate: '2026-05-10T10:00:00Z',
    activeHostelIds: ['hst_olympia']
  },
  {
    id: 'sub_broker_brian',
    userId: 'usr_broker_brian',
    planId: 'plan_broker_starter',
    status: 'trial',
    isTrial: true,
    startDate: '2026-01-15T14:00:00Z',
    endDate: '2026-02-15T14:00:00Z', // 30-day free trial per FR-6.1
    activeHostelIds: ['hst_olympia', 'hst_dreamworld']
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    hostelId: 'hst_olympia',
    studentId: 'usr_student_mary',
    studentName: 'Mary Atuhaire',
    rating: 5,
    text: 'Best hostel in Kikoni by far! Generator kicks in immediately power goes off, and the WiFi is fast enough for zoom classes and exams.',
    status: 'approved',
    sellerReply: 'Thank you Mary! We always strive to keep power and internet uninterrupted for our students.',
    createdAt: '2026-02-07T11:00:00Z'
  }
];

export const INITIAL_REPORTS: Report[] = [
  {
    id: 'rep_1',
    reporterId: 'usr_student_mary',
    reporterPhone: '+256788555666',
    targetType: 'offer',
    targetId: 'off_dw_broker_brian',
    targetName: 'Brian Kigozi on Dream World',
    reason: 'wrong_price',
    details: 'Broker said single room was 1.2M but listed as 1.3M on the app.',
    status: 'pending',
    createdAt: '2026-02-08T09:30:00Z'
  }
];

// Singleton database holder
let globalDb: AppDatabase | null = null;

export function getDatabase(): AppDatabase {
  if (!globalDb) {
    globalDb = {
      users: [...INITIAL_USERS],
      hostels: [...INITIAL_HOSTELS],
      offers: [...INITIAL_OFFERS],
      leads: [...INITIAL_LEADS],
      plans: [...INITIAL_PLANS],
      subscriptions: [...INITIAL_SUBSCRIPTIONS],
      payments: [],
      reviews: [...INITIAL_REVIEWS],
      reports: [...INITIAL_REPORTS],
      auditLogs: []
    };
  }
  return globalDb;
}
