import React from 'react';

export default function ItgbLogo({ size = 'md', className = '' }) {
  const sizeMap = {
    xs: 'w-8 h-10',
    sm: 'w-10 h-13',
    md: 'w-16 h-20',
    lg: 'w-24 h-32',
    xl: 'w-32 h-40',
  };

  return (
    <div className={`inline-flex items-center justify-center ${sizeMap[size] || sizeMap.md} ${className}`}>
      <img 
        src="/logo.png" 
        alt="Instituto Técnico Belgrano F29" 
        className="w-full h-full object-contain drop-shadow-lg select-none pointer-events-none"
        onError={(e) => {
          // Fallback if logo.png is not found, try logoitgb.png
          e.target.src = '/logoitgb.png';
        }}
      />
    </div>
  );
}
