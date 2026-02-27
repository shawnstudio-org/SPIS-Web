import './globals.css';

export const metadata = {
  title: 'SPIS Web',
  description: 'Selective Performance Intelligence System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
