import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'SPIS Web',
  description: 'Selective Performance Intelligence System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
