/** Centralized payout calculation — no wallet, obligations only. */

export type PaymentModel = "fixed" | "performance";

export type Milestone = { views: number; amount: number };

export type PayoutRule = {
  paymentModel: PaymentModel;
  fixedAmount?: number | null;
  ratePer1000Views?: number | null;
  maximumPayout?: number | null;
  milestones?: Milestone[] | null;
  /** When milestones exist, prefer milestone ladder over pure rate. */
  useMilestones?: boolean;
};

export type PayoutResult = {
  amount: number;
  model: PaymentModel;
  verifiedViews: number;
  snapshot: Record<string, unknown>;
};

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function calculatePayout(rule: PayoutRule, verifiedViews: number): PayoutResult {
  const views = Math.max(0, Math.floor(n(verifiedViews)));
  const model = rule.paymentModel || "fixed";

  if (model === "fixed") {
    const amount = Math.max(0, n(rule.fixedAmount));
    return {
      amount,
      model: "fixed",
      verifiedViews: views,
      snapshot: { model: "fixed", fixedAmount: amount, verifiedViews: views },
    };
  }

  const milestones = (rule.milestones || [])
    .map((m) => ({ views: Math.floor(n(m.views)), amount: Math.max(0, n(m.amount)) }))
    .filter((m) => m.views > 0)
    .sort((a, b) => a.views - b.views);

  if (rule.useMilestones !== false && milestones.length > 0) {
    let amount = 0;
    for (const m of milestones) {
      if (views >= m.views) amount = m.amount;
    }
    const max = rule.maximumPayout != null ? n(rule.maximumPayout) : null;
    if (max != null && max > 0) amount = Math.min(amount, max);
    return {
      amount,
      model: "performance",
      verifiedViews: views,
      snapshot: {
        model: "performance",
        mode: "milestones",
        milestones,
        verifiedViews: views,
        amount,
        maximumPayout: max,
      },
    };
  }

  const rate = Math.max(0, n(rule.ratePer1000Views));
  let amount = Math.floor(views / 1000) * rate;
  const max = rule.maximumPayout != null ? n(rule.maximumPayout) : null;
  if (max != null && max > 0) amount = Math.min(amount, max);

  return {
    amount,
    model: "performance",
    verifiedViews: views,
    snapshot: {
      model: "performance",
      mode: "rate",
      ratePer1000Views: rate,
      verifiedViews: views,
      amount,
      maximumPayout: max,
      formula: "min(floor(views/1000)*rate, maximum_payout)",
    },
  };
}

export function formatNpr(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `Rs. ${Math.round(amount).toLocaleString("en-NP")}`;
}

export function payoutSummaryLabel(rule: PayoutRule): string {
  if (rule.paymentModel === "fixed") {
    return `Fixed ${formatNpr(rule.fixedAmount)}`;
  }
  const milestones = rule.milestones || [];
  if (milestones.length > 0 && rule.useMilestones !== false) {
    const top = Math.max(...milestones.map((m) => n(m.amount)));
    return `Up to ${formatNpr(top)} (milestones)`;
  }
  const rate = n(rule.ratePer1000Views);
  const max = rule.maximumPayout != null ? n(rule.maximumPayout) : null;
  if (max != null && max > 0) {
    return `${formatNpr(rate)} / 1K views · max ${formatNpr(max)}`;
  }
  return `${formatNpr(rate)} / 1K views`;
}

/** Accept public social post URLs only. */
export function isValidContentUrl(url: string): boolean {
  const u = String(url || "").trim().toLowerCase();
  if (!/^https?:\/\//.test(u)) return false;
  try {
    const host = new URL(u).hostname.replace(/^www\./, "");
    if (host.includes("instagram.com")) {
      return /instagram\.com\/(reel|p|tv)\//.test(u);
    }
    if (host.includes("tiktok.com")) {
      return /tiktok\.com\/@.+\/video\//.test(u) || /vm\.tiktok\.com\//.test(u);
    }
    if (host.includes("youtube.com") || host === "youtu.be") {
      return /youtube\.com\/watch\?|youtu\.be\/|youtube\.com\/shorts\//.test(u);
    }
    if (host.includes("facebook.com") || host.includes("fb.watch")) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
