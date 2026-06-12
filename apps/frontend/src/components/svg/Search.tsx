import { SVGProps } from "react";

export const Search = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <path
        d="M14.167 14.1641L17.5003 17.4974"
        stroke={props.color || "#94A3B8"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667Z"
        stroke={props.color || "#94A3B8"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
