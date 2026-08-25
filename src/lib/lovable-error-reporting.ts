/** Optional host error bridge — no-op in production NepCollab. */
export function reportLovableError(_error: unknown, _info?: unknown) {
  if (import.meta.env.DEV && _error) {
    console.error("[NepCollab]", _error, _info);
  }
}
