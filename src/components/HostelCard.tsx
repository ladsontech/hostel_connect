'use client';

import React from 'react';
import Link from 'next/link';
import { Hostel } from '@/types';
import { formatUGX } from '@/lib/utils';
import FaIcon from './FaIcon';

interface HostelCardProps {
  hostel: Hostel;
  isShortlisted?: boolean;
  onToggleShortlist?: (hostel: Hostel) => void;
  isComparing?: boolean;
  onToggleCompare?: (hostel: Hostel) => void;
  onContactClick?: (hostel: Hostel) => void;
}

export default function HostelCard({
  hostel,
  isShortlisted = false,
  onToggleShortlist,
  isComparing = false,
  onToggleCompare,
  onContactClick
}: HostelCardProps) {
  const rents = hostel.rooms.map(r => r.rentUgx);
  const minRent = rents.length ? Math.min(...rents) : 0;
  const maxRent = rents.length ? Math.max(...rents) : 0;
  const totalAvailable = hostel.rooms.reduce((acc, r) => acc + r.roomsAvailable, 0);
  const coverPhoto = hostel.photos.find(p => p.isCover) || hostel.photos[0];

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-[#0f3a98] transition-all flex flex-col font-sans w-[285px] max-w-[295px] shrink-0 snap-start mx-auto">
      {/* Image Container: Consistent 4:3 Aspect Ratio for Web & Mobile */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
        {coverPhoto ? (
          <img
            src={coverPhoto.url}
            alt={hostel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No Photo Available
          </div>
        )}

        {/* Status badges overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          {hostel.status === 'claimed' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#0f3a98] text-white shadow-sm">
              <FaIcon icon="fa-solid fa-shield-halved" className="text-xs text-[#ffbe00]" />
              Verified Owner
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#ffbe00] text-[#0f3a98] shadow-sm">
              <FaIcon icon="fa-solid fa-tag" className="text-xs" />
              Agent Listed
            </span>
          )}

          {hostel.scoutUserId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#0a2666] text-[#ffbe00]">
              <FaIcon icon="fa-solid fa-award" className="text-xs text-[#ffbe00]" />
              Scout Boost
            </span>
          )}
        </div>

        {/* Shortlist & Compare Actions */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {onToggleCompare && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleCompare(hostel);
              }}
              title="Add to Compare"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-sm ${
                isComparing
                  ? 'bg-[#0f3a98] text-[#ffbe00]'
                  : 'bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <FaIcon icon="fa-solid fa-layer-group" className="text-xs" />
            </button>
          )}

          {onToggleShortlist && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleShortlist(hostel);
              }}
              title={isShortlisted ? 'Remove from saved' : 'Save hostel'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-sm ${
                isShortlisted
                  ? 'bg-rose-600 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <FaIcon
                icon={isShortlisted ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}
                className="text-xs"
              />
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating and Area */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <div className="flex items-center gap-1 font-medium text-slate-700 truncate mr-2">
              <FaIcon icon="fa-solid fa-location-dot" className="text-xs text-[#0f3a98] shrink-0" />
              <span className="truncate">{hostel.area}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 truncate">{hostel.campus}</span>
            </div>

            <div className="flex items-center gap-1 text-[#0f3a98] font-medium shrink-0">
              <FaIcon icon="fa-solid fa-star" className="text-xs text-[#ffbe00]" />
              <span>{hostel.ratingAvg.toFixed(1)}</span>
              <span className="text-[11px] text-slate-400 font-normal">({hostel.ratingCount})</span>
            </div>
          </div>

          {/* Anonymized Listing Title - Protects hostel name to prevent platform bypass */}
          <Link href={`/hostels/${hostel.id}`}>
            <h3 className="font-medium text-slate-900 text-base group-hover:text-[#0f3a98] transition line-clamp-1">
              {`Verified ${hostel.genderPolicy === 'girls_only' ? "Girls' " : hostel.genderPolicy === 'boys_only' ? "Boys' " : ''}Student Hostel`}
            </h3>
          </Link>

          {/* Vacancy & Distance Details - Separate stacked lines */}
          <div className="space-y-1 text-xs text-slate-600 mt-1.5">
            <div className="flex items-center gap-1.5 font-medium">
              {totalAvailable > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-[#0f3a98]">
                  <FaIcon icon="fa-solid fa-circle-check" className="text-xs text-[#0f3a98]" />
                  <span>{totalAvailable} rooms vacant</span>
                </span>
              ) : (
                <span className="text-rose-500 font-medium">Fully Occupied</span>
              )}
            </div>

            {hostel.distanceCampusApprox && (
              <div className="text-[11px] text-slate-500 font-normal flex items-center gap-1.5">
                <FaIcon icon="fa-solid fa-person-walking" className="text-[10px] text-slate-400 shrink-0" />
                <span className="truncate">{hostel.distanceCampusApprox}</span>
              </div>
            )}
          </div>

          {/* Key Amenities row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs font-medium">
            {hostel.amenities.includes('wifi') && (
              <span className="inline-flex items-center gap-1 bg-[#0f3a98] text-white px-2 py-0.5 rounded text-[11px] font-medium shadow-xs">
                <FaIcon icon="fa-solid fa-wifi" className="text-[10px] text-white" /> WiFi
              </span>
            )}
            {hostel.amenities.includes('power_backup') && (
              <span className="inline-flex items-center gap-1 bg-[#ffbe00] text-white px-2 py-0.5 rounded text-[11px] font-medium shadow-xs">
                <FaIcon icon="fa-solid fa-bolt" className="text-[10px] text-white" /> Generator
              </span>
            )}
            {hostel.amenities.includes('water') && (
              <span className="inline-flex items-center gap-1 bg-[#0f3a98] text-white px-2 py-0.5 rounded text-[11px] font-medium shadow-xs">
                <FaIcon icon="fa-solid fa-droplet" className="text-[10px] text-white" /> Water
              </span>
            )}
            {hostel.amenities.includes('shuttle') && (
              <span className="inline-flex items-center gap-1 bg-[#ffbe00] text-white px-2 py-0.5 rounded text-[11px] font-medium shadow-xs">
                <FaIcon icon="fa-solid fa-van-shuttle" className="text-[10px] text-white" /> Shuttle
              </span>
            )}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-black font-medium tracking-normal">Per Semester</div>
            <div className="text-[#0f3a98] font-medium text-xs sm:text-sm truncate">
              {formatUGX(minRent)}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onContactClick ? (
              <button
                onClick={() => onContactClick(hostel)}
                className="px-3.5 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
              >
                <FaIcon icon="fa-solid fa-calendar-check" className="text-xs text-[#ffbe00]" />
                Book Now
              </button>
            ) : (
              <Link
                href={`/hostels/${hostel.id}`}
                className="px-3.5 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
              >
                <FaIcon icon="fa-solid fa-calendar-check" className="text-xs text-[#ffbe00]" />
                Book Now
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
