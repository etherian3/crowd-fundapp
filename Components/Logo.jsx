import React from "react";

const Logo = ({ color = "purple" }) => {
  const fill = color === "white" ? "#ffffff" : "#9333ea";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
      <path d="M12 7v7"></path>
      <path d="M8 10v1"></path>
      <path d="M16 10v1"></path>
    </svg>
  );
};

export default Logo;
