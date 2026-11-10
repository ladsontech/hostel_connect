'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import HostelCard from '@/components/HostelCard';
import FilterBar, { FilterState } from '@/components/FilterBar';
import ContactModal from '@/components/ContactModal';
import CompareModal from '@/components/CompareModal';
import AuthModal from '@/components/AuthModal';
import Footer from '@/components/Footer';
import UniMarketCarousel from '@/components/UniMarketCarousel';
import { Hostel, Offer } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { formatUGX } from '@/lib/utils';
import FaIcon from '@/components/FaIcon';

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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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

  // Featured Rooms Selection
  const featuredRooms = useMemo(() => {
    const list: Array<{
      roomId: string;
      roomName: string;
      roomType: string;
      rentUgx: number;
      roomsAvailable: number;
      hostel: Hostel;
      photoUrl: string;
    }> = [];

    hostels.forEach(h => {
      if (h.rooms && h.rooms.length > 0) {
        const room = h.rooms.find(r => r.roomsAvailable > 0 && r.type.includes('single')) || h.rooms[0];
        if (room) {
          const photo = h.photos.find(p => !p.isCover)?.url || h.photos[0]?.url;
          list.push({
            roomId: room.id,
            roomName: room.name,
            roomType: room.type,
            rentUgx: room.rentUgx,
            roomsAvailable: room.roomsAvailable,
            hostel: h,
            photoUrl: photo
          });
        }
      }
    });

    return list.slice(0, 4);
  }, [hostels]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar
        onOpenAuth={(mode) => {
          setAuthMode(mode || 'login');
          setIsAuthOpen(true);
        }}
        shortlistCount={compareList.length}
        onOpenCompare={() => setIsCompareOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Hero Section */}
        <div className="rounded-3xl bg-[#0f3a98] p-6 sm:p-10 text-white shadow-xl border border-blue-900">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight">
              Find Verified University Hostels in Uganda.
            </h1>

            <p className="text-blue-100 text-sm sm:text-base leading-relaxed font-normal">
              Explore hostels around Makerere, MUBS, Kyambogo and more. Connect directly with authoritative hostel custodians and verified student scouts without hidden middleman markups.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-white">
              <div className="flex items-center gap-2 bg-[#0a2666] px-3.5 py-2 rounded-lg border border-blue-800">
                <FaIcon icon="fa-solid fa-hand-holding-dollar" className="text-sm text-[#ffbe00]" />
                <span>Zero Student Booking Fees</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0a2666] px-3.5 py-2 rounded-lg border border-blue-800">
                <FaIcon icon="fa-solid fa-shield-halved" className="text-sm text-[#ffbe00]" />
                <span>Verified Owner Listings</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0a2666] px-3.5 py-2 rounded-lg border border-blue-800">
                <FaIcon icon="fa-brands fa-whatsapp" className="text-base text-[#ffbe00]" />
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

        {/* Featured Rooms Section */}
        {featuredRooms.length > 0 && !filters.q && (
          <div id="featured-rooms" className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-[#e8effc] text-[#0f3a98] border border-blue-200">
                    <FaIcon icon="fa-solid fa-fire" className="text-xs text-[#ffbe00] mr-1" />
                    Prime Vacancies
                  </span>
                  <span className="text-xs text-slate-500 font-normal">Direct Custodian Verified</span>
                </div>
                <h2 className="text-xl font-medium text-[#0f3a98] mt-1">Featured Hostels & Rooms</h2>
                <p className="text-xs text-slate-500 font-normal">
                  Hand-picked student rooms with guaranteed amenities, verified custodians & close campus proximity
                </p>
              </div>

              {/* Mobile swipe hint */}
              <div className="sm:hidden flex items-center gap-1 text-[11px] text-[#0f3a98] font-medium bg-[#e8effc] px-2.5 py-1 rounded-full shrink-0">
                <span>Swipe</span>
                <FaIcon icon="fa-solid fa-arrow-right" className="text-[10px]" />
              </div>
            </div>

            {/* Featured Rooms Cards Carousel on mobile, Grid on desktop */}
            <div className="flex overflow-x-auto gap-4 pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-6 sm:justify-items-center snap-x snap-mandatory scroll-smooth">
              {featuredRooms.map(item => (
                <div
                  key={item.roomId}
                  className="group bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-sm hover:shadow-md hover:border-[#0f3a98] transition-all flex flex-col font-sans w-[285px] max-w-[300px] shrink-0 snap-start sm:w-full mx-auto sm:mx-0"
                >
                  {/* Image Container: 300px by 220px */}
                  <div className="relative w-full h-[220px] bg-slate-100 overflow-hidden">
                    <img
                      src={item.photoUrl}
                      alt={item.roomName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Featured Room Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#0f3a98] text-white shadow-sm border border-blue-900">
                        <FaIcon icon="fa-solid fa-star" className="text-xs text-[#ffbe00]" />
                        Featured Room
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Hostel Name & Campus */}
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                        <FaIcon icon="fa-solid fa-location-dot" className="text-xs text-[#0f3a98] shrink-0" />
                        <span className="truncate">{item.hostel.name}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 truncate">{item.hostel.campus}</span>
                      </div>

                      {/* Room Name */}
                      <Link href={`/hostels/${item.hostel.id}`}>
                        <h3 className="font-medium text-slate-900 text-base group-hover:text-[#0f3a98] transition line-clamp-1">
                          {item.roomName}
                        </h3>
                      </Link>

                      {/* Vacancy & Proximity Details */}
                      <div className="flex items-center justify-between text-xs text-slate-600 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[#0f3a98] font-medium">
                          <FaIcon icon="fa-solid fa-circle-check" className="text-xs text-[#0f3a98]" />
                          <span>{item.roomsAvailable} rooms vacant</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal truncate max-w-[130px]" title={item.hostel.distanceCampusApprox || item.hostel.area}>
                          {item.hostel.distanceCampusApprox || item.hostel.area}
                        </span>
                      </div>

                      {/* Key Amenities */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs font-medium">
                        {item.hostel.amenities.includes('wifi') && (
                          <span className="inline-flex items-center gap-1 bg-[#0f3a98] text-white px-2 py-0.5 rounded text-[11px] shadow-xs">
                            <FaIcon icon="fa-solid fa-wifi" className="text-[10px] text-white" /> WiFi
                          </span>
                        )}
                        {item.hostel.amenities.includes('power_backup') && (
                          <span className="inline-flex items-center gap-1 bg-[#ffbe00] text-white px-2 py-0.5 rounded text-[11px] shadow-xs">
                            <FaIcon icon="fa-solid fa-bolt" className="text-[10px] text-white" /> Generator
                          </span>
                        )}
                        {item.hostel.amenities.includes('water') && (
                          <span className="inline-flex items-center gap-1 bg-[#0f3a98] text-white px-2 py-0.5 rounded text-[11px] shadow-xs">
                            <FaIcon icon="fa-solid fa-droplet" className="text-[10px] text-white" /> Water
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & Contact */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs text-black font-medium tracking-normal">Per Semester</div>
                        <div className="text-[#0f3a98] font-medium text-xs sm:text-sm truncate">
                          {formatUGX(item.rentUgx)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleContactClick(item.hostel)}
                        className="px-3 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition shrink-0"
                      >
                        <FaIcon icon="fa-solid fa-phone" className="text-xs text-white" />
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uni Market Business Flyers Showcase (Slow Automated Landscape Flyers) */}
        {!filters.q && (
          <UniMarketCarousel />
        )}

        {/* Hostel List */}
        <div id="explore">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-[#0f3a98]">
                {filters.campus || 'All Ugandan Campuses'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {filteredHostels.length} hostels matching your criteria
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile swipe hint */}
              <div className="sm:hidden flex items-center gap-1 text-[11px] text-[#0f3a98] font-medium bg-[#e8effc] px-2.5 py-1 rounded-full shrink-0">
                <span>Swipe</span>
                <FaIcon icon="fa-solid fa-arrow-right" className="text-[10px]" />
              </div>

              {compareList.length > 0 && (
                <button
                  onClick={() => setIsCompareOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#e8effc] text-[#0f3a98] text-xs font-medium flex items-center gap-2 border border-[#0f3a98] transition"
                >
                  <FaIcon icon="fa-solid fa-layer-group" className="text-xs text-[#ffbe00]" />
                  Compare ({compareList.length}/3)
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex overflow-x-auto gap-4 pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-6 sm:justify-items-center snap-x snap-mandatory scroll-smooth">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[390px] w-[285px] max-w-[300px] shrink-0 snap-start sm:w-full rounded-2xl bg-slate-200 animate-pulse mx-auto sm:mx-0" />
              ))}
            </div>
          ) : filteredHostels.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <FaIcon icon="fa-solid fa-hotel" className="text-4xl text-slate-300 mx-auto" />
              <h3 className="font-medium text-slate-800 text-base">No hostels found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
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
                className="px-4 py-2 rounded-lg bg-[#0f3a98] text-white text-xs font-medium flex items-center gap-1.5 mx-auto"
              >
                <FaIcon icon="fa-solid fa-rotate-left" className="text-xs" />
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:gap-6 sm:justify-items-center snap-x snap-mandatory scroll-smooth">
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
          <div className="flex items-center gap-2 text-xs font-medium text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbe00]"></span>
            <span>{compareList.length} of 3 hostels selected</span>
          </div>
          <button
            onClick={() => setIsCompareOpen(true)}
            className="px-4 py-1.5 rounded-full bg-[#ffbe00] hover:bg-[#e0a700] text-[#0f3a98] text-xs font-medium transition shadow-sm"
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
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
