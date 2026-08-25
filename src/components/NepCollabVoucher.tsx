import { Check, Copy, Download, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CollabVoucher } from "@/lib/vouchers";
import { cn } from "@/lib/utils";

type Props = {
  voucher: CollabVoucher;
  className?: string;
  showActions?: boolean;
};

const LOGO_SRC = "/icon-512.png";

/**
 * Premium NepCollab-branded collaboration voucher — story-ready, logo-themed.
 * Brand colors: deep ink navy + warm signal coral (matches app design system).
 */
export function NepCollabVoucher({ voucher, className, showActions = true }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const amountText =
    voucher.amount_npr != null && voucher.amount_npr > 0
      ? `NPR ${Number(voucher.amount_npr).toLocaleString("en-NP")}`
      : voucher.reward_label || "Collaboration reward";

  const statusLabel =
    voucher.status === "issued"
      ? "Ready to redeem"
      : voucher.status === "redeemed"
        ? "Redeemed"
        : voucher.status === "pending_admin"
          ? "Pending admin release"
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
      const w = 360 * scale;
      const h = 560 * scale;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      // Background — deep ink with subtle radial glow
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#1B1640");
      bg.addColorStop(0.4, "#241E52");
      bg.addColorStop(0.75, "#2A1F4A");
      bg.addColorStop(1, "#1A1228");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Soft signal glow top-right
      const glow = ctx.createRadialGradient(w * 0.85, h * 0.12, 0, w * 0.85, h * 0.12, w * 0.55);
      glow.addColorStop(0, "rgba(232, 90, 70, 0.28)");
      glow.addColorStop(1, "rgba(232, 90, 70, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Soft gold/violet glow bottom-left
      const glow2 = ctx.createRadialGradient(w * 0.1, h * 0.92, 0, w * 0.1, h * 0.92, w * 0.5);
      glow2.addColorStop(0, "rgba(232, 197, 71, 0.12)");
      glow2.addColorStop(1, "rgba(232, 197, 71, 0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, w, h);

      // Outer gold frame
      const pad = 18 * scale;
      ctx.strokeStyle = "rgba(232, 197, 71, 0.55)";
      ctx.lineWidth = 2.5 * scale;
      roundRectPath(ctx, pad, pad, w - pad * 2, h - pad * 2, 28 * scale);
      ctx.stroke();

      // Inner thin frame
      const pad2 = 28 * scale;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1 * scale;
      roundRectPath(ctx, pad2, pad2, w - pad2 * 2, h - pad2 * 2, 22 * scale);
      ctx.stroke();

      const cx = w / 2;
      let y = 56 * scale;

      // Logo
      const logo = await loadLogo();
      const logoSize = 56 * scale;
      if (logo) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logo, cx - logoSize / 2, y, logoSize, logoSize);
        ctx.restore();
        // ring
        ctx.strokeStyle = "rgba(232, 197, 71, 0.7)";
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(cx, y + logoSize / 2, logoSize / 2 + 2 * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      y += logoSize + 22 * scale;

      ctx.textAlign = "center";
      ctx.fillStyle = "#E8C547";
      ctx.font = `600 ${11 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillText("NEPCOLLAB", cx, y);
      y += 28 * scale;

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${26 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillText("Collaboration", cx, y);
      y += 32 * scale;
      ctx.fillText("Voucher", cx, y);
      y += 40 * scale;

      // Divider with diamond
      ctx.strokeStyle = "rgba(232, 197, 71, 0.45)";
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(cx - 70 * scale, y);
      ctx.lineTo(cx - 10 * scale, y);
      ctx.moveTo(cx + 10 * scale, y);
      ctx.lineTo(cx + 70 * scale, y);
      ctx.stroke();
      ctx.fillStyle = "#E8C547";
      ctx.beginPath();
      ctx.moveTo(cx, y - 5 * scale);
      ctx.lineTo(cx + 5 * scale, y);
      ctx.lineTo(cx, y + 5 * scale);
      ctx.lineTo(cx - 5 * scale, y);
      ctx.closePath();
      ctx.fill();
      y += 32 * scale;

      // Brand
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `600 ${10 * scale}px system-ui, sans-serif`;
      ctx.fillText("BRAND", cx, y);
      y += 22 * scale;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${18 * scale}px system-ui, sans-serif`;
      ctx.fillText(truncate(voucher.brand_name || "Brand", 28), cx, y);
      y += 36 * scale;

      // Creator
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `600 ${10 * scale}px system-ui, sans-serif`;
      ctx.fillText("CREATOR", cx, y);
      y += 22 * scale;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${18 * scale}px system-ui, sans-serif`;
      ctx.fillText(truncate(voucher.creator_name || "Creator", 28), cx, y);
      y += 34 * scale;

      if (voucher.campaign_title) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = `400 ${12 * scale}px system-ui, sans-serif`;
        ctx.fillText(truncate(voucher.campaign_title, 36), cx, y);
        y += 30 * scale;
      }

      // Code pill
      const pillW = 220 * scale;
      const pillH = 44 * scale;
      const pillX = cx - pillW / 2;
      const pillY = y;
      ctx.fillStyle = "rgba(232, 90, 70, 0.18)";
      roundRectPath(ctx, pillX, pillY, pillW, pillH, 14 * scale);
      ctx.fill();
      ctx.strokeStyle = "rgba(232, 90, 70, 0.85)";
      ctx.lineWidth = 2 * scale;
      roundRectPath(ctx, pillX, pillY, pillW, pillH, 14 * scale);
      ctx.stroke();
      ctx.fillStyle = "#FF8A75";
      ctx.font = `700 ${17 * scale}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText(voucher.code, cx, pillY + 29 * scale);
      y += pillH + 28 * scale;

      // Amount
      ctx.fillStyle = "#E8C547";
      ctx.font = `700 ${22 * scale}px system-ui, sans-serif`;
      ctx.fillText(amountText, cx, y);
      y += 36 * scale;

      // Status chip
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      const chipW = 140 * scale;
      const chipH = 26 * scale;
      roundRectPath(ctx, cx - chipW / 2, y, chipW, chipH, 13 * scale);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = `600 ${11 * scale}px system-ui, sans-serif`;
      ctx.fillText(statusLabel, cx, y + 17 * scale);

      // Footer
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = `400 ${10 * scale}px system-ui, sans-serif`;
      ctx.fillText("Made with NepCollab  ·  Nepal creator marketplace", cx, h - 36 * scale);

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `nepcollab-voucher-${voucher.code}.png`;
      a.click();
      toast.success("Premium voucher downloaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const text = `Completed on NepCollab ✨\n${voucher.brand_name} × ${voucher.creator_name}\n${amountText}\nCode: ${voucher.code}\nhttps://nepcollab.vercel.app`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "NepCollab Voucher", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Share text copied — paste to your story");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-[28px] shadow-2xl"
        style={{
          aspectRatio: "9 / 14",
          maxWidth: 360,
          background:
            "radial-gradient(ellipse 80% 50% at 90% 8%, rgba(232,90,70,0.28), transparent 55%), radial-gradient(ellipse 70% 45% at 10% 95%, rgba(232,197,71,0.12), transparent 50%), linear-gradient(155deg, #1B1640 0%, #241E52 40%, #2A1F4A 70%, #1A1228 100%)",
        }}
      >
        {/* Frames */}
        <div className="pointer-events-none absolute inset-[14px] rounded-[22px] border border-[#E8C547]/50" />
        <div className="pointer-events-none absolute inset-[22px] rounded-[18px] border border-white/10" />

        <div className="relative flex h-full flex-col items-center px-6 pb-6 pt-7 text-center text-white">
          {/* Logo */}
          <div className="relative">
            <img
              src={LOGO_SRC}
              alt="NepCollab"
              className="size-14 rounded-full object-cover shadow-lg ring-2 ring-[#E8C547]/70"
              width={56}
              height={56}
            />
          </div>

          <p className="mt-3 text-[10px] font-semibold tracking-[0.32em] text-[#E8C547]">
            NEPCOLLAB
          </p>
          <h3 className="mt-1.5 text-[24px] font-bold leading-[1.15] tracking-tight">
            Collaboration
            <br />
            Voucher
          </h3>

          {/* Diamond divider */}
          <div className="mt-5 flex items-center gap-2">
            <span className="h-px w-14 bg-[#E8C547]/45" />
            <span className="size-2 rotate-45 bg-[#E8C547]" />
            <span className="h-px w-14 bg-[#E8C547]/45" />
          </div>

          <div className="mt-5 w-full space-y-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/50">
                Brand
              </p>
              <p className="mt-0.5 text-[16px] font-bold leading-snug">
                {voucher.brand_name || "Brand"}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/50">
                Creator
              </p>
              <p className="mt-0.5 text-[16px] font-bold leading-snug">
                {voucher.creator_name || "Creator"}
              </p>
            </div>
          </div>

          {voucher.campaign_title ? (
            <p className="mt-4 line-clamp-2 px-1 text-[11.5px] leading-snug text-white/55">
              {voucher.campaign_title}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void copyCode()}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[#E85A46]/80 bg-[#E85A46]/15 px-4 py-2.5 font-mono text-[14px] font-bold tracking-wider text-[#FF8A75] transition hover:bg-[#E85A46]/25"
          >
            {voucher.code}
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5 opacity-70" />}
          </button>

          <p className="mt-4 text-[19px] font-bold tracking-tight text-[#E8C547]">{amountText}</p>

          <div className="mt-auto w-full pt-5">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-wide text-white/75">
              {statusLabel}
            </span>
            <p className="mt-3 text-[9.5px] tracking-wide text-white/35">
              Made with NepCollab · Nepal creator marketplace
            </p>
          </div>
        </div>
      </div>

      {showActions ? (
        <div className="flex flex-wrap gap-2" style={{ maxWidth: 360 }}>
          <Button
            type="button"
            className="h-11 flex-1 rounded-full bg-signal text-signal-foreground hover:bg-signal/90"
            disabled={busy}
            onClick={() => void downloadPng()}
          >
            <Download className="size-4" /> {busy ? "Preparing…" : "Download"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-full"
            onClick={() => void share()}
          >
            <Share2 className="size-4" /> Share story
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
