import React from "react";

type AlertProps = {
  children: React.ReactNode;
};

export function Alert({ children }: AlertProps) {
  return (
    <div
      style={{
        background: "#F59E0B",
        padding: "16px",
        borderRadius: "8px",
        color: "#fff",
      }}
    >
      {children}
    </div>
  );
}