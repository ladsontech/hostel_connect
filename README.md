# Hostel Connect Uganda 🇺🇬
> **Student Hostel Finder & Accommodation Marketplace**  
> Developed based on the *Hostel Marketplace App: Software Requirements Specification (SRS) Version 1.0 (Draft)*.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📖 Product Summary (SRS §1.2 & §9)

Hostel Connect is an authoritative **listing marketplace** that connects university students across Uganda (Makerere, MUBS, Kyambogo, UCU, KIU, etc.) with verified hostel accommodation.

### Crucial Business Model Rules:
- **Zero rent or booking money handled by the platform (BR-3):** The platform is strictly an informational listing service and never takes custody of deposits or room payments.
- **Students are NEVER charged (FR-6.8):** Browsing, searching, shortlisting, side-by-side comparison, and contacting hostels is completely free for students.
- **Per-semester subscription monetization (FR-6.2):** Brokers and Custodians pay a per-semester subscription via **MTN MoMo** and **Airtel Money** after an initial 30-day free trial.
- **Authoritative Rent & Availability Ownership (BR-1):** Rent and room vacancy belong strictly to the physical hostel building and are owned by the Custodian once claimed. Brokers cannot alter rent or availability.

---

## 🔑 Core Features & SRS Mapping

### 1. Student Catalogue & Discovery (§4.2)
- **Hostel Cards (FR-2.1):** Cover photos, area, campus proximity, UGX price range, verified badges, rating average, and live vacancy indicators.
- **Filters & Search (FR-2.2 & FR-2.3):** Filter by university, neighborhood (Kikoni, Banda, Nakawa, etc.), price slider (in UGX), room types (single, double, self-contained), amenities (water, generator, WiFi, security, shuttle, meals), and gender policy.
- **Side-by-Side Comparison (FR-2.7):** Compare up to 3 shortlisted hostels with side-by-side amenity matrix.
- **Contact-on-Tap & Privacy Protection (FR-2.6 & FR-3.1 - FR-3.4):**
  - Exact pin and phone numbers are hidden until student taps Contact and is logged in.
  - Offers listed in strict authoritative priority: verified Custodian $\rightarrow$ Authorised Brokers $\rightarrow$ Independent Brokers.
  - Mandatory **Broker Access Fee Disclosure notice** acknowledged before broker contact details are revealed.
  - Deep links to phone dialer (`tel:`) and WhatsApp (`wa.me`).

### 2. Duplicate Prevention Specification (§5)
A physical building exists **only once** in the database. Custodians and Brokers attach to it through **Offers**.
On hostel creation, the system runs:
1. **Fuzzy Trigram Name Similarity ($\ge 0.6$ threshold):** Normalizes stop words (*"hostel"*, *"residence"*, *"inn"*, area names) and computes trigram similarity.
2. **GPS Proximity ($\le 75\text{ meters}$):** Haversine distance check against existing coordinates.
3. **Custodian Phone Match:** Identifies existing hostels matching custodian contact.
4. **Interactive Prompt:** If a match is detected, prompts *"Is this the same hostel?"*. If yes, attaches the seller as an offer; if no, requires an administrative bypass reason for review.
5. **Admin Merge Tool (FR-10.4):** Enables administrators to merge duplicate entries while preserving all photos, student reviews, attached offers, and immutable lead history with an audit log.

### 3. Lead Capture & Seller Analytics (§4.3 & §4.9)
- **Immutable Lead Logging (FR-3.3):** Every tap on Contact, Call, WhatsApp, and Save creates an immutable `Lead` event with student ID, hostel ID, offer ID, and timestamp.
- **Seller Analytics (FR-9.1):** Per-listing metrics (views, saves, contact taps, calls, WhatsApp taps) across today, last 7 days, and semester.
- **Weekly Performance Summaries (FR-9.2):** Automated performance highlights.
- **Broker Attribution (FR-9.3):** Custodians can see which brokers drive inquiries to their building.
- **Review Gating (BR-7):** Only students with a logged contact lead for a hostel are permitted to leave reviews.

### 4. Admin Operations & Moderation (§4.10)
- Role-based admin access (*SuperAdmin, Verifier, Moderator, Finance*).
- Verification and approval queue for custodian ownership claims.
- Report moderation queue (fake listings, false pricing, duplicate listings).
- CSV report exports (FR-10.9).

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server & Client Components)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict typing)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Mobile-first, optimized for low-bandwidth 3G devices per NFR-1 & NFR-2)
- **Icons:** [Lucide React](https://lucide.dev/)
- **REST API:** Versioned endpoints at `/api/v1/*` ready for future Android mobile app integration

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v22.17)
- npm or pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/ladsontech/hostel_connect.git
cd hostel_connect

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Role Switcher & Testing

The top notification bar includes an instant **Role Switcher** allowing you to preview the platform from all perspectives:
- **Student View (Mary Atuhaire):** Explore hostels, filter, shortlist, compare, and tap to contact.
- **Custodian View (Patrick Mukasa - Olympia Hostel):** Manage authoritative room vacancy, review leads, and approve brokers.
- **Broker View (Brian Kigozi - Campus Scout):** Manage access fees, attach to hostels, and view inquiry analytics.
- **Admin View (Sarah Akello):** Access the SuperAdmin Operations Panel, KPI dashboard, and Duplicate Merge Tool.

---

## 📄 License

MIT License. Designed and developed for university student housing in Uganda.

