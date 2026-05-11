interface StopwatchProps {
  size?: number;
  className?: string;
}

export const Stopwatch = ({ size = 72, className }: StopwatchProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main circle */}
      <circle cx="36" cy="40" r="26" stroke="#F43F5E" strokeWidth="4" />
      {/* Top button */}
      <rect x="32" y="6" width="8" height="10" rx="2" fill="#F43F5E" />
      {/* Button connector */}
      <rect x="34" y="14" width="4" height="4" fill="#F43F5E" />
      {/* Side button */}
      <rect
        x="54"
        y="18"
        width="6"
        height="12"
        rx="2"
        transform="rotate(45 54 18)"
        fill="#F97316"
      />
      {/* Hour hand */}
      <line
        x1="36"
        y1="40"
        x2="36"
        y2="24"
        stroke="#F43F5E"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <line
        x1="36"
        y1="40"
        x2="48"
        y2="40"
        stroke="#F97316"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx="36" cy="40" r="3" fill="#F43F5E" />
    </svg>
  );
};
