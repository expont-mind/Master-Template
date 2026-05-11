import { SVGProps } from "react";

export const MonpangLogo = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="115"
      height="22"
      viewBox="0 0 115 22"
      fill="none"
      {...props}
    >
      <text
        y="17"
        fontFamily="Manrope, sans-serif"
        fontSize="20"
        fontWeight="700"
        letterSpacing="-0.4"
      >
        <tspan fill="#F43F5E">mon</tspan>
        <tspan fill="#020617">pang</tspan>
      </text>
    </svg>
  );
};
