import { useState } from "react";

type AvatarProps = {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-20 w-20 text-xl",
};

export function Avatar({ src, name = "User", size = "md" }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const visibleSrc = src && src !== failedSrc ? src : null;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-200/20 bg-gradient-to-br from-emerald-300/25 to-cyan-300/10 font-bold text-emerald-50 shadow-md shadow-black/25 ${sizes[size]}`}
    >
      {visibleSrc ? (
        <img
          src={visibleSrc}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(visibleSrc)}
        />
      ) : (
        initials || "U"
      )}
    </div>
  );
}
