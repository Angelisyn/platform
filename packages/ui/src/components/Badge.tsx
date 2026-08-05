import React from "react";

type BadgeProps = {
  children: React.ReactNode;
};

export function Badge({ children }: BadgeProps) {
  return (
    <span
      style={{
        padding: "4px 10px",
        background: "#3B82F6",
        color: "#fff",
        borderRadius: "999px",
      }}
    >
      {children}
    </span>
  );
}