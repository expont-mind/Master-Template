export const Minus = ({ size = 20, color = "#CBD5E1" }: { size?: number; color?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
    >
      <path d="M16.668 10H3.33464" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
