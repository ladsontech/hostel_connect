import React from 'react';

interface FaIconProps {
  icon: string; // e.g. "fa-solid fa-hotel", "fa-brands fa-google"
  className?: string;
}

export default function FaIcon({ icon, className = '' }: FaIconProps) {
  return <i className={`${icon} ${className}`} aria-hidden="true" />;
}

