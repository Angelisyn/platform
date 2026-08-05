import React from "react";

type Props = {
  children: React.ReactNode;
};

export function Container({ children }: Props) {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 24px",
      }}
    >
      {children}
    </div>
  );
}