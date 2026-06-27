// FILE: PasswordInput.tsx
// Purpose: Shared password field with an accessible show/hide toggle.
// Layer: UI component
// Depends on: React input props, shared Input styling.

import { useState, type InputHTMLAttributes } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

import { Input } from "./Input";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ className = "", disabled, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? FiEyeOff : FiEye;

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
        <Icon aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
