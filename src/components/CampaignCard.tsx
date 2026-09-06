import { Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, Gift, MapPin, Video } from "lucide-react";
import type { Campaign } from "@/data/types";
import { daysLeft, getBrand } from "@/lib/lookup";
import { cn } from "@/lib/utils";

/** Compact deal card — brand, free product, content, claim. */
export function CampaignCard({
  campaign,
  saved,
  onToggleSave,
  match: _match,
  className,
}: {
  campaign: Campaign;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
  match?: number;
  className?: string;
}) {
  const brand = getBrand(campaign.brandId);
  const left = daysLeft(campaign.deadline);
  const product =
    (campaign as any).benefit_title ||
    campaign.giftValue?.trim() ||
    (campaign.perks?.length ? campaign.perks[0] : null) ||
    "Free product";
  const contentHint =
    campaign.deliverables?.length
      ? campaign.deliverables
          .slice(0, 2)
          .map((d: any) => (typeof d === "string" ? d : d.title || d.contentType))
          .filter(Boolean)
          .join(" + ")
      : campaign.types?.slice(0, 2).join(" + ") ||
        campaign.platforms?.slice(0, 2).join(" · ") ||
        "Social content";

  const open = left >= 0 && !["closed", "completed", "cancelled", "paused"].includes(
    String(campaign.status || "").toLowerCase(),
  );

  return (
    <article
      className={cn(
        "tap group relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(18,41,92,0.05)] transition-shadow hover:shadow-[0_8px_28px_-14px_rgba(18,41,92,0.35)]",
        className,
      )}
    >
      <Link to="/campaigns/$campaignId" params={{ campaignId: campaign.id }} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-ink via-[#1a3a7a] to-signal/80">
          {campaign.cover && !String(campaign.cover).includes("app-icon") ? (
            <img
              src={campaign.cover}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : null}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3 pt-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-foreground">
              <Gift className="size-3 text-signal" />
              Free product
            </span>
          </div>
          {campaign.featured ? (
            <span className="absolute left-3 top-3 rounded-full bg-signal px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-signal-foreground">
              Featured
            </span>
          ) : null}
        </div>

        <div className="space-y-2.5 p-4">
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span className="truncate font-medium text-foreground">{brand?.name || "Brand"}</span>
            {brand?.verified ? (
              <BadgeCheck className="size-3.5 shrink-0 text-signal" aria-label="Verified" />
            ) : null}
          </div>

          <h3 className="line-clamp-2 font-display text-[15.5px] font-semibold leading-snug tracking-tight">
            {campaign.title}
          </h3>

          <p className="line-clamp-1 text-[13px] font-semibold text-signal">{product}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Video className="size-3" />
              <span className="line-clamp-1">{contentHint}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {campaign.remote ? "Remote OK" : campaign.location || "Nepal"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span
              className={cn(
                "text-[12px] font-semibold",
                !open ? "text-muted-foreground" : left <= 7 ? "text-signal" : "text-muted-foreground",
              )}
            >
              {!open
                ? "Closed"
                : left > 7
                  ? `${left} days left`
                  : left > 0
                    ? `Closes in ${left}d`
                    : "Closing soon"}
            </span>
            <span className="text-[13px] font-bold text-foreground group-hover:text-signal">
              {open ? "Claim deal →" : "View"}
            </span>
          </div>
        </div>
      </Link>

      {onToggleSave ? (
        <button
          type="button"
          aria-label={saved ? "Unsave" : "Save deal"}
          aria-pressed={saved}
          onClick={() => onToggleSave(campaign.id)}
          className="tap absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground backdrop-blur hover:bg-background active:scale-90"
        >
          <Bookmark className={cn("size-4", saved && "fill-signal text-signal")} />
        </button>
      ) : null}
    </article>
  );
}
