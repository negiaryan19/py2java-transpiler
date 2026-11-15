import './globals.css';

export const metadata = {
  title: 'J-Forge // Python to Java Transpiler & API Gateway (BTIN337 CIA-P)',
  description: 'Production-ready Python 3.11 to Java 17 LTS AST Transpiler, REST API Gateway, and Webhook Dispatcher built for Next.js App Router and Vercel.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090B',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="cupertino">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
