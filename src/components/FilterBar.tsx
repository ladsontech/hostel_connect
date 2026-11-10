'use client';

import React, { useState } from 'react';
import { formatUGX } from '@/lib/utils';
import FaIcon from './FaIcon';
import CustomSelect, { SelectOption } from './CustomSelect';

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

  const campusOptions: SelectOption[] = [
    { id: '', label: 'All Universities', icon: 'fa-solid fa-building-columns' },
    { id: 'Makerere University', label: 'Makerere University', icon: 'fa-solid fa-graduation-cap' },
    { id: 'MUBS', label: 'MUBS (Nakawa)', icon: 'fa-solid fa-graduation-cap' },
    { id: 'Kyambogo University', label: 'Kyambogo University', icon: 'fa-solid fa-graduation-cap' },
    { id: 'Uganda Christian University', label: 'Uganda Christian University (UCU)', icon: 'fa-solid fa-graduation-cap' },
    { id: 'KIU', label: 'KIU (Kansanga)', icon: 'fa-solid fa-graduation-cap' }
  ];

  const sortOptions: SelectOption[] = [
    { id: 'relevance', label: 'Sort: Recommended', icon: 'fa-solid fa-wand-magic-sparkles' },
    { id: 'price_asc', label: 'Price: Low to High', icon: 'fa-solid fa-arrow-down-1-9' },
    { id: 'price_desc', label: 'Price: High to Low', icon: 'fa-solid fa-arrow-down-9-1' },
    { id: 'rating', label: 'Top Rated Hostels', icon: 'fa-solid fa-star' }
  ];

  const roomTypeOptions: SelectOption[] = [
    { id: '', label: 'All Room Types', icon: 'fa-solid fa-door-open' },
    { id: 'single', label: 'Single Non-Self Contained', icon: 'fa-solid fa-bed' },
    { id: 'double', label: 'Double Shared Room', icon: 'fa-solid fa-user-group' },
    { id: 'self_contained_single', label: 'Self-Contained Single', icon: 'fa-solid fa-bath' },
    { id: 'self_contained_double', label: 'Self-Contained Double', icon: 'fa-solid fa-bath' }
  ];

  const genderOptions: SelectOption[] = [
    { id: '', label: 'All (Mixed & Single Gender)', icon: 'fa-solid fa-venus-mars' },
    { id: 'mixed', label: 'Mixed Hostel', icon: 'fa-solid fa-people-roof' },
    { id: 'girls_only', label: 'Girls Only Hostel', icon: 'fa-solid fa-person-dress' },
    { id: 'boys_only', label: 'Boys Only Hostel', icon: 'fa-solid fa-person' }
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
          <CustomSelect
            value={filters.campus}
            onChange={val => onChange({ ...filters, campus: val })}
            options={campusOptions}
            icon="fa-solid fa-graduation-cap"
            menuWidthClass="w-full min-w-[260px]"
          />
        </div>

        {/* Toggle Filters & Sort */}
        <div className="sm:col-span-3 flex items-center gap-2 justify-end">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition shrink-0 ${
              showAdvanced || filters.roomType || filters.amenities.length > 0
                ? 'border-[#0f3a98] bg-[#e8effc] text-[#0f3a98]'
                : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
            }`}
          >
            <FaIcon icon="fa-solid fa-sliders" className="text-xs" />
            <span>Filters</span>
            {filters.amenities.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#ffbe00] text-[#0f3a98] text-[11px] flex items-center justify-center font-medium">
                {filters.amenities.length}
              </span>
            )}
          </button>

          <CustomSelect
            value={filters.sort}
            onChange={val => onChange({ ...filters, sort: val })}
            options={sortOptions}
            menuWidthClass="w-56"
            align="right"
          />
        </div>
      </div>

      {/* Advanced Filter Drawer */}
      {showAdvanced && (
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Room Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Room Type</label>
              <CustomSelect
                value={filters.roomType}
                onChange={val => onChange({ ...filters, roomType: val })}
                options={roomTypeOptions}
                menuWidthClass="w-full min-w-[240px]"
              />
            </div>

            {/* Max Budget (UGX) */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Budget Max:</span>
                <span className="text-[#0f3a98] font-medium">{formatUGX(filters.maxPrice)}</span>
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
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Gender Policy</label>
              <CustomSelect
                value={filters.gender}
                onChange={val => onChange({ ...filters, gender: val })}
                options={genderOptions}
                menuWidthClass="w-full min-w-[240px]"
              />
            </div>
          </div>

          {/* Amenities Checklist with FontAwesome Icons */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Must-Have Amenities</label>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition ${
                      active
                        ? 'border-[#0f3a98] bg-[#0f3a98] text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <FaIcon
                      icon={active ? 'fa-solid fa-check' : amenity.icon}
                      className={`text-xs ${active ? 'text-white' : 'text-slate-500'}`}
                    />
                    <span>{amenity.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-slate-600">
              Showing <strong className="text-[#0f3a98]">{totalResults}</strong> matching hostels
            </span>
            <button
              onClick={onReset}
              className="text-xs font-medium text-rose-600 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
