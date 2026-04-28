import { Inter, Archivo_Black } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata = {
  title: 'Huella de Carbono RFEF',
  description:
    'Calculadora de huella de carbono Scope 3 para eventos y competiciones deportivas, basada en metodología UEFA / GHG Protocol',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${archivoBlack.variable}`}>
      <body>{children}</body>
    </html>
  );
}
