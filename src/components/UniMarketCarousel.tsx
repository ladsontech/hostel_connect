'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import FaIcon from './FaIcon';

export interface BusinessFlyer {
  id: string;
  businessName: string;
  category: string;
  headline: string;
  tagline: string;
  campusTarget: string;
  discountBadge?: string;
  imageUrl: string;
  contactAction: {
    type: 'whatsapp' | 'call' | 'link';
    value: string;
    label: string;
  };
}

const DEFAULT_FLYERS: BusinessFlyer[] = [
  {
    id: 'flyer-1',
    businessName: 'Kampala Express Laundromat',
    category: 'Laundry & Dry Cleaning',
    headline: 'Same-Day Student Wash, Dry & Fold',
    tagline: 'Doorstep pickup from Kikoni, Wandegeya, Nakawa & Banda. Special student rates per basket.',
    campusTarget: 'Makerere & MUBS Campuses',
    discountBadge: '20% Off 1st Order',
    imageUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1400&q=80',
    contactAction: {
      type: 'whatsapp',
      value: 'https://wa.me/256700000000?text=Hello%20Kampala%20Express%20Laundromat,%20I%20need%20student%20laundry%20pickup',
      label: 'Order Pickup'
    }
  },
  {
    id: 'flyer-2',
    businessName: 'Campus Bite & Coffee Hub',
    category: 'Student Cafe & Meals',
    headline: 'Fresh Meals, Fast WiFi & Study Booths',
    tagline: 'Breakfast wraps, Rolex combos & rich Ugandan coffee. Open 7:00 AM till midnight.',
    campusTarget: 'Near Makerere Western Gate',
    discountBadge: 'UGX 5,000 Lunch Combo',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1400&q=80',
    contactAction: {
      type: 'whatsapp',
      value: 'https://wa.me/256700000000?text=Hello%20Campus%20Bite,%20can%20I%20view%20today%20special%20menu',
      label: 'View Menu'
    }
  },
  {
    id: 'flyer-3',
    businessName: 'NextGen Student Tech Clinic',
    category: 'Laptop & Phone Repair',
    headline: 'Fast Screen, Battery & Software Fixes',
    tagline: 'Certified technicians on site. Free diagnostics for students and 90-day warranty.',
    campusTarget: 'Sir Apollo Kaggwa Rd & Nakawa',
    discountBadge: 'Free PC Diagnostic',
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1400&q=80',
    contactAction: {
      type: 'call',
      value: 'tel:+256700000000',
      label: 'Call Technician'
    }
  },
  {
    id: 'flyer-4',
    businessName: 'Scholars Stationery & Print Hub',
    category: 'Printing & Binding',
    headline: 'Dissertation Printing, Spiral Binding & Plots',
    tagline: 'High-speed color printing, coursework copying, laminating & graphic design supplies.',
    campusTarget: 'Kyambogo Banda & UCU Mukono',
    discountBadge: 'Coursework Bulk Rates',
    imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1400&q=80',
    contactAction: {
      type: 'whatsapp',
      value: 'https://wa.me/256700000000?text=Hello%20Scholars%20Print,%20I%20have%20coursework%20to%20print',
      label: 'Send Documents'
    }
  },
  {
    id: 'flyer-5',
    businessName: 'SafeRide Student Boda Network',
    category: 'Campus Transit',
    headline: 'Safe, Vetted Riders for Early & Late Classes',
    tagline: 'Fixed student fares between hostels, lecture rooms, and campus libraries. Clean helmets provided.',
    campusTarget: 'All Major Kampala Campuses',
    discountBadge: 'Fixed Campus Fares',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1400&q=80',
    contactAction: {
      type: 'whatsapp',
      value: 'https://wa.me/256700000000?text=Hello%20SafeRide,%20I%20want%20to%20book%20a%20campus%20rider',
      label: 'Book Ride'
    }
  },
  {
    id: 'flyer-6',
    businessName: 'Peak Fitness & Martial Arts',
    category: 'Gym & Student Wellness',
    headline: 'Affordable Semester Gym Memberships',
    tagline: 'Full cardio suite, heavy weights, aerobics classes and certified personal trainers.',
    campusTarget: 'Wandegeya & Nakawa',
    discountBadge: 'UGX 60K / Month Student Pass',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=80',
    contactAction: {
      type: 'whatsapp',
      value: 'https://wa.me/256700000000?text=Hello%20Peak%20Fitness,%20tell%20me%20about%20the%20student%20pass',
      label: 'Get Student Pass'
    }
  },
  {
    id: 'flyer-7',
    businessName: 'Hostel Groceries & Fresh Mart',
    category: 'Supermarket & Essentials',
    headline: 'Cooking Gas Refills & Fresh Food Baskets',
    tagline: 'Order 6kg gas refills, cooking oil, rice, and fresh fruits delivered straight to your room.',
    campusTarget: 'Kikoni & Kataza Hostels',
    discountBadge: 'Free Hostel Delivery',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80',
    contactAction: {
      type: 'whatsapp',
      value: 'https://wa.me/256700000000?text=Hello%20Fresh%20Mart,%20I%20need%20cooking%20gas%20refill%20delivered',
      label: 'Order Essentials'
    }
  }
];

