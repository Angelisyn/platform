import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input(props: InputProps) {
  return (
    <input
      {...props}
      style={{
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #334155",
        background: "#1E293B",
        color: "#fff",
        width: "100%",
      }}
    />
  );
}