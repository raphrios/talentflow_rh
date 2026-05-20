import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card p-6 rounded-lg shadow text-center max-w-md">
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    </div>
  );
}

export const getRouter = () =>
  createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultErrorComponent,
  });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