export default function UniMarketCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [flyers, setFlyers] = useState<BusinessFlyer[]>(DEFAULT_FLYERS);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load any user-created flyers from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('uni_market_flyers');
      if (saved) {
        const parsed: BusinessFlyer[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFlyers([...parsed, ...DEFAULT_FLYERS]);
        }
      }
    } catch (e) {
      // fallback to defaults
    }
  }, []);

  // Slow automated animation (6 seconds per slide)
  useEffect(() => {
    if (isPaused) return;

    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flyers.length);
    }, 6000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, isPaused, flyers.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % flyers.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + flyers.length) % flyers.length);
  };

  const currentFlyer = flyers[currentIndex];

  return (
    <section className="space-y-3 pt-2">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-[#ffbe00] text-[#0f3a98]">
              <FaIcon icon="fa-solid fa-store" className="text-xs mr-1" />
              Campus Deals
            </span>
            <span className="text-xs text-slate-500 font-normal">Verified University Services & Businesses</span>
          </div>
          <h2 className="text-xl font-medium text-[#0f3a98] mt-1">Uni Market</h2>
          <p className="text-xs text-slate-500 font-normal">
            Special student offers, laundry, food, stationery & tech essentials near your campus
          </p>
        </div>

        {/* Advertise Button & Flyer Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/uni-market/advertise"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f3a98] text-white text-xs font-medium hover:bg-[#0a2666] transition shadow-xs"
          >
            <FaIcon icon="fa-solid fa-bullhorn" className="text-xs text-[#ffbe00]" />
            <span>Place Business Flyer</span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={handlePrev}
              title="Previous Flyer"
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-[#0f3a98] text-slate-700 hover:text-[#0f3a98] flex items-center justify-center text-xs transition"
            >
              <FaIcon icon="fa-solid fa-chevron-left" />
            </button>
            <button
              onClick={handleNext}
              title="Next Flyer"
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-[#0f3a98] text-slate-700 hover:text-[#0f3a98] flex items-center justify-center text-xs transition"
            >
              <FaIcon icon="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      {/* Landscape Flyer Showcase with Slow Smooth Animation (Uniform 21:9 Aspect Ratio) */}
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-[#0f3a98]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Uniform Aspect Ratio Container: 21:9 Widescreen Landscape Ratio on Both Web & Mobile */}
        <div className="relative w-full aspect-[21/9] min-h-[160px] sm:min-h-[220px] overflow-hidden">
          {flyers.map((flyer, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={flyer.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Background Landscape Flyer Image with Dark Readability Overlay */}
                <img
                  src={flyer.imageUrl}
                  alt={flyer.businessName}
                  className="w-full h-full object-cover transform scale-100 transition-transform duration-7000 ease-out"
                />

                {/* Solid Dark Contrast Scrim (no color gradients) */}
                <div className="absolute inset-0 bg-[#0a2666]/85" />

                {/* Landscape Content Layout - Perfectly Proportional on Both Web & Mobile */}
                <div className="absolute inset-0 p-3.5 sm:p-6 md:p-8 lg:p-9 flex flex-col justify-between text-white z-20">
                  {/* Top Bar: Category, Target Campus, and Discount Badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium bg-[#ffbe00] text-[#0f3a98] uppercase tracking-wider shrink-0">
                        {flyer.category}
                      </span>
                      <span className="text-[10px] sm:text-xs text-blue-200 font-light flex items-center gap-1 truncate max-w-[130px] sm:max-w-none">
                        <FaIcon icon="fa-solid fa-location-dot" className="text-[10px] text-[#ffbe00] shrink-0" />
                        <span className="truncate">{flyer.campusTarget}</span>
                      </span>
                    </div>

                    {flyer.discountBadge && (
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium bg-white text-[#0f3a98] shadow-xs shrink-0">
                        <FaIcon icon="fa-solid fa-tag" className="text-[9px] text-[#0f3a98] mr-1" />
                        {flyer.discountBadge}
                      </span>
                    )}
                  </div>

                  {/* Middle: Headline, Business Name & Tagline */}
                  <div className="max-w-2xl space-y-0.5 sm:space-y-1.5 my-auto">
                    <div className="text-[10px] sm:text-xs text-[#ffbe00] font-medium uppercase tracking-wide">
                      {flyer.businessName}
                    </div>
                    <h3 className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-medium text-white leading-snug sm:leading-tight line-clamp-1 sm:line-clamp-2">
                      {flyer.headline}
                    </h3>
                    <p className="text-[10px] sm:text-xs md:text-sm text-blue-100 font-light line-clamp-1 sm:line-clamp-2 max-w-xl">
                      {flyer.tagline}
                    </p>
                  </div>

                  {/* Bottom: Action CTA and Flyer Counter */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <a
                      href={flyer.contactAction.value}
                      target={flyer.contactAction.type === 'call' ? '_self' : '_blank'}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-[#ffbe00] text-[#0f3a98] text-[10px] sm:text-xs font-medium hover:bg-yellow-400 transition shadow-sm shrink-0"
                    >
                      {flyer.contactAction.type === 'whatsapp' ? (
                        <FaIcon icon="fa-brands fa-whatsapp" className="text-xs sm:text-sm" />
                      ) : flyer.contactAction.type === 'call' ? (
                        <FaIcon icon="fa-solid fa-phone" className="text-[10px] sm:text-xs" />
                      ) : (
                        <FaIcon icon="fa-solid fa-arrow-up-right-from-square" className="text-[10px] sm:text-xs" />
                      )}
                      <span>{flyer.contactAction.label}</span>
                    </a>

                    <div className="text-[10px] sm:text-xs text-blue-200 font-light">
                      Flyer {index + 1} of {flyers.length}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Indicators / Dots at bottom */}
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-1.5 bg-[#0a2666]/60 backdrop-blur-xs px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
          {flyers.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              title={`View Flyer ${i + 1}`}
              className={`h-1 sm:h-1.5 rounded-full transition-all ${
                i === currentIndex
                  ? 'w-4 sm:w-6 bg-[#ffbe00]'
                  : 'w-1 sm:w-1.5 bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

