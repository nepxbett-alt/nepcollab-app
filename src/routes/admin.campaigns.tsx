import { createFileRoute, Navigate } from "@tanstack/react-router";

/** Legacy route — redirected for NepCollab V1 */
export const Route = createFileRoute("/admin/campaigns")({
  component: () => <Navigate to="/admin" />,
});
