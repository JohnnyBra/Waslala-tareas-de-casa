import React from 'react';

// Simplified SVG paths for the avatar system
// All SVGs are designed for a 100x200 viewBox

export const AvatarAssets: Record<string, React.FC<any>> = {
  // --- BASES ---
  base_boy: (props) => (
    <g {...props}>
      <path d="M50 20 A15 15 0 0 1 50 50 A15 15 0 0 1 50 20 Z" fill="#FCD5B4" /> {/* Head */}
      <rect x="35" y="50" width="30" height="60" rx="5" fill="#FCD5B4" /> {/* Body */}
      <rect x="20" y="50" width="15" height="50" rx="5" fill="#FCD5B4" /> {/* Left Arm */}
      <rect x="65" y="50" width="15" height="50" rx="5" fill="#FCD5B4" /> {/* Right Arm */}
      <rect x="35" y="110" width="12" height="60" rx="5" fill="#FCD5B4" /> {/* Left Leg */}
      <rect x="53" y="110" width="12" height="60" rx="5" fill="#FCD5B4" /> {/* Right Leg */}
      {/* Short Hair */}
      <path d="M35 25 Q50 5 65 25 L65 35 Q50 20 35 35 Z" fill="#4A3426" />
    </g>
  ),
  base_girl: (props) => (
    <g {...props}>
      <path d="M50 20 A15 15 0 0 1 50 50 A15 15 0 0 1 50 20 Z" fill="#FCD5B4" /> {/* Head */}
      <rect x="35" y="50" width="30" height="60" rx="5" fill="#FCD5B4" /> {/* Body */}
      <rect x="20" y="50" width="15" height="50" rx="5" fill="#FCD5B4" /> {/* Left Arm */}
      <rect x="65" y="50" width="15" height="50" rx="5" fill="#FCD5B4" /> {/* Right Arm */}
      <rect x="35" y="110" width="12" height="60" rx="5" fill="#FCD5B4" /> {/* Left Leg */}
      <rect x="53" y="110" width="12" height="60" rx="5" fill="#FCD5B4" /> {/* Right Leg */}
      {/* Long Hair */}
      <path d="M30 35 Q50 5 70 35 L75 60 L25 60 Z" fill="#E6BE8A" />
    </g>
  ),
  base_hero: (props) => (
    <g {...props}>
        <path d="M50 20 A15 15 0 0 1 50 50 A15 15 0 0 1 50 20 Z" fill="#FFCCAA" />
        <rect x="30" y="50" width="40" height="60" rx="5" fill="#0000AA" /> {/* Muscular suit base */}
        <rect x="20" y="50" width="15" height="50" rx="5" fill="#0000AA" />
        <rect x="65" y="50" width="15" height="50" rx="5" fill="#0000AA" />
        <rect x="35" y="110" width="12" height="60" rx="5" fill="#0000AA" />
        <rect x="53" y="110" width="12" height="60" rx="5" fill="#0000AA" />
        <path d="M35 25 Q50 10 65 25 L65 30 Q50 15 35 30 Z" fill="#000" />
    </g>
  ),
  base_robot: (props) => (
    <g {...props}>
        <rect x="35" y="20" width="30" height="30" rx="2" fill="#AAA" /> {/* Head */}
        <rect x="30" y="50" width="40" height="60" rx="2" fill="#888" /> {/* Body */}
        <rect x="15" y="50" width="15" height="50" rx="2" fill="#AAA" />
        <rect x="70" y="50" width="15" height="50" rx="2" fill="#AAA" />
        <rect x="35" y="110" width="12" height="60" rx="2" fill="#AAA" />
        <rect x="53" y="110" width="12" height="60" rx="2" fill="#AAA" />
        <circle cx="43" cy="30" r="3" fill="cyan" />
        <circle cx="57" cy="30" r="3" fill="cyan" />
    </g>
  ),

  // --- TOPS ---
  top_tshirt_red: (props) => (
    <path d="M30 50 L70 50 L70 90 L30 90 Z M20 50 L35 50 L35 70 L20 70 Z M65 50 L80 50 L80 70 L65 70 Z" fill="#E53935" {...props} />
  ),
  top_tshirt_blue: (props) => (
    <path d="M30 50 L70 50 L70 90 L30 90 Z M20 50 L35 50 L35 70 L20 70 Z M65 50 L80 50 L80 70 L65 70 Z" fill="#1E88E5" {...props} />
  ),
  top_tshirt_green: (props) => (
    <path d="M30 50 L70 50 L70 90 L30 90 Z M20 50 L35 50 L35 70 L20 70 Z M65 50 L80 50 L80 70 L65 70 Z" fill="#43A047" {...props} />
  ),
  top_dress_pink: (props) => (
    <path d="M32 50 L68 50 L80 120 L20 120 Z M20 50 L35 50 L35 65 L20 60 Z M65 50 L80 50 L80 60 L65 65 Z" fill="#EC407A" {...props} />
  ),

  // --- BOTTOMS ---
  bot_shorts_blue: (props) => (
    <path d="M30 90 L70 90 L70 120 L53 120 L50 100 L47 120 L30 120 Z" fill="#1565C0" {...props} />
  ),
  bot_skirt_purple: (props) => (
    <path d="M30 90 L70 90 L85 130 L15 130 Z" fill="#8E24AA" {...props} />
  ),
  bot_jeans: (props) => (
    <path d="M30 90 L70 90 L70 160 L53 160 L53 105 L47 105 L47 160 L30 160 Z" fill="#0D47A1" {...props} />
  ),

  // --- SHOES ---
  shoes_sneakers: (props) => (
    <g {...props}>
      <path d="M28 160 L47 160 L47 175 L28 175 Z" fill="#FFF" />
      <path d="M53 160 L72 160 L72 175 L53 175 Z" fill="#FFF" />
    </g>
  ),
  shoes_boots: (props) => (
    <g {...props}>
        <path d="M28 150 L47 150 L47 175 L28 175 Z" fill="#3E2723" />
        <path d="M53 150 L72 150 L72 175 L53 175 Z" fill="#3E2723" />
    </g>
  ),

  // --- ACCESSORIES ---
  acc_cap: (props) => (
    <path d="M30 25 L70 25 L70 15 L30 15 Z M30 25 L80 25" stroke="#D32F2F" strokeWidth="5" fill="none" {...props} />
  ),
  acc_glasses: (props) => (
    <g {...props}>
      <circle cx="40" cy="35" r="5" stroke="black" fill="none" strokeWidth="2" />
      <circle cx="60" cy="35" r="5" stroke="black" fill="none" strokeWidth="2" />
      <line x1="45" y1="35" x2="55" y2="35" stroke="black" strokeWidth="2" />
    </g>
  ),
  acc_cape: (props) => (
    <path d="M30 50 L70 50 L85 150 L15 150 Z" fill="red" opacity="0.6" {...props} />
  ),
  acc_crown: (props) => (
    <path d="M30 25 L40 10 L50 25 L60 10 L70 25 L70 30 L30 30 Z" fill="gold" {...props} />
  )
};
