import { Download, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CollabVoucher } from "@/lib/vouchers";
import { cn } from "@/lib/utils";

type Props = {
  voucher: CollabVoucher;
  className?: string;
  showActions?: boolean;
};

const LOGO_SRC = "/app-icon.png";

/** Brand palette from NepCollab mark — navy + signal red */
const INK = "#0B1F4D";
const INK_DEEP = "#061433";
const SIGNAL = "#E31C23";
const SIGNAL_SOFT = "#FF4D4D";
const SNOW = "#F7F9FC";
const GOLD = "#E8C547";

/**
 * Premium NepCollab collaboration voucher — navy/red brand, story-ready, downloadable.
 * Non-cash reward (voucher / PR package). Not a bank instrument.
 */
export function NepCollabVoucher({ voucher, className, showActions = true }: Props) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const amountText =
    voucher.reward_label?.trim() ||
    (voucher.amount_npr != null && voucher.amount_npr > 0
      ? `Worth NPR ${Number(voucher.amount_npr).toLocaleString("en-NP")}`
      : "Collaboration reward");

  const statusLabel =
    voucher.status === "issued"
      ? "Ready to redeem"
      : voucher.status === "redeemed"
        ? "Redeemed"
        : voucher.status === "pending_admin"
          ? "Pending release"
          : voucher.status === "void"
            ? "Voided"
            : voucher.status;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const loadLogo = (): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = LOGO_SRC;
    });

  const downloadPng = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const scale = 3;
      const w = 380 * scale;
      const h = 600 * scale;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      const cx = w / 2;

      // Deep navy base
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, INK_DEEP);
      bg.addColorStop(0.45, INK);
      bg.addColorStop(1, "#0A1838");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Signal red glow top-right
      const glow = ctx.createRadialGradient(w * 0.9, h * 0.08, 0, w * 0.9, h * 0.08, w * 0.55);
      glow.addColorStop(0, "rgba(227, 28, 35, 0.35)");
      glow.addColorStop(1, "rgba(227, 28, 35, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Soft snow glow bottom
      const glow2 = ctx.createRadialGradient(cx, h * 1.05, 0, cx, h * 1.05, w * 0.7);
      glow2.addColorStop(0, "rgba(247, 249, 252, 0.08)");
      glow2.addColorStop(1, "rgba(247, 249, 252, 0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, w, h);

      // Outer frame — gold thin + red accent corners
      const pad = 16 * scale;
      ctx.strokeStyle = "rgba(232, 197, 71, 0.5)";
      ctx.lineWidth = 2 * scale;
      roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, 28 * scale);
      ctx.stroke();

      ctx.strokeStyle = "rgba(227, 28, 35, 0.45)";
      ctx.lineWidth = 1.2 * scale;
      roundRect(ctx, pad + 8 * scale, pad + 8 * scale, w - pad * 2 - 16 * scale, h - pad * 2 - 16 * scale, 22 * scale);
      ctx.stroke();

      // Mountain silhouette (brand)
      ctx.beginPath();
      const my = h * 0.78;
      ctx.moveTo(0, h);
      ctx.lineTo(0, my + 40 * scale);
      ctx.lineTo(w * 0.18, my - 20 * scale);
      ctx.lineTo(w * 0.32, my + 18 * scale);
      ctx.lineTo(w * 0.48, my - 55 * scale);
      ctx.lineTo(w * 0.62, my + 10 * scale);
      ctx.lineTo(w * 0.78, my - 30 * scale);
      ctx.lineTo(w, my + 25 * scale);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = "rgba(247, 249, 252, 0.07)";
      ctx.fill();

      let y = 52 * scale;

      // Logo
      const logo = await loadLogo();
      if (logo) {
        const ls = 52 * scale;
        ctx.drawImage(logo, cx - ls / 2, y, ls, ls);
        y += ls + 18 * scale;
      } else {
        ctx.fillStyle = SIGNAL;
        ctx.font = `700 ${22 * scale}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("NepCollab", cx, y + 20 * scale);
        y += 42 * scale;
      }

      ctx.fillStyle = "rgba(247, 249, 252, 0.7)";
      ctx.font = `600 ${11 * scale}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.letterSpacing = "0.18em";
      ctx.fillText("COLLABORATION VOUCHER", cx, y);
      y += 28 * scale;

      // Reward
      ctx.fillStyle = SNOW;
      ctx.font = `700 ${26 * scale}px system-ui, sans-serif`;
      ctx.fillText(truncate(amountText, 28), cx, y);
      y += 22 * scale;

      ctx.fillStyle = "rgba(247, 249, 252, 0.55)";
      ctx.font = `500 ${12 * scale}px system-ui, sans-serif`;
      ctx.fillText(statusLabel, cx, y);
      y += 36 * scale;

      // Divider
      ctx.strokeStyle = "rgba(247, 249, 252, 0.12)";
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(w * 0.18, y);
      ctx.lineTo(w * 0.82, y);
      ctx.stroke();
      y += 32 * scale;

      // Brand × Creator
      ctx.fillStyle = "rgba(247, 249, 252, 0.45)";
      ctx.font = `600 ${10 * scale}px system-ui, sans-serif`;
      ctx.fillText("BRAND", cx, y);
      y += 18 * scale;
      ctx.fillStyle = SNOW;
      ctx.font = `700 ${16 * scale}px system-ui, sans-serif`;
      ctx.fillText(truncate(voucher.brand_name || "Brand", 30), cx, y);
      y += 28 * scale;

      ctx.fillStyle = SIGNAL;
      ctx.font = `700 ${14 * scale}px system-ui, sans-serif`;
      ctx.fillText("×", cx, y);
      y += 26 * scale;

      ctx.fillStyle = "rgba(247, 249, 252, 0.45)";
      ctx.font = `600 ${10 * scale}px system-ui, sans-serif`;
      ctx.fillText("CREATOR", cx, y);
      y += 18 * scale;
      ctx.fillStyle = SNOW;
      ctx.font = `700 ${16 * scale}px system-ui, sans-serif`;
      ctx.fillText(truncate(voucher.creator_name || "Creator", 30), cx, y);
      y += 28 * scale;

      if (voucher.campaign_title) {
        ctx.fillStyle = "rgba(247, 249, 252, 0.4)";
        ctx.font = `500 ${11 * scale}px system-ui, sans-serif`;
        ctx.fillText(truncate(voucher.campaign_title, 36), cx, y);
        y += 26 * scale;
      }

      y += 12 * scale;

      // Code pill
      const pillW = 220 * scale;
      const pillH = 48 * scale;
      const pillX = cx - pillW / 2;
      const pillY = y;
      ctx.fillStyle = "rgba(247, 249, 252, 0.1)";
      roundRect(ctx, pillX, pillY, pillW, pillH, 14 * scale);
      ctx.fill();
      ctx.strokeStyle = "rgba(227, 28, 35, 0.55)";
      ctx.lineWidth = 1.5 * scale;
      roundRect(ctx, pillX, pillY, pillW, pillH, 14 * scale);
      ctx.stroke();

      ctx.fillStyle = SNOW;
      ctx.font = `700 ${18 * scale}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText(voucher.code, cx, pillY + 30 * scale);

      // Footer
      ctx.fillStyle = "rgba(247, 249, 252, 0.35)";
      ctx.font = `500 ${10 * scale}px system-ui, sans-serif`;
      ctx.fillText("Nepal · Brand × creator collaborations", cx, h - 36 * scale);
      ctx.fillText("Non-cash reward · Not legal tender", cx, h - 22 * scale);

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `nepcollab-voucher-${voucher.code}.png`;
      a.click();
      toast.success("Premium voucher downloaded");
    } catch {
      toast.error("Could not download voucher");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const text = [
      "NepCollab Collaboration Voucher",
      `${voucher.brand_name || "Brand"} × ${voucher.creator_name || "Creator"}`,
      amountText,
      `Code: ${voucher.code}`,
      "nepcollab.vercel.app",
    ].join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "NepCollab Voucher", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Share text copied");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className={cn("w-full max-w-sm", className)}>
      <article
        className="relative overflow-hidden rounded-[1.75rem] border border-white/10 shadow-[0_20px_50px_-20px_rgba(11,31,77,0.65)]"
        style={{
          background: `linear-gradient(165deg, ${INK_DEEP} 0%, ${INK} 45%, #0A1838 100%)`,
        }}
      >
        {/* Signal glow */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-40 blur-3xl"
          style={{ background: SIGNAL }}
        />
        {/* Mountain hint */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-[0.12]"
          style={{
            background:
              "linear-gradient(to top, rgba(247,249,252,0.25), transparent), polygon(0 100%, 18% 55%, 32% 75%, 48% 30%, 62% 70%, 78% 45%, 100% 80%, 100% 100%)",
          }}
        />

        <div className="relative px-6 pb-6 pt-7 text-center text-white">
          <img
            src={LOGO_SRC}
            alt="NepCollab"
            className="mx-auto size-12 object-contain drop-shadow-md"
          />
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
            Collaboration voucher
          </p>
          <p className="mt-2 text-xl font-bold tracking-tight">{amountText}</p>
          <p className="mt-1 text-[12px] font-medium text-white/55">{statusLabel}</p>

          <div className="mx-auto my-5 h-px w-2/3 bg-white/10" />

          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Brand</p>
          <p className="mt-1 text-[15px] font-bold">{voucher.brand_name || "Brand"}</p>
          <p className="my-1.5 text-sm font-bold" style={{ color: SIGNAL_SOFT }}>
            ×
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Creator</p>
          <p className="mt-1 text-[15px] font-bold">{voucher.creator_name || "Creator"}</p>
          {voucher.campaign_title ? (
            <p className="mt-2 truncate text-[12px] text-white/45">{voucher.campaign_title}</p>
          ) : null}

          <div
            className="mt-5 inline-flex min-w-[12rem] items-center justify-center rounded-2xl border px-4 py-2.5 font-mono text-[15px] font-bold tracking-wide"
            style={{ borderColor: "rgba(227,28,35,0.55)", background: "rgba(247,249,252,0.08)" }}
          >
            {voucher.code}
          </div>

          <p className="mt-5 text-[10px] text-white/35">
            Nepal · Non-cash reward · Not legal tender
          </p>
        </div>
      </article>

      {showActions ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => void copyCode()}
            className="tap flex h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-card text-[12px] font-semibold"
          >
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => void share()}
            className="tap flex h-11 items-center justify-center gap-1.5 rounded-full border border-border bg-card text-[12px] font-semibold"
          >
            <Share2 className="size-3.5" /> Share
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void downloadPng()}
            className="tap flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink text-[12px] font-semibold text-ink-foreground"
          >
            <Download className="size-3.5" /> {busy ? "…" : "PNG"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function truncate(s: string, n: number) {
  const t = String(s || "");
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
