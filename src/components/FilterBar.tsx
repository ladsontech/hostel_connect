'use client';

import React, { useState } from 'react';
import { formatUGX } from '@/lib/utils';
import FaIcon from './FaIcon';

export interface FilterState {
  q: string;
  campus: string;
  area: string;
  roomType: string;
  minPrice: number;
  maxPrice: number;
  gender: string;
  amenities: string[];
  sort: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  totalResults: number;
}

export default function FilterBar({
  filters,
  onChange,
  onReset,
  totalResults
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleAmenity = (amenityId: string) => {
    const next = filters.amenities.includes(amenityId)
      ? filters.amenities.filter(a => a !== amenityId)
      : [...filters.amenities, amenityId];
    onChange({ ...filters, amenities: next });
  };

  const campuses = [
    'All Universities',
    'Makerere University',
    'MUBS',
    'Kyambogo University',
    'Uganda Christian University',
    'KIU'
  ];

  const roomTypes = [
    { id: '', label: 'All Room Types' },
    { id: 'single', label: 'Single Non-Self Contained' },
    { id: 'double', label: 'Double Shared' },
    { id: 'self_contained_single', label: 'Self-Contained Single' },
    { id: 'self_contained_double', label: 'Self-Contained Double' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4 font-sans">
      {/* Top Search & Primary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Main Search Input */}
        <div className="sm:col-span-6 relative">
          <span className="absolute left-3.5 top-3 text-slate-400">
            <FaIcon icon="fa-solid fa-magnifying-glass" className="text-xs" />
          </span>
          <input
            type="text"
            placeholder="Search hostel name, area (Kikoni, Banda...) or landmark"
            value={filters.q}
            onChange={e => onChange({ ...filters, q: e.target.value })}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
          />
          {filters.q && (
            <button
              onClick={() => onChange({ ...filters, q: '' })}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <FaIcon icon="fa-solid fa-xmark" className="text-xs" />
            </button>
          )}
        </div>

        {/* Campus Dropdown */}
        <div className="sm:col-span-3">
          <select
            value={filters.campus}
            onChange={e => onChange({ ...filters, campus: e.target.value === 'All Universities' ? '' : e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-semibold text-slate-700"
          >
            {campuses.map(c => (
              <option key={c} value={c === 'All Universities' ? '' : c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Filters & Sort */}
        <div className="sm:col-span-3 flex items-center gap-2 justify-end">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition ${
              showAdvanced || filters.roomType || filters.amenities.length > 0
                ? 'border-[#0f3a98] bg-[#e8effc] text-[#0f3a98]'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <FaIcon icon="fa-solid fa-sliders" className="text-xs" />
            <span>Filters</span>
            {filters.amenities.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#ffbe00] text-[#0f3a98] text-[11px] flex items-center justify-center font-extrabold">
                {filters.amenities.length}
              </span>
            )}
          </button>

          <select
            value={filters.sort}
            onChange={e => onChange({ ...filters, sort: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
          >
            <option value="relevance">Sort: Recommended</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Advanced Filter Drawer */}
      {showAdvanced && (
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Room Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Room Type</label>
              <select
                value={filters.roomType}
                onChange={e => onChange({ ...filters, roomType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-medium"
              >
                {roomTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>
                    {rt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Budget (UGX) */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Budget Max:</span>
                <span className="text-[#0f3a98] font-extrabold">{formatUGX(filters.maxPrice)}</span>
              </div>
              <input
                type="range"
                min={500000}
                max={3000000}
                step={50000}
                value={filters.maxPrice}
                onChange={e => onChange({ ...filters, maxPrice: parseInt(e.target.value) })}
                className="w-full accent-[#0f3a98] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                <span>UGX 500k</span>
                <span>UGX 3M+</span>
              </div>
            </div>

            {/* Gender Policy */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender Policy</label>
              <select
                value={filters.gender}
                onChange={e => onChange({ ...filters, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-medium"
              >
                <option value="">All (Mixed & Single Gender)</option>
                <option value="mixed">Mixed Hostel</option>
                <option value="girls_only">Girls Only</option>
                <option value="boys_only">Boys Only</option>
              </select>
            </div>
          </div>

          {/* Amenities Checklist with FontAwesome Icons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Must-Have Amenities</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'water', label: 'Constant Water', icon: 'fa-solid fa-droplet' },
                { id: 'power_backup', label: 'Standby Generator', icon: 'fa-solid fa-bolt' },
                { id: 'wifi', label: 'Fast WiFi', icon: 'fa-solid fa-wifi' },
                { id: 'shuttle', label: 'Campus Shuttle', icon: 'fa-solid fa-van-shuttle' },
                { id: 'meals', label: 'Meals / Dining', icon: 'fa-solid fa-utensils' },
                { id: 'security', label: 'CCTV & Guards', icon: 'fa-solid fa-shield-halved' },
                { id: 'gym', label: 'Gym Facility', icon: 'fa-solid fa-dumbbell' }
              ].map(amenity => {
                const active = filters.amenities.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border transition ${
                      active
                        ? 'border-[#0f3a98] bg-[#0f3a98] text-[#ffbe00] shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <FaIcon icon={active ? 'fa-solid fa-check' : amenity.icon} className="text-xs" />
                    <span>{amenity.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-slate-600">
              Showing <strong className="text-[#0f3a98]">{totalResults}</strong> matching hostels
            </span>
            <button
              onClick={onReset}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
