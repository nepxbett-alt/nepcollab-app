import { Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, Gift, MapPin } from "lucide-react";
import type { Campaign } from "@/data/types";
import { daysLeft, displayMatch, getBrand } from "@/lib/lookup";
import { cn } from "@/lib/utils";

export function CampaignCard({
  campaign,
  saved,
  onToggleSave,
  match,
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
  const shownMatch = displayMatch(match);
  const reward =
    campaign.giftValue?.trim() ||
    (campaign.perks?.length ? campaign.perks.slice(0, 2).join(" · ") : "Collaboration perks");

  return (
    <article
      className={cn(
        "tap group relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(18,41,92,0.05)] transition-shadow hover:shadow-[0_8px_28px_-14px_rgba(18,41,92,0.35)]",
        className,
      )}
    >
      <Link
        to="/campaigns/$campaignId"
        params={{ campaignId: campaign.id }}
        className="block"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-ink via-[#1a3a7a] to-signal/80">
          {campaign.cover && !String(campaign.cover).includes("app-icon") ? (
          <img
            src={campaign.cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          ) : (
            <div className="flex size-full items-end p-4">
              <span className="text-lg font-bold tracking-tight text-white/90 line-clamp-2">
                {campaign.title}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {campaign.featured ? (
              <span className="rounded-full bg-signal px-2.5 py-1 text-[11px] font-bold text-signal-foreground">
                Featured
              </span>
            ) : null}
            {shownMatch != null ? (
              <span className="rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-bold text-foreground backdrop-blur">
                {shownMatch}% match
              </span>
            ) : null}
          </div>

          <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white/20 text-[11px] font-bold text-white">
              {brand?.logo && !String(brand.logo).includes("app-icon") ? (
                <img src={brand.logo} alt="" loading="lazy" className="size-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              ) : (
                <span>{(brand?.name || "B").slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <span className="flex min-w-0 items-center gap-1 text-[13px] font-semibold text-ink-foreground">
              <span className="truncate">{brand?.name}</span>
              {brand?.verified ? (
                <BadgeCheck className="size-3.5 shrink-0" aria-label="Verified brand" />
              ) : null}
            </span>
          </div>
        </div>

        <div className="space-y-2.5 p-4">
          <h3 className="line-clamp-2 text-[15.5px] font-semibold leading-snug tracking-tight">
            {campaign.title}
          </h3>

          <p className="line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
            {campaign.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {campaign.remote ? "Remote OK" : campaign.location || "Nepal"}
            </span>
            <span className="truncate">{campaign.platforms?.slice(0, 2).join(" · ") || campaign.types.slice(0, 2).join(" · ")}</span>
          </div>

          <div className="flex items-start gap-2 rounded-2xl bg-accent px-3 py-2 text-[12px] text-accent-foreground">
            <Gift className="mt-px size-3.5 shrink-0" />
            <span className="line-clamp-2 font-medium">{reward}</span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span
              className={cn(
                "text-[12px] font-semibold",
                left <= 0 ? "text-muted-foreground" : left <= 7 ? "text-signal" : "text-muted-foreground",
              )}
            >
              {left > 7
                ? `${left} days left to apply`
                : left > 0
                  ? `Closes in ${left} day${left === 1 ? "" : "s"}`
                  : "Applications closed"}
            </span>
            <span className="text-[12.5px] font-semibold text-foreground group-hover:text-signal">
              View details
            </span>
          </div>
        </div>
      </Link>

      {onToggleSave ? (
        <button
          type="button"
          aria-label={saved ? "Remove from saved" : "Save campaign"}
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
