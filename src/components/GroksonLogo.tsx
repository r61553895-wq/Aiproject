import React from 'react';

interface GroksonLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const GroksonIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GROKSON"
    >
      {/* Outer sleek aerodynamic G arc */}
      <path
        d="M62.5 32.5 L46 32.5 C34.5 32.5 25 41.5 25 53 C25 64.5 34.5 73.5 46 73.5 C55 73.5 62 67.5 64 60 L54 60 C52.5 64 49.5 67 45.5 67 C38 67 32 61 32 53 C32 45 38 39 45.5 39 L64.5 39 L62.5 32.5 Z"
        fill="currentColor"
      />
      {/* Inner lightning-seven / angled arrowhead glyph */}
      <path
        d="M44 47.5 L64 42 L50.5 72 L42 72 L54.5 48.5 L44 47.5 Z"
        fill="currentColor"
      />
      {/* Outer top-right aerodynamic wing */}
      <path
        d="M46 32.5 L62.5 32.5 L59.5 42 L46 42 C40 42 35 47 35 53 C35 59 40 64 46 64 C51 64 55 60.5 56.5 56 L47 56 L49 49.5 L66.5 49.5 L64 61 C60.5 70 53.5 74.5 45.5 74.5 C33.5 74.5 24 65 24 53 C24 41 33.5 32.5 46 32.5 Z"
        fill="currentColor"
      />
      <path
        d="M45 47.5 L63.5 42.5 L50 71.5 L42.5 71.5 L54 48 L45 47.5 Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const GroksonEmblem: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dynamic G arc */}
      <path
        d="M125 65 L92 65 C70 65 52 81 52 103 C52 125 70 141 92 141 C107 141 119 131 123 116 L104 116 C101 123 97 127 91 127 C78 127 67 117 67 103 C67 89 78 79 91 79 L129 79 L125 65 Z"
        fill="#FFFFFF"
      />
      {/* Inner lightning slash */}
      <polygon
        points="88,95 127,84 100,142 84,142 108,97 88,95"
        fill="#FFFFFF"
      />
      {/* Additional high-fidelity contour layer matching Grokson graphic */}
      <path
        d="M92 65 L125 65 L119 84 L92 84 C81.5 84 73 92.5 73 103 C73 113.5 81.5 122 92 122 C99.5 122 106 117 108 109 L94 109 L98 96 L131 96 L126 119 C119 135 106 144 91 144 C67 144 48 125 48 103 C48 81 67 65 92 65 Z"
        fill="#FFFFFF"
      />
      <polygon
        points="89,95 126,85 99,142 85,142 107,98 89,95"
        fill="#FFFFFF"
      />
    </svg>
  );
};

export const GroksonLogo: React.FC<GroksonLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeMap = {
    sm: { icon: 'w-5 h-5', text: 'text-xs tracking-[0.25em]', gap: 'gap-2' },
    md: { icon: 'w-6 h-6', text: 'text-sm tracking-[0.3em]', gap: 'gap-2.5' },
    lg: { icon: 'w-10 h-10', text: 'text-base tracking-[0.35em]', gap: 'gap-3' },
    xl: { icon: 'w-20 h-20', text: 'text-2xl sm:text-3xl tracking-[0.4em]', gap: 'gap-4' },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center select-none ${current.gap} ${className}`}>
      <div className="relative flex items-center justify-center">
        <GroksonIcon className={`${current.icon} text-white shrink-0`} />
      </div>
      {showText && (
        <span
          className={`font-mono uppercase font-bold text-white ${current.text} leading-none`}
          style={{ fontFamily: "'Michroma', 'Orbitron', monospace", letterSpacing: '0.35em' }}
        >
          GROKSON
        </span>
      )}
    </div>
  );
};
