'use client';

import React, { useState, useRef, useEffect } from 'react';
import FaIcon from './FaIcon';

export interface SelectOption {
  id: string;
  label: string;
  icon?: string;
  badge?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: string;
  className?: string;
  menuWidthClass?: string;
  align?: 'left' | 'right';
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  icon,
  className = '',
  menuWidthClass = 'w-full min-w-[200px]',
  align = 'left'
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative font-sans ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border transition-all text-xs sm:text-sm font-medium flex items-center justify-between gap-2 bg-slate-50 hover:bg-white text-slate-800 focus:outline-none shadow-2xs ${
          isOpen
            ? 'border-[#0f3a98] ring-2 ring-[#0f3a98]/20 bg-white'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {icon ? (
            <FaIcon icon={icon} className="text-xs text-[#0f3a98] shrink-0" />
          ) : selectedOption?.icon ? (
            <FaIcon icon={selectedOption.icon} className="text-xs text-[#0f3a98] shrink-0" />
          ) : null}
          <span className="truncate text-slate-700">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <FaIcon
          icon="fa-solid fa-chevron-down"
          className={`text-[10px] text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#0f3a98]' : ''
          }`}
        />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 ${menuWidthClass} bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto`}
        >
          {options.map((option) => {
            const isSelected = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs sm:text-sm font-medium flex items-center justify-between gap-2 transition ${
                  isSelected
                    ? 'bg-[#e8effc] text-[#0f3a98]'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 truncate">
                  {option.icon && (
                    <FaIcon
                      icon={option.icon}
                      className={`text-xs shrink-0 ${
                        isSelected ? 'text-[#0f3a98]' : 'text-slate-400'
                      }`}
                    />
                  )}
                  <span className="truncate">{option.label}</span>
                </div>

                {isSelected && (
                  <FaIcon icon="fa-solid fa-check" className="text-xs text-[#0f3a98] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
