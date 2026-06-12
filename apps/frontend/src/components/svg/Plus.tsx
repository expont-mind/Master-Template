export const Plus = ({ size = 20, color = "#020617" }: { size?: number; color?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M9.9987 3.33203V16.6654M16.6654 9.9987H3.33203"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
