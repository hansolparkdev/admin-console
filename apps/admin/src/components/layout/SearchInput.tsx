"use client";

import { useState } from "react";
import { Search } from "lucide-react";

export function SearchInput() {
  const [value, setValue] = useState("");

  return (
    <div
      style={{
        position: "relative",
        width: "384px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Search
        size={18}
        style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--search-input-icon)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      <input
        type="text"
        placeholder="Search data points, users, or logs..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          height: "40px",
          paddingLeft: "40px",
          paddingRight: "16px",
          backgroundColor: "var(--search-input-bg)",
          borderRadius: "9999px",
          fontFamily: "var(--font-sans), Inter, sans-serif",
          fontSize: "14px",
          color: "var(--on-surface)",
          outline: "none",
        }}
        className="focus-visible:ring-2 focus-visible:ring-[var(--search-input-ring)]"
      />
    </div>
  );
}
