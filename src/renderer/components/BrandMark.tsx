import React from "react";
import logo from "../assets/logo.png";

export default function BrandMark({ size = 32 }: { size?: number }): React.JSX.Element {
  return (
    <img
      src={logo}
      width={size}
      height={size}
      alt="PoyeriaOpti"
      aria-hidden="true"
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}
