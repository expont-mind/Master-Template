export const HeartProduct = ({ filled = false }: { filled?: boolean }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="20"
      viewBox="0 0 21 20"
      fill="none"
    >
      <path
        d="M14.5 1.91797C17.5173 1.91797 19.667 4.35833 19.667 7.24707C19.6668 9.43994 18.2849 11.5882 16.7988 13.2969C15.276 15.0477 13.462 16.5402 12.2568 17.4414C11.1106 18.2986 9.5564 18.2986 8.41016 17.4414C7.20504 16.5402 5.39107 15.0478 3.86816 13.2969C2.38206 11.5882 1.00017 9.44001 1 7.24707C1 4.35833 3.14973 1.91797 6.16699 1.91797C7.52788 1.91804 8.8299 2.34315 10.333 3.63672C11.8364 2.3428 13.1389 1.91797 14.5 1.91797Z"
        fill={filled ? "#F43F5E" : "#020617"}
        fillOpacity={filled ? "1" : "0.4"}
        stroke={filled ? "#F43F5E" : "#F8FAFC"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: "fill 200ms ease, fill-opacity 200ms ease, stroke 200ms ease" }}
      />
    </svg>
  );
};
