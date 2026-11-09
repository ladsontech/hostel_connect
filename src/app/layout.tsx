import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Hostel Connect Uganda | University Hostel Marketplace',
  description: 'Verified student hostels near Makerere, MUBS, Kyambogo and other Ugandan universities. Direct contact with custodians and verified campus scouts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
