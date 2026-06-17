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
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-emerald-300/15 font-bold text-emerald-100 ${sizes[size]}`}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials || "U"}
    </div>
  );
}
