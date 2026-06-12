import { SVGProps } from "react";

export const ArrowUpRight = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M17 7L7 17M17 7H9M17 7V15"
        stroke={props.color || "#94A3B8"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
