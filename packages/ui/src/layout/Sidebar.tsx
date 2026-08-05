import React from "react";

type SidebarProps = {
  children: React.ReactNode;
};

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside
      style={{
        width: 260,
        minHeight: "100vh",
        background: "#111827",
        padding: "24px",
      }}
    >
      {children}
    </aside>
  );
}