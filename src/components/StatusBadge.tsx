import { cn } from "@/lib/utils";
import type {
  ApplicationStatus,
  CampaignStatus,
  CollaborationStatus,
  DeliverableStatus,
} from "@/data/types";

type AnyStatus =
  | ApplicationStatus
  | CampaignStatus
  | CollaborationStatus
  | DeliverableStatus;

const tone: Record<string, string> = {
  APPLIED: "bg-secondary text-secondary-foreground",
  UNDER_REVIEW: "bg-accent text-accent-foreground",
  SHORTLISTED: "bg-signal/20 text-signal-foreground",
  SELECTED: "bg-success/20 text-success",
  REJECTED: "bg-destructive/15 text-destructive",
  WITHDRAWN: "bg-muted text-muted-foreground",
  EXPIRED: "bg-muted text-muted-foreground",
  DRAFT: "bg-muted text-muted-foreground",
  PENDING_REVIEW: "bg-accent text-accent-foreground",
  PUBLISHED: "bg-success/20 text-success",
  APPLICATIONS_OPEN: "bg-success/20 text-success",
  SELECTION: "bg-signal/20 text-signal-foreground",
  COLLABORATION_ACTIVE: "bg-signal/20 text-signal-foreground",
  SUBMISSION_REVIEW: "bg-accent text-accent-foreground",
  COMPLETED: "bg-success/20 text-success",
  CANCELLED: "bg-destructive/15 text-destructive",
  PAUSED: "bg-muted text-muted-foreground",
  ACCEPTED: "bg-success/20 text-success",
  ACTIVE: "bg-signal/20 text-signal-foreground",
  WORK_SUBMITTED: "bg-accent text-accent-foreground",
  REVIEWING: "bg-accent text-accent-foreground",
  REVISION_REQUESTED: "bg-warning/25 text-warning-foreground",
  PENDING: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-accent text-accent-foreground",
  APPROVED: "bg-success/20 text-success",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AnyStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        tone[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {status.toLowerCase().replace(/_/g, " ")}
    </span>
  );
}
