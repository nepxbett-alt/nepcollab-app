import { createFileRoute, Navigate } from "@tanstack/react-router";

/** Legacy route — redirected for NepCollab V1 */
export const Route = createFileRoute("/brand/applicants")({
  component: () => <Navigate to="/" />,
});
