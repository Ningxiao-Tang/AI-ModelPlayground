import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Model Playground',
  description: 'Compare multiple AI models side-by-side with live streaming output.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
