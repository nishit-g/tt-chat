'use client';

import { ConvexProvider as ConvexClientProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexClientProvider client={convex}>
      {children}
    </ConvexClientProvider>
  );
}
