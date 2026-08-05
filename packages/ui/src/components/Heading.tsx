import React from "react";

type Props = {
  children: React.ReactNode;
};

export function Heading({ children }: Props) {
  return (
    <h1
      style={{
        fontSize: "48px",
        fontWeight: 700,
        marginBottom: 24,
      }}
    >
      {children}
    </h1>
  );
}