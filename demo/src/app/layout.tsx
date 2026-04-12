import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Netiplot - Demo',
  description: 'Interactive demos for the @jonmodell/netiplot visualization library',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
