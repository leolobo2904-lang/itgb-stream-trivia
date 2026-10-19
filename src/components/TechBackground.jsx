import React from 'react';

export default function TechBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#080D1A]">
      {/* Radial Gradient Glows */}
      <div 
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-25"
        style={{ background: 'radial-gradient(circle, #00E5FF 0%, #1E6BFF 50%, transparent 70%)' }}
      />
      <div 
        className="absolute top-[45%] -right-[15%] w-[450px] h-[450px] rounded-full blur-[140px] opacity-20"
        style={{ background: 'radial-gradient(circle, #0077FF 0%, #0B111E 70%, transparent 100%)' }}
      />
      <div 
        className="absolute -bottom-[15%] -left-[15%] w-[500px] h-[500px] rounded-full blur-[130px] opacity-20"
        style={{ background: 'radial-gradient(circle, #00E5FF 0%, #080D1A 70%, transparent 100%)' }}
      />

      {/* High-Tech Circuit Board Traces Pattern (SVG) */}
      <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit-pattern" width="160" height="160" patternUnits="userSpaceOnUse">
            {/* Grid Dots */}
            <circle cx="20" cy="20" r="1.5" fill="#00E5FF" opacity="0.6" />
            <circle cx="100" cy="20" r="1.5" fill="#00E5FF" opacity="0.6" />
            <circle cx="20" cy="100" r="1.5" fill="#00E5FF" opacity="0.6" />
            <circle cx="100" cy="100" r="1.5" fill="#00E5FF" opacity="0.6" />
            <circle cx="140" cy="140" r="1.5" fill="#00E5FF" opacity="0.6" />
            
            {/* Circuit Traces */}
            <path d="M 20 20 L 60 20 L 80 40 L 80 80 L 100 100" fill="none" stroke="#00E5FF" strokeWidth="0.8" opacity="0.5" />
            <path d="M 140 20 L 120 40 L 120 70 L 140 90 L 140 140" fill="none" stroke="#00E5FF" strokeWidth="0.8" opacity="0.4" />
            <path d="M 40 140 L 40 110 L 60 90 L 90 90" fill="none" stroke="#38BDF8" strokeWidth="0.8" opacity="0.4" />
            <path d="M 0 60 L 30 60 L 50 80" fill="none" stroke="#00E5FF" strokeWidth="0.8" opacity="0.3" />

            {/* Microchip Contact Pads */}
            <rect x="76" y="36" width="8" height="8" fill="none" stroke="#00E5FF" strokeWidth="0.8" opacity="0.6" />
            <rect x="58" y="88" width="6" height="6" fill="#00E5FF" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
      </svg>

      {/* Cyber Grid Lines overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #00E5FF 1px, transparent 1px), linear-gradient(to bottom, #00E5FF 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Subtle top horizontal glowing accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-40 shadow-[0_0_12px_#00E5FF]" />
    </div>
  );
}
