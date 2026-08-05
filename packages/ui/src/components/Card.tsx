import React from "react";

type CardProps = {
  children: React.ReactNode;
};

export function Card({ children }: CardProps) {
  return (
    <div
      style={{
        padding: "24px",
        borderRadius: "12px",
        background: "#1E293B",
      }}
    >
      {children}
    </div>
  );
}