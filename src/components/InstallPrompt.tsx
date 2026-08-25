import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "nepcollab.pwa.dismissedAt";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  const mq = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(mq || iosStandalone);
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return iOS;
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const t = Number(raw);
    if (!Number.isFinite(t)) return false;
    return Date.now() - t < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [iosGuide, setIosGuide] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const ios = typeof window !== "undefined" ? isIos() : false;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone() || wasDismissedRecently()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // iOS: no beforeinstallprompt — show after short delay when usable
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      timer = setTimeout(() => {
        if (!isStandalone() && !wasDismissedRecently()) setVisible(true);
      }, 1200);
    }

    // Register service worker (required for installability on Android)
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        /* non-fatal */
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    markDismissed();
    setVisible(false);
    setIosGuide(false);
  }, []);

  const installAndroid = useCallback(async () => {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      setVisible(false);
      if (choice.outcome === "accepted") {
        try {
          localStorage.setItem(DISMISS_KEY, String(Date.now() + 365 * 24 * 60 * 60 * 1000));
        } catch {
          /* ignore */
        }
      } else {
        markDismissed();
      }
    } catch {
      markDismissed();
      setVisible(false);
    } finally {
      setBusy(false);
    }
  }, [deferred]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[80] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
      role="dialog"
      aria-label="Install NepCollab"
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl",
          "animate-in slide-in-from-bottom-4 fade-in duration-300",
        )}
      >
        {iosGuide ? (
          <div className="p-5">
            <p className="text-sm font-bold tracking-tight">Add to Home Screen</p>
            <ol className="mt-3 space-y-2 text-[13px] text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">1.</span> Tap <strong>Share</strong> in Safari
              </li>
              <li>
                <span className="font-semibold text-foreground">2.</span> Tap <strong>Add to Home Screen</strong>
              </li>
              <li>
                <span className="font-semibold text-foreground">3.</span> Tap <strong>Add</strong>
              </li>
            </ol>
            <Button className="mt-4 h-11 w-full rounded-full" onClick={dismiss}>
              Done
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 p-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ink">
              <Logo size={28} withWordmark={false} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold tracking-tight">Install NepCollab</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                {ios
                  ? "Add NepCollab to your Home Screen for a faster app-like experience."
                  : "Get faster access to campaigns, messages and collaborations."}
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                {ios ? (
                  <Button
                    className="h-11 w-full rounded-full bg-signal text-signal-foreground hover:bg-signal/90"
                    onClick={() => setIosGuide(true)}
                  >
                    How to Install
                  </Button>
                ) : (
                  <Button
                    className="h-11 w-full rounded-full bg-signal text-signal-foreground hover:bg-signal/90"
                    disabled={!deferred || busy}
                    onClick={() => void installAndroid()}
                  >
                    {busy ? "Opening…" : "Install App"}
                  </Button>
                )}
                <button
                  type="button"
                  className="h-9 text-[13px] font-medium text-muted-foreground hover:text-foreground"
                  onClick={dismiss}
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
