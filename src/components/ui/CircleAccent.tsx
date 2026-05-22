import { useId } from 'react';

interface CircleAccentProps {
  children: React.ReactNode;
}

export function CircleAccent({ children }: CircleAccentProps) {
  const filterId = useId();

  return (
    <span className="circle-accent">
      {children}
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-15%" y="-40%" width="130%" height="180%">
            <feTurbulence type="turbulence" baseFrequency="0.065" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <ellipse
          cx="50" cy="20" rx="47" ry="17"
          fill="none"
          stroke="#D30800"
          strokeWidth="3.5"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="97 3"
          transform="rotate(-1.5 50 20)"
          filter={`url(#${filterId})`}
        />
      </svg>
    </span>
  );
}
