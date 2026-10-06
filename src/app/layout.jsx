import { Be_Vietnam_Pro } from 'next/font/google';
import 'katex/dist/katex.min.css';
import './globals.css';
import './refinement.css';
import { ToastProvider } from '@/components/client-ui';
import { getSettings } from '@/lib/site';

const font = Be_Vietnam_Pro({ subsets: ['vietnamese', 'latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-main', display: 'swap' });

export async function generateMetadata() {
  const s = await getSettings();
  return {
    title: { default: `${s.siteName} – Học Toán & luyện thi trực tuyến`, template: `%s | ${s.siteName}` },
    description: 'Khóa học Toán 10, 11, 12 và luyện thi THPT. Luyện đề trực tuyến theo cấu trúc mới, chấm điểm ngay, kết quả rõ ràng.',
  };
}

export const viewport = { themeColor: '#22308f', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={font.variable}>
      <body>
        <a href="#main" className="skip-link">Bỏ qua điều hướng</a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
