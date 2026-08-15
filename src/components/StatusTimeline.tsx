import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineState = "done" | "current" | "todo";

export interface TimelineStep {
  label: string;
  description: string;
  at?: string;
  state: TimelineState;
}

export function StatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative space-y-0">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.label} className="relative flex gap-3 pb-5 last:pb-0">
            {!last ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px",
                  step.state === "done" ? "bg-success/50" : "bg-border",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border",
                step.state === "done" &&
                  "border-success/30 bg-success text-success-foreground",
                step.state === "current" &&
                  "border-signal/30 bg-signal text-signal-foreground",
                step.state === "todo" &&
                  "border-border bg-secondary text-muted-foreground",
              )}
            >
              {step.state === "done" ? (
                <Check className="size-3.5" />
              ) : step.state === "current" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Circle className="size-2.5" />
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p
                  className={cn(
                    "text-[14px] font-semibold",
                    step.state === "todo" && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                {step.at ? (
                  <span className="text-[11.5px] text-muted-foreground">
                    {step.at}
                  </span>
                ) : null}
              </div>
              <p className="text-[12.5px] text-muted-foreground">
                {step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
