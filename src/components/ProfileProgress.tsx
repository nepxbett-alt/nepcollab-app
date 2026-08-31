import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

/**
 * Profile completion CTA.
 * - Off /profile → go to /profile#complete
 * - On /profile → scroll to #complete (edit + socials)
 */
export function ProfileProgress({
  percent,
  hint,
}: {
  percent: number;
  hint: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onProfile = pathname === "/profile" || pathname.startsWith("/profile/");

  const scrollToComplete = () => {
    const el = document.getElementById("complete");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Focus first editable field if present
      window.setTimeout(() => {
        const input = el.querySelector<HTMLInputElement>("input, textarea, button");
        input?.focus();
      }, 350);
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-gradient-to-br from-ink to-ink/85 p-4 text-ink-foreground">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-signal/20">
          <Sparkles className="size-4 text-signal" />
        </span>
        <p className="text-[14px] font-semibold">Your profile is {percent}% complete</p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-ink-foreground/15"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion"
      >
        <div
          className="h-full rounded-full bg-signal transition-[width] duration-700"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <p className="mt-2.5 text-[12.5px] text-ink-foreground/75">{hint}</p>
      {onProfile ? (
        <button
          type="button"
          onClick={scrollToComplete}
          className="tap mt-3 inline-flex h-9 items-center rounded-full bg-signal px-4 text-[13px] font-semibold text-signal-foreground hover:bg-signal/90"
        >
          Complete profile
        </button>
      ) : (
        <Link
          to="/profile"
          hash="complete"
          className="tap mt-3 inline-flex h-9 items-center rounded-full bg-signal px-4 text-[13px] font-semibold text-signal-foreground hover:bg-signal/90"
        >
          Complete profile
        </Link>
      )}
    </section>
  );
}
