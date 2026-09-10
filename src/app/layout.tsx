import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseRoom — Live Audience Engagement',
  description: 'Real-time polls, Q&A, and quizzes for live events. No signup required.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-bg text-white antialiased min-h-screen">{children}</body>
    </html>
  );
}
