import './globals.css';

export const metadata = {
  title: 'J-Forge Studio // Python to Java Conversion & Verification IDE',
  description: 'Intelligent Python-to-Java Conversion, Static Compatibility Scanning, Real OpenJDK/CPython Verification, and Developer Workspace.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0C0D12',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
