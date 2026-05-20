import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const profile = await auth.getProfile();
      if (!profile) {
        throw redirect({ to: "/login" });
      }
      return { profile };
    }
  },
  component: () => <Outlet />,
});
