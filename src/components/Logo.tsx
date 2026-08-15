import { cn } from "@/lib/utils";

export const logoUrl = "/app-icon.png";

export function Logo({
  className,
  withWordmark = true,
  size = 28,
}: {
  className?: string;
  withWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <img
        src="/app-icon.png"
        alt="NepCollab logo"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 object-contain"
      />
      {withWordmark ? (
        <span className="font-display text-[15px] font-bold tracking-tight">
          NepCollab
        </span>
      ) : null}
    </span>
  );
}
