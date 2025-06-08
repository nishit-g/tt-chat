import type { Metadata } from 'next';
import './globals.css';
import { ReactScanSetup } from '@/components/react-scan-setup';
import { LocalStorageProvider } from '@/components/chat/local-storage-provider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'T3 Chat - Local-First',
  description: 'Blazingly fast AI chat with local-first architecture',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <ReactScanSetup />
        <LocalStorageProvider>
          {children}
        </LocalStorageProvider>
        <Toaster />
      </body>
    </html>
  );
}
