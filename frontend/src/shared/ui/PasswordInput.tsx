// File: PasswordInput.tsx
// Scopo: Campo password condiviso con toggle accessibile mostra/nascondi.
// Livello: Componente UI
// Dipende da: props input React, stile Input condiviso.

import { useState, type InputHTMLAttributes } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

import { Input } from "./Input";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function visibilityState(isVisible: boolean) {
  return {
    Icon: isVisible ? FiEyeOff : FiEye,
    ariaLabel: isVisible ? "Nascondi password" : "Mostra password",
    inputType: isVisible ? "text" : "password",
  } as const;
}

export function PasswordInput({ className = "", disabled, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { Icon, ariaLabel, inputType } = visibilityState(isVisible);

  return (
    <div className="relative">
      <Input
        className={`pr-11 ${className}`}
        disabled={disabled}
        type={inputType}
        {...props}
      />
      <button
        aria-label={ariaLabel}
        className="absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded text-zinc-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-lime-300/30 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={disabled}
        onClick={() => setIsVisible((current) => !current)}
        type="button"
      >
        <Icon aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
