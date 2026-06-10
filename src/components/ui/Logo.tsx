export function Logo() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo"
    >
      {/* Background glow blur filters */}
      <defs>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4845a" />
          <stop offset="100%" stopColor="#c9a96e" />
        </linearGradient>

        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id="boardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(212, 132, 90, 0.4)" />
          <stop offset="100%" stopColor="rgba(201, 169, 110, 0.3)" />
        </linearGradient>
      </defs>

      {/* Outer ring - represents connection/projects */}
      <circle
        cx="24"
        cy="24"
        r="22"
        fill="none"
        stroke="url(#accentGrad)"
        strokeWidth="1.5"
        opacity="0.6"
      />

      {/* Inner glow circle */}
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="url(#boardGrad)"
        filter="url(#glow)"
      />

      {/* Core geometric symbol - three overlapping segments representing kanban, projects, notes */}
      <g filter="url(#glow)">
        {/* Top segment */}
        <path
          d="M 24 10 Q 32 16 28 22 Q 20 24 24 10 Z"
          fill="url(#accentGrad)"
          opacity="0.8"
        />

        {/* Bottom-left segment */}
        <path
          d="M 24 24 Q 16 26 14 34 Q 12 28 24 24 Z"
          fill="#c9a96e"
          opacity="0.7"
        />

        {/* Bottom-right segment */}
        <path
          d="M 24 24 Q 32 26 34 34 Q 36 28 24 24 Z"
          fill="#d4845a"
          opacity="0.75"
        />
      </g>

      {/* Center dot - core of the system */}
      <circle
        cx="24"
        cy="24"
        r="2.5"
        fill="url(#accentGrad)"
        filter="url(#glow)"
      />

      {/* Accent triangular frame - modern, premium feel */}
      <g strokeWidth="0.5" fill="none">
        <path
          d="M 12 14 L 24 8 L 36 14"
          stroke="url(#accentGrad)"
          opacity="0.4"
        />
        <path
          d="M 12 34 L 24 40 L 36 34"
          stroke="url(#accentGrad)"
          opacity="0.4"
        />
      </g>
    </svg>
  );
}
