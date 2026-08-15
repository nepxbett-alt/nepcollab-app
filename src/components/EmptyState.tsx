import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  actionTo,
  onAction,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      {actionLabel ? (
        <div className="mt-6">
          {actionTo ? (
            <Button asChild>
              <Link {...({ to: actionTo } as unknown as { to: "/" })}>
                {actionLabel}
              </Link>
            </Button>
          ) : (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
