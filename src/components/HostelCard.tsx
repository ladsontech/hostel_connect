'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Hostel } from '@/types';
import { formatUGX } from '@/lib/utils';
import { 
  MapPin, 
  Star, 
  ShieldCheck, 
  Award, 
  Heart, 
  Layers, 
  Wifi, 
  Zap, 
  Droplet, 
  Bus,
  ChevronRight,
  PhoneCall
} from 'lucide-react';

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
  // Compute price range
  const rents = hostel.rooms.map(r => r.rentUgx);
  const minRent = rents.length ? Math.min(...rents) : 0;
  const maxRent = rents.length ? Math.max(...rents) : 0;

  // Compute total available rooms
  const totalAvailable = hostel.rooms.reduce((acc, r) => acc + r.roomsAvailable, 0);

  // Cover photo
  const coverPhoto = hostel.photos.find(p => p.isCover) || hostel.photos[0];

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col">
      {/* Image Container */}
      <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Owner
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-sm">
              Agent Listed
            </span>
          )}

          {hostel.scoutUserId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-900/80 text-amber-300 backdrop-blur-sm">
              <Award className="w-3 h-3 text-amber-400" />
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
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                isComparing
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/80 hover:bg-white text-slate-700 shadow-sm'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
          )}

          {onToggleShortlist && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleShortlist(hostel);
              }}
              title={isShortlisted ? 'Remove from saved' : 'Save hostel'}
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                isShortlisted
                  ? 'bg-rose-600 text-white'
                  : 'bg-white/80 hover:bg-white text-slate-700 shadow-sm'
              }`}
            >
              <Heart className={`w-4 h-4 ${isShortlisted ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Live availability banner at bottom of image */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs">
          <span className="font-medium">
            {totalAvailable > 0 ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {totalAvailable} rooms available
              </span>
            ) : (
              <span className="text-rose-400">Fully Occupied</span>
            )}
          </span>
          <span className="text-[11px] text-slate-300">{hostel.distanceCampusApprox}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating and Area */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <div className="flex items-center gap-1 font-medium text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{hostel.area}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{hostel.campus}</span>
            </div>

            <div className="flex items-center gap-1 text-amber-600 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{hostel.ratingAvg.toFixed(1)}</span>
              <span className="text-[11px] text-slate-400 font-normal">({hostel.ratingCount})</span>
            </div>
          </div>

          {/* Name */}
          <Link href={`/hostels/${hostel.id}`}>
            <h3 className="font-bold text-slate-900 text-lg group-hover:text-emerald-700 transition line-clamp-1">
              {hostel.name}
            </h3>
          </Link>

          {/* Key Amenities row */}
          <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs">
            {hostel.amenities.includes('wifi') && (
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                <Wifi className="w-3 h-3 text-emerald-600" /> WiFi
              </span>
            )}
            {hostel.amenities.includes('power_backup') && (
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                <Zap className="w-3 h-3 text-amber-500" /> Generator
              </span>
            )}
            {hostel.amenities.includes('water') && (
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                <Droplet className="w-3 h-3 text-blue-500" /> Water
              </span>
            )}
            {hostel.amenities.includes('shuttle') && (
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                <Bus className="w-3 h-3 text-indigo-500" /> Shuttle
              </span>
            )}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Semester Rent</div>
            <div className="text-emerald-700 font-extrabold text-base">
              {minRent === maxRent ? (
                formatUGX(minRent)
              ) : (
                `${formatUGX(minRent)} - ${formatUGX(maxRent)}`
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onContactClick ? (
              <button
                onClick={() => onContactClick(hostel)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Contact
              </button>
            ) : (
              <Link
                href={`/hostels/${hostel.id}`}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1 transition"
              >
                View
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
