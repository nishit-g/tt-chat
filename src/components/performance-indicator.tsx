'use client';

import { useState, useEffect } from 'react';

export function PerformanceIndicator() {
  const [renderCount, setRenderCount] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded font-mono">
      <div>Renders: {renderCount}</div>
      <div>Uptime: {Math.floor((Date.now() - startTime) / 1000)}s</div>
      <div className="text-green-400">⚡ React Scan Active</div>
    </div>
  );
}
