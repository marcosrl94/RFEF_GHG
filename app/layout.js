import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata = {
  title: 'Huella de Carbono RFEF',
  description:
    'Calculadora de huella de carbono Scope 3 para eventos y competiciones deportivas, basada en metodología UEFA / GHG Protocol',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
