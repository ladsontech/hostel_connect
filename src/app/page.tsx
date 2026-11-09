'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import HostelCard from '@/components/HostelCard';
import FilterBar, { FilterState } from '@/components/FilterBar';
import ContactModal from '@/components/ContactModal';
import CompareModal from '@/components/CompareModal';
import AuthModal from '@/components/AuthModal';
import { Hostel, Offer } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { 
  Building2, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  PhoneCall, 
  CheckCircle2
} from 'lucide-react';

export default function HomePage() {
  const { currentUser } = useAuth();
  
  // Data states
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);

  // Shortlist & Compare states
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  
  // Modals
  const [activeHostelForContact, setActiveHostelForContact] = useState<Hostel | null>(null);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    q: '',
    campus: '',
    area: '',
    roomType: '',
    minPrice: 0,
    maxPrice: 3000000,
    gender: '',
    amenities: [],
    sort: 'relevance'
  });

  const loadHostels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hostels');
      const data = await res.json();
      if (data.success) {
        setHostels(data.hostels);
      }
    } catch (e) {
      console.error('Failed to load hostels', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHostels();
    const saved = localStorage.getItem('hostel_connect_shortlist');
    if (saved) {
      try {
        setShortlist(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleToggleShortlist = (hostel: Hostel) => {
    setShortlist(prev => {
      const exists = prev.includes(hostel.id);
      const next = exists ? prev.filter(id => id !== hostel.id) : [...prev, hostel.id];
      localStorage.setItem('hostel_connect_shortlist', JSON.stringify(next));
      
      if (!exists && currentUser) {
        fetch('/api/v1/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: currentUser.id,
            studentName: currentUser.name,
            hostelId: hostel.id,
            type: 'save'
          })
        });
      }
      return next;
    });
  };

  const handleToggleCompare = (hostel: Hostel) => {
    setCompareList(prev => {
      if (prev.includes(hostel.id)) {
        return prev.filter(id => id !== hostel.id);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 hostels at once (FR-2.7).');
        return prev;
      }
      return [...prev, hostel.id];
    });
  };

  const handleContactClick = async (hostel: Hostel) => {
    setActiveHostelForContact(hostel);
    try {
      const res = await fetch(`/api/v1/hostels/${hostel.id}`);
      const data = await res.json();
      if (data.success) {
        setActiveOffers(data.offers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredHostels = useMemo(() => {
    return hostels.filter(h => {
      if (filters.q) {
        const query = filters.q.toLowerCase();
        const matches =
          h.name.toLowerCase().includes(query) ||
          h.area.toLowerCase().includes(query) ||
          h.campus.toLowerCase().includes(query) ||
          h.description.toLowerCase().includes(query);
        if (!matches) return false;
      }

      if (filters.campus && !h.campus.toLowerCase().includes(filters.campus.toLowerCase())) {
        return false;
      }

      if (filters.gender && h.genderPolicy !== filters.gender) {
        return false;
      }

      if (filters.amenities.length > 0) {
        const hasAll = filters.amenities.every(a => h.amenities.includes(a));
        if (!hasAll) return false;
      }

      if (h.rooms && h.rooms.length > 0) {
        const matchingRooms = h.rooms.filter(r => {
          const matchesType = !filters.roomType || r.type === filters.roomType;
          const matchesPrice = r.rentUgx <= filters.maxPrice;
          return matchesType && matchesPrice;
        });
        if (matchingRooms.length === 0) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sort === 'price_asc') {
        const minA = Math.min(...a.rooms.map(r => r.rentUgx), Infinity);
        const minB = Math.min(...b.rooms.map(r => r.rentUgx), Infinity);
        return minA - minB;
      }
      if (filters.sort === 'price_desc') {
        const minA = Math.min(...a.rooms.map(r => r.rentUgx), 0);
        const minB = Math.min(...b.rooms.map(r => r.rentUgx), 0);
        return minB - minA;
      }
      if (filters.sort === 'rating') {
        return b.ratingAvg - a.ratingAvg;
      }
      return 0;
    });
  }, [hostels, filters]);

  const compareHostels = useMemo(() => {
    return hostels.filter(h => compareList.includes(h.id));
  }, [hostels, compareList]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        shortlistCount={compareList.length}
        onOpenCompare={() => setIsCompareOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Hero Section (Solid #0f3a98 background, NO gradients) */}
        <div className="rounded-3xl bg-[#0f3a98] p-6 sm:p-10 text-white shadow-xl border border-blue-900">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a2666] border border-blue-800 text-[#ffbe00] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Semester Intake 2026/2027 Accommodations
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Find Verified University Hostels in Uganda.
            </h1>

            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Explore hostels around Makerere, MUBS, Kyambogo and more. Connect directly with authoritative hostel custodians and verified student scouts without hidden middleman markups.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-white">
              <div className="flex items-center gap-1.5 bg-[#0a2666] px-3 py-1.5 rounded-lg border border-blue-800">
                <CheckCircle2 className="w-4 h-4 text-[#ffbe00]" />
                <span>Zero Student Booking Fees</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#0a2666] px-3 py-1.5 rounded-lg border border-blue-800">
                <ShieldCheck className="w-4 h-4 text-[#ffbe00]" />
                <span>Verified Owner Listings</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#0a2666] px-3 py-1.5 rounded-lg border border-blue-800">
                <PhoneCall className="w-4 h-4 text-[#ffbe00]" />
                <span>Direct WhatsApp & Call Contact</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters({
            q: '',
            campus: '',
            area: '',
            roomType: '',
            minPrice: 0,
            maxPrice: 3000000,
            gender: '',
            amenities: [],
            sort: 'relevance'
          })}
          totalResults={filteredHostels.length}
        />

        {/* Hostel List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#0f3a98]">
                {filters.campus || 'All Ugandan Campuses'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {filteredHostels.length} hostels matching your criteria
              </p>
            </div>

            {compareList.length > 0 && (
              <button
                onClick={() => setIsCompareOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#e8effc] text-[#0f3a98] text-xs font-bold flex items-center gap-1.5 border border-[#0f3a98] transition"
              >
                <Layers className="w-4 h-4 text-[#ffbe00]" />
                Compare ({compareList.length}/3)
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : filteredHostels.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No hostels found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try widening your price range or clearing some amenity filters to see more results.
              </p>
              <button
                onClick={() => setFilters({
                  q: '',
                  campus: '',
                  area: '',
                  roomType: '',
                  minPrice: 0,
                  maxPrice: 3000000,
                  gender: '',
                  amenities: [],
                  sort: 'relevance'
                })}
                className="px-4 py-2 rounded-lg bg-[#0f3a98] text-white text-xs font-bold"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHostels.map(hostel => (
                <HostelCard
                  key={hostel.id}
                  hostel={hostel}
                  isShortlisted={shortlist.includes(hostel.id)}
                  onToggleShortlist={handleToggleShortlist}
                  isComparing={compareList.includes(hostel.id)}
                  onToggleCompare={handleToggleCompare}
                  onContactClick={handleContactClick}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Compare Pill */}
      {compareList.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-[#0f3a98] text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-blue-900">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbe00]"></span>
            <span>{compareList.length} of 3 hostels selected</span>
          </div>
          <button
            onClick={() => setIsCompareOpen(true)}
            className="px-4 py-1.5 rounded-full bg-[#ffbe00] hover:bg-[#e0a700] text-[#0f3a98] text-xs font-extrabold transition shadow-sm"
          >
            Compare Now
          </button>
          <button
            onClick={() => setCompareList([])}
            className="text-xs text-blue-200 hover:text-white font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* Contact Drawer Modal */}
      {activeHostelForContact && (
        <ContactModal
          hostel={activeHostelForContact}
          offers={activeOffers}
          isOpen={!!activeHostelForContact}
          onClose={() => setActiveHostelForContact(null)}
          onRequireAuth={() => setIsAuthOpen(true)}
        />
      )}

      {/* Compare Modal */}
      <CompareModal
        hostels={compareHostels}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onRemoveHostel={(id) => setCompareList(prev => prev.filter(x => x !== id))}
        onContactClick={(h) => {
          setIsCompareOpen(false);
          handleContactClick(h);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-8 px-4 sm:px-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Hostel Connect" className="h-6 w-auto object-contain" />
            <span className="font-bold text-[#0f3a98]">Hostel Connect Uganda</span>
            <span>• Compliant with Uganda Data Protection and Privacy Act, 2019</span>
          </div>
          <div className="font-medium text-slate-600">
            Built strictly adhering to the Hostel Marketplace App SRS (Draft 1.0)
          </div>
        </div>
      </footer>
    </div>
  );
}
