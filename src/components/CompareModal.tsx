'use client';

import React from 'react';
import { Hostel } from '@/types';
import { formatUGX } from '@/lib/utils';
import { 
  X, 
  Check, 
  Minus, 
  Star, 
  ShieldCheck, 
  MapPin, 
  Building2,
  Trash2 
} from 'lucide-react';

interface CompareModalProps {
  hostels: Hostel[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveHostel: (id: string) => void;
  onContactClick: (hostel: Hostel) => void;
}

export default function CompareModal({
  hostels,
  isOpen,
  onClose,
  onRemoveHostel,
  onContactClick
}: CompareModalProps) {
  if (!isOpen) return null;

  const AMENITY_KEYS = [
    { id: 'water', label: '24/7 Running Water' },
    { id: 'power_backup', label: 'Standby Generator / Solar' },
    { id: 'wifi', label: 'High Speed WiFi' },
    { id: 'security', label: 'CCTV & Security Guards' },
    { id: 'shuttle', label: 'Free Campus Shuttle' },
    { id: 'meals', label: 'Cafeteria / Dining Hall' },
    { id: 'gym', label: 'Gym / Fitness Facility' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                FR-2.7 Specification
              </span>
              <h3 className="font-extrabold text-slate-900 text-lg">Compare Hostels Side-by-Side</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing {hostels.length} of max 3 hostels to make your decision easier.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-4 sm:p-6 overflow-x-auto flex-1">
          {hostels.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No hostels selected for comparison. Tap the layers icon on any hostel card to add it!
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 min-w-[640px]">
              {/* Feature column */}
              <div className="space-y-4 pt-48 font-semibold text-xs text-slate-500 border-r border-slate-100 pr-3">
                <div className="h-9 flex items-center">Area & Campus</div>
                <div className="h-9 flex items-center">Verified Status</div>
                <div className="h-9 flex items-center">Rating & Reviews</div>
                <div className="h-9 flex items-center">Distance to Campus</div>
                <div className="h-9 flex items-center">Semester Rent Range</div>
                <div className="h-9 flex items-center">Available Rooms</div>
                {AMENITY_KEYS.map(a => (
                  <div key={a.id} className="h-7 flex items-center text-slate-600">
                    {a.label}
                  </div>
                ))}
              </div>

              {/* Hostels columns */}
              {hostels.map(hostel => {
                const cover = hostel.photos.find(p => p.isCover) || hostel.photos[0];
                const rents = hostel.rooms.map(r => r.rentUgx);
                const minRent = rents.length ? Math.min(...rents) : 0;
                const maxRent = rents.length ? Math.max(...rents) : 0;
                const available = hostel.rooms.reduce((acc, r) => acc + r.roomsAvailable, 0);

                return (
                  <div key={hostel.id} className="space-y-4 flex flex-col justify-between">
                    <div>
                      {/* Top Card preview */}
                      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 mb-2 border border-slate-200">
                        {cover && (
                          <img
                            src={cover.url}
                            alt={hostel.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          onClick={() => onRemoveHostel(hostel.id)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{hostel.name}</h4>

                      {/* Row 1: Area & Campus */}
                      <div className="h-9 flex items-center text-xs text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 mr-1 shrink-0" />
                        <span className="truncate">{hostel.area}, {hostel.campus}</span>
                      </div>

                      {/* Row 2: Status */}
                      <div className="h-9 flex items-center">
                        {hostel.status === 'claimed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Owner
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            Agent Listed
                          </span>
                        )}
                      </div>

                      {/* Row 3: Rating */}
                      <div className="h-9 flex items-center text-xs font-bold text-slate-800">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-current mr-1" />
                        {hostel.ratingAvg.toFixed(1)} ({hostel.ratingCount})
                      </div>

                      {/* Row 4: Distance */}
                      <div className="h-9 flex items-center text-xs text-slate-600">
                        {hostel.distanceCampusApprox}
                      </div>

                      {/* Row 5: Price */}
                      <div className="h-9 flex items-center font-extrabold text-xs text-emerald-700">
                        {minRent === maxRent
                          ? formatUGX(minRent)
                          : `${formatUGX(minRent)} - ${formatUGX(maxRent)}`}
                      </div>

                      {/* Row 6: Availability */}
                      <div className="h-9 flex items-center text-xs font-bold">
                        {available > 0 ? (
                          <span className="text-emerald-600">{available} vacant</span>
                        ) : (
                          <span className="text-rose-600">Full</span>
                        )}
                      </div>

                      {/* Amenities checklist rows */}
                      {AMENITY_KEYS.map(a => {
                        const hasAmenity = hostel.amenities.includes(a.id);
                        return (
                          <div key={a.id} className="h-7 flex items-center">
                            {hasAmenity ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Minus className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <button
                        onClick={() => onContactClick(hostel)}
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                      >
                        Contact Sellers
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
