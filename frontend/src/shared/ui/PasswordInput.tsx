// FILE: PasswordInput.tsx
// Purpose: Shared password field with an accessible show/hide toggle.
// Layer: UI component
// Depends on: React input props, shared Input styling.

import { useState, type InputHTMLAttributes } from "react";

import { Input } from "./Input";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function VisibilityIcon({ isVisible }: { isVisible: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {isVisible ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c5.5 0 9 5.2 9 8a8.8 8.8 0 0 1-2 3.9" />
          <path d="M6.6 6.6C4.4 8 3 10.4 3 12c0 2.8 3.5 8 9 8a10.7 10.7 0 0 0 4.1-.8" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function PasswordInput({ className = "", disabled, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        className={`pr-11 ${className}`}
        disabled={disabled}
        type={isVisible ? "text" : "password"}
        {...props}
      />
      <button
        aria-label={isVisible ? "Nascondi password" : "Mostra password"}
        className="absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/30 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        onClick={() => setIsVisible((current) => !current)}
        type="button"
      >
        <VisibilityIcon isVisible={isVisible} />
      </button>
    </div>
  );
}
