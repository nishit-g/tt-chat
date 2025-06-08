'use client';

import { useEffect } from 'react';

export function ReactScanSetup() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('react-scan').then(({ scan }) => {
        scan({
          enabled: true,
          log: false, // Reduce console noise
          showToolbar: true,
          trackUnnecessaryRenders: true,
          animationSpeed: 'fast',
        });
      });
    }
  }, []);

  return null;
}
