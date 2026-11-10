'use client';

import React from 'react';
import { Hostel } from '@/types';
import { formatUGX } from '@/lib/utils';
import FaIcon from './FaIcon';

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
    { id: 'water', label: '24/7 Running Water', icon: 'fa-solid fa-droplet' },
    { id: 'power_backup', label: 'Standby Generator / Solar', icon: 'fa-solid fa-bolt' },
    { id: 'wifi', label: 'High Speed WiFi', icon: 'fa-solid fa-wifi' },
    { id: 'security', label: 'CCTV & Security Guards', icon: 'fa-solid fa-shield-halved' },
    { id: 'shuttle', label: 'Free Campus Shuttle', icon: 'fa-solid fa-van-shuttle' },
    { id: 'meals', label: 'Cafeteria / Dining Hall', icon: 'fa-solid fa-utensils' },
    { id: 'gym', label: 'Gym / Fitness Facility', icon: 'fa-solid fa-dumbbell' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm font-sans">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-[#e8effc] text-[#0f3a98]">
                FR-2.7 Specification
              </span>
              <h3 className="font-medium text-[#0f3a98] text-lg">Compare Hostels Side-by-Side</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing {hostels.length} of max 3 hostels to make your decision easier.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0f3a98] hover:bg-[#0a2666] text-white flex items-center justify-center transition shadow-sm"
          >
            <FaIcon icon="fa-solid fa-xmark" className="text-xs text-white" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-4 sm:p-6 overflow-x-auto flex-1">
          {hostels.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm font-medium">
              No hostels selected for comparison. Tap the layers icon on any hostel card to add it!
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 min-w-[640px]">
              {/* Feature column */}
              <div className="space-y-4 pt-48 font-medium text-xs text-slate-500 border-r border-slate-100 pr-3">
                <div className="h-9 flex items-center">Area & Campus</div>
                <div className="h-9 flex items-center">Verified Status</div>
                <div className="h-9 flex items-center">Rating & Reviews</div>
                <div className="h-9 flex items-center">Distance to Campus</div>
                <div className="h-9 flex items-center">Per Semester</div>
                <div className="h-9 flex items-center">Available Rooms</div>
                {AMENITY_KEYS.map(a => (
                  <div key={a.id} className="h-7 flex items-center text-slate-600 font-medium gap-1.5">
                    <FaIcon icon={a.icon} className="text-[10px] text-slate-400" />
                    <span>{a.label}</span>
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
                          <FaIcon icon="fa-solid fa-trash-can" className="text-[10px]" />
                        </button>
                      </div>

                      <h4 className="font-medium text-slate-900 text-sm line-clamp-1">
                        {`Verified ${hostel.genderPolicy === 'girls_only' ? "Girls' " : hostel.genderPolicy === 'boys_only' ? "Boys' " : ''}Student Hostel`}
                      </h4>

                      {/* Row 1: Area & Campus */}
                      <div className="h-9 flex items-center text-xs font-medium text-slate-700">
                        <FaIcon icon="fa-solid fa-location-dot" className="text-xs text-[#0f3a98] mr-1.5 shrink-0" />
                        <span className="truncate">{hostel.area}, {hostel.campus}</span>
                      </div>

                      {/* Row 2: Status */}
                      <div className="h-9 flex items-center">
                        {hostel.status === 'claimed' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#0f3a98] bg-[#e8effc] px-2 py-0.5 rounded">
                            <FaIcon icon="fa-solid fa-shield-halved" className="text-[10px] text-[#ffbe00]" /> Verified Owner
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                            <FaIcon icon="fa-solid fa-tag" className="text-[10px]" /> Agent Listed
                          </span>
                        )}
                      </div>

                      {/* Row 3: Rating */}
                      <div className="h-9 flex items-center text-xs font-medium text-slate-800">
                        <FaIcon icon="fa-solid fa-star" className="text-xs text-[#ffbe00] mr-1.5" />
                        {hostel.ratingAvg.toFixed(1)} ({hostel.ratingCount})
                      </div>

                      {/* Row 4: Distance */}
                      <div className="h-9 flex items-center text-xs text-slate-600 font-medium">
                        {hostel.distanceCampusApprox}
                      </div>

                      {/* Row 5: Price */}
                      <div className="h-9 flex items-center font-medium text-xs text-[#0f3a98]">
                        {formatUGX(minRent)}
                      </div>

                      {/* Row 6: Availability */}
                      <div className="h-9 flex items-center text-xs font-medium">
                        {available > 0 ? (
                          <span className="text-[#0f3a98]">{available} vacant</span>
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
                              <FaIcon icon="fa-solid fa-check" className="text-xs text-[#0f3a98]" />
                            ) : (
                              <FaIcon icon="fa-solid fa-minus" className="text-xs text-slate-300" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <button
                        onClick={() => onContactClick(hostel)}
                        className="w-full py-2 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium transition shadow-sm"
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
