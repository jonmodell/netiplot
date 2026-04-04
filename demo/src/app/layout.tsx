import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Revis Network - Demo',
  description: 'Interactive demos for the revis-network-ts visualization library',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
