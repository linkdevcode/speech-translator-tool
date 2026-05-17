interface LoadingDotsProps {
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_CLASS = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
} as const;

export function LoadingDots({
  label,
  size = "md",
  className = "",
}: LoadingDotsProps) {
  const dotClass = SIZE_CLASS[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="inline-flex items-center gap-1" aria-hidden>
        <span
          className={`${dotClass} animate-loading-dot rounded-full bg-current opacity-70`}
        />
        <span
          className={`${dotClass} animate-loading-dot rounded-full bg-current opacity-70 [animation-delay:160ms]`}
        />
        <span
          className={`${dotClass} animate-loading-dot rounded-full bg-current opacity-70 [animation-delay:320ms]`}
        />
      </span>
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}
