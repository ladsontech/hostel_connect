'use client';

import React, { useState, useEffect, useRef } from 'react';
import FaIcon from './FaIcon';

export interface BoundedSelectOption<T extends string = string> {
  value: T;
  label: string;
}

/**
 * Bounded custom dropdown menu styled in Hostel Connect theme blue (#0f3a98)
 * that stays strictly within its container width on mobile frames without
 * native OS <select> popup overflow.
 */
export default function BoundedSelect<T extends string = string>({
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
}: {
  value: T;
  options: BoundedSelectOption<T>[];
  onChange: (next: T) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const currentLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        className={`w-full px-3 py-2 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2 text-left transition hover:border-[#0f3a98] focus:outline-none focus:ring-2 focus:ring-[#0f3a98] ${buttonClassName}`}
      >
        <span className="truncate font-medium text-[#0f3a98]">{currentLabel}</span>
        <FaIcon
          icon="fa-solid fa-chevron-down"
          className={`text-[10px] text-slate-400 shrink-0 transition-transform ${
            open ? 'rotate-180 text-[#0f3a98]' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-xl z-40 overflow-hidden max-h-60 overflow-y-auto py-1 ${menuClassName}`}
        >
          {options.map(opt => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs transition flex items-center justify-between gap-2 ${
                  active
                    ? 'bg-[#0f3a98] text-white font-semibold'
                    : 'text-slate-700 hover:bg-[#edf2fc] hover:text-[#0f3a98] font-medium'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {active && (
                  <FaIcon icon="fa-solid fa-check" className="text-[10px] text-[#ffbe00] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
