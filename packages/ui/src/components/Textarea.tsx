import React from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea(props: TextareaProps) {
  return (
    <textarea
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