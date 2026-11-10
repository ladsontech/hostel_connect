'use client';

import React, { useState, useEffect, useRef } from 'react';
import FaIcon from './FaIcon';

interface HeroSlide {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  tags?: string[];
}

const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-1',
    imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1600&q=80',
    title: 'Find Verified University Hostels in Uganda.',
    description: 'Explore hostels around Makerere, MUBS, Kyambogo and more. Connect directly with authoritative hostel custodians and verified student scouts without hidden middleman markups.',
    tags: ['Zero Student Booking Fees', 'Verified Owner Listings', 'Direct WhatsApp & Call Contact']
  },
  {
    id: 'hero-2',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80',
    title: 'Book Directly With Official Campus Custodians.',
    description: 'Skip unverified street brokers. Browse verified single & double rooms, confirmed semester rates, and direct desk contact information.',
    tags: ['100% Direct Desk Contacts', 'Real-Time Room Vacancies', 'Free Campus Shuttles']
  },
  {
    id: 'hero-3',
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=80',
    title: 'Safe, Fully-Equipped Student Accommodation.',
    description: 'Discover verified hostels offering standby generators, high-speed WiFi, steady water supply, and 24/7 perimeter security.',
    tags: ['Standby Generators', 'High-Speed Student WiFi', 'Campus Safety Guaranteed']
  }
];

export default function HeroCarousel() {
  const [slides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-advance slides every 6.5s in a slow, smooth animation
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6500);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
    touchStartX.current = null;
  };

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-xl border border-blue-900 bg-[#0f3a98]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Uniform Aspect Ratio Container: 21:9 Widescreen Landscape Ratio on Both Web & Mobile */}
      <div className="relative w-full aspect-[21/9] min-h-[220px] sm:min-h-[280px] md:min-h-[340px] overflow-hidden">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Landscape Flyer / Image */}
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover transform scale-100 transition-transform duration-7000 ease-out"
              />

              {/* Solid readable dark blue overlay (allows words to read clearly now; easily removed when user supplies graphical flyers) */}
              <div className="absolute inset-0 bg-[#0a2666]/75 sm:bg-[#0a2666]/70" />

              {/* Slide Content Layout */}
              <div className="absolute inset-0 p-4 sm:p-8 md:p-10 flex flex-col justify-between text-white z-20">
                <div className="max-w-2xl space-y-2 sm:space-y-3 my-auto">
                  <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight leading-tight text-white">
                    {slide.title}
                  </h1>

                  <p className="text-blue-100 text-xs sm:text-sm md:text-base leading-relaxed font-normal line-clamp-2 sm:line-clamp-3 max-w-xl">
                    {slide.description}
                  </p>

                  {/* Feature Tags */}
                  {slide.tags && slide.tags.length > 0 && (
                    <div className="pt-1 sm:pt-2 flex flex-wrap gap-2 sm:gap-3 text-[11px] sm:text-xs font-medium text-white">
                      {slide.tags.map((tag, tIdx) => (
                        <div
                          key={tIdx}
                          className="flex items-center gap-1.5 bg-[#0a2666]/90 backdrop-blur-xs px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-blue-400/30"
                        >
                          <FaIcon
                            icon={
                              tIdx === 0
                                ? 'fa-solid fa-hand-holding-dollar'
                                : tIdx === 1
                                ? 'fa-solid fa-shield-halved'
                                : 'fa-brands fa-whatsapp'
                            }
                            className="text-xs sm:text-sm text-[#ffbe00]"
                          />
                          <span>{tag}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Slide Counter & Chevrons */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs text-white text-[10px] sm:text-xs font-medium tracking-wide border border-white/10 shadow-xs">
                    Slide {index + 1} of {slides.length}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Navigation Chevrons (desktop hover) */}
      <div className="absolute inset-y-0 left-3 z-30 hidden sm:flex items-center">
        <button
          onClick={handlePrev}
          title="Previous Slide"
          className="w-9 h-9 rounded-full bg-black/40 hover:bg-[#0f3a98] text-white flex items-center justify-center text-xs backdrop-blur-xs transition shadow-md border border-white/20"
        >
          <FaIcon icon="fa-solid fa-chevron-left" />
        </button>
      </div>
      <div className="absolute inset-y-0 right-3 z-30 hidden sm:flex items-center">
        <button
          onClick={handleNext}
          title="Next Slide"
          className="w-9 h-9 rounded-full bg-black/40 hover:bg-[#0f3a98] text-white flex items-center justify-center text-xs backdrop-blur-xs transition shadow-md border border-white/20"
        >
          <FaIcon icon="fa-solid fa-chevron-right" />
        </button>
      </div>

      {/* 3 Slider Indicators / Dots at bottom center */}
      <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-[#0a2666]/70 backdrop-blur-xs px-3 py-1 rounded-full border border-white/10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            title={`Go to Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === currentIndex
                ? 'w-6 bg-[#ffbe00]'
                : 'w-1.5 bg-white/50 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
