import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'XVSai — Premium AI',
  description: 'Your premium AI assistant powered by multiple models',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="overflow-hidden">{children}</body>
    </html>
  );
}
