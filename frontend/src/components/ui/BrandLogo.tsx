import React from 'react';
import logo from '../../assets/Logo.png';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  className?: string;
  isLink?: boolean;
  hideTextOnMobile?: boolean;
}

export function BrandLogo({ className = "", isLink = false, hideTextOnMobile = false }: BrandLogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src={logo} alt="NWIS Logo" className="h-9 w-9 object-contain flex-shrink-0" />
      <div className="flex flex-col justify-center">
        <span className="text-[18px] font-[800] text-[#F5F5F2] uppercase tracking-[0.12em] leading-none">
          NWIS
        </span>
        <span className={`text-[10px] font-medium text-[#737373] uppercase tracking-[0.18em] mt-1.5 ${hideTextOnMobile ? 'hidden sm:block' : ''}`}>
          Nearby Wells Intelligence System
        </span>
      </div>
    </div>
  );

  if (isLink) {
    return (
      <Link to="/" className="hover:opacity-80 transition-opacity" style={{ textDecoration: 'none' }}>
        {content}
      </Link>
    );
  }

  return content;
}
