import { Download, Share2 } from "lucide-react";
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

/**
 * Premium shareable NepCollab voucher card — designed for stories & download.
 */
export function NepCollabVoucher({ voucher, className, showActions = true }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const amountText =
    voucher.amount_npr != null && voucher.amount_npr > 0
      ? `${voucher.currency} ${Number(voucher.amount_npr).toLocaleString("en-NP")}`
      : voucher.reward_label || "Collaboration reward";

  const downloadPng = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const node = cardRef.current;
      const rect = node.getBoundingClientRect();
      const scale = 2;
      const w = Math.round(rect.width * scale);
      const h = Math.round(rect.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      // Paint brand gradient background
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#0B3D2E");
      grad.addColorStop(0.45, "#145C43");
      grad.addColorStop(1, "#1A1A1A");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Decorative arcs
      ctx.strokeStyle = "rgba(232, 197, 71, 0.25)";
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(w * 0.85, h * 0.15, 80 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * 0.1, h * 0.9, 100 * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Gold frame
      ctx.strokeStyle = "#E8C547";
      ctx.lineWidth = 4 * scale;
      const pad = 16 * scale;
      ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

      const cx = w / 2;
      let y = 48 * scale;
      ctx.textAlign = "center";
      ctx.fillStyle = "#E8C547";
      ctx.font = `600 ${12 * scale}px system-ui, sans-serif`;
      ctx.fillText("NEPCOLLAB", cx, y);
      y += 28 * scale;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${22 * scale}px system-ui, sans-serif`;
      ctx.fillText("Collaboration Voucher", cx, y);
      y += 36 * scale;

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = `500 ${11 * scale}px system-ui, sans-serif`;
      ctx.fillText("BRAND", cx, y);
      y += 20 * scale;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${16 * scale}px system-ui, sans-serif`;
      ctx.fillText(voucher.brand_name || "Brand", cx, y);
      y += 28 * scale;

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = `500 ${11 * scale}px system-ui, sans-serif`;
      ctx.fillText("CREATOR", cx, y);
      y += 20 * scale;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${16 * scale}px system-ui, sans-serif`;
      ctx.fillText(voucher.creator_name || "Creator", cx, y);
      y += 32 * scale;

      if (voucher.campaign_title) {
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.font = `400 ${11 * scale}px system-ui, sans-serif`;
        const title =
          voucher.campaign_title.length > 42
            ? voucher.campaign_title.slice(0, 40) + "…"
            : voucher.campaign_title;
        ctx.fillText(title, cx, y);
        y += 28 * scale;
      }

      // Code pill
      ctx.fillStyle = "rgba(232, 197, 71, 0.15)";
      const pillW = 200 * scale;
      const pillH = 40 * scale;
      roundRect(ctx, cx - pillW / 2, y, pillW, pillH, 12 * scale);
      ctx.fill();
      ctx.strokeStyle = "#E8C547";
      ctx.lineWidth = 2 * scale;
      roundRect(ctx, cx - pillW / 2, y, pillW, pillH, 12 * scale);
      ctx.stroke();
      ctx.fillStyle = "#E8C547";
      ctx.font = `700 ${16 * scale}px ui-monospace, monospace`;
      ctx.fillText(voucher.code, cx, y + 26 * scale);
      y += 56 * scale;

      ctx.fillStyle = "#E8C547";
      ctx.font = `700 ${18 * scale}px system-ui, sans-serif`;
      ctx.fillText(amountText, cx, y);
      y += 28 * scale;

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `400 ${10 * scale}px system-ui, sans-serif`;
      ctx.fillText("Powered by NepCollab · Nepal's creator marketplace", cx, y);

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `nepcollab-voucher-${voucher.code}.png`;
      a.click();
      toast.success("Voucher image downloaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const text = `I completed a collaboration on NepCollab!\n${voucher.brand_name} × ${voucher.creator_name}\nVoucher: ${voucher.code}\n${amountText}\nhttps://nepcollab.vercel.app`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "NepCollab Voucher",
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Share text copied — paste to your story");
      }
    } catch {
      /* user cancelled */
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      toast.success("Code copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-[28px] border border-[#E8C547]/40 bg-gradient-to-br from-[#0B3D2E] via-[#145C43] to-[#121212] p-6 text-white shadow-xl"
        style={{ aspectRatio: "9 / 14", maxWidth: 360 }}
      >
        {/* Decorative rings */}
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full border border-[#E8C547]/20" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 size-44 rounded-full border border-[#E8C547]/15" />
        <div className="pointer-events-none absolute inset-3 rounded-[22px] border border-[#E8C547]/35" />

        <div className="relative flex h-full flex-col items-center text-center">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-[#E8C547]">NEPCOLLAB</p>
          <h3 className="mt-2 text-[22px] font-bold leading-tight tracking-tight">
            Collaboration
            <br />
            Voucher
          </h3>

          <div className="mt-8 w-full space-y-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                Brand
              </p>
              <p className="mt-1 text-[17px] font-bold">{voucher.brand_name || "Brand"}</p>
            </div>
            <div className="mx-auto h-px w-16 bg-[#E8C547]/40" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                Creator
              </p>
              <p className="mt-1 text-[17px] font-bold">{voucher.creator_name || "Creator"}</p>
            </div>
          </div>

          {voucher.campaign_title ? (
            <p className="mt-6 line-clamp-2 px-2 text-[12px] text-white/65">
              {voucher.campaign_title}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void copyCode()}
            className="mt-6 rounded-2xl border border-[#E8C547]/50 bg-[#E8C547]/10 px-5 py-2.5 font-mono text-[15px] font-bold tracking-wider text-[#E8C547]"
          >
            {voucher.code}
          </button>

          <p className="mt-5 text-[18px] font-bold text-[#E8C547]">{amountText}</p>

          <div className="mt-auto w-full pt-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
              {voucher.status === "issued"
                ? "Ready to redeem"
                : voucher.status === "redeemed"
                  ? "Redeemed"
                  : voucher.status === "pending_admin"
                    ? "Pending admin release"
                    : voucher.status}
            </p>
            <p className="mt-2 text-[10px] text-white/40">
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
            <Download className="size-4" /> Download
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

function roundRect(
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
