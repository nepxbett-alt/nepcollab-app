/**
 * Map unknown errors to short, user-safe messages.
 * Never expose SQL, stack traces, keys, or internal codes.
 */
export function toUserError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;
  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === "object" && error && "message" in error
          ? String((error as { message: unknown }).message)
          : "";

  const msg = raw.trim();
  if (!msg) return fallback;

  const lower = msg.toLowerCase();

  // Network
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("offline") ||
    lower.includes("load failed")
  ) {
    return "We couldn't connect right now. Check your internet connection and try again.";
  }

  // Auth
  if (lower.includes("expired") || lower.includes("invalid") && lower.includes("link")) {
    return "This login link is invalid or has expired. Please request a new one.";
  }
  if (lower.includes("not signed in") || lower.includes("not authenticated") || lower.includes("jwt")) {
    return "Please sign in to continue.";
  }
  if (lower.includes("permission") || lower.includes("rls") || lower.includes("policy") || lower.includes("row-level")) {
    return "You don't have permission to do that.";
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (lower.includes("sending confirmation email") || lower.includes("email service") || lower.includes("mail")) {
    return "We couldn't send your login email right now. Please try again in a few minutes.";
  }

  // Not found
  if (lower.includes("not found") || lower.includes("no rows") || lower.includes("pgrst116")) {
    return "We couldn't find that. It may have been removed.";
  }

  // Unique / validation
  if (lower.includes("unique") || lower.includes("duplicate") || lower.includes("already exists")) {
    return "That value is already in use. Try a different one.";
  }

  // Strip technical noise
  if (
    lower.includes("postgres") ||
    lower.includes("sql") ||
    lower.includes("stack") ||
    lower.includes("supabase") ||
    lower.includes("pgrst") ||
    lower.includes("column") ||
    lower.includes("schema cache")
  ) {
    return "NepCollab is having trouble right now. Please try again in a moment.";
  }

  // Already user-facing messages from our own throws — keep if short
  if (msg.length <= 160 && !lower.includes("error:") && !msg.includes("\n")) {
    return msg;
  }

  return fallback;
}
