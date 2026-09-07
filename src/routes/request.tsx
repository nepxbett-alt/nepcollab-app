import { createFileRoute, Navigate } from "@tanstack/react-router";

/** Prefer /list-business for V1 listing flow */
export const Route = createFileRoute("/request")({
  component: () => <Navigate to="/list-business" />,
});
