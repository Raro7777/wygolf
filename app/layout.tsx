import type { Metadata } from "next";
import { Black_Han_Sans, Noto_Sans_KR } from "next/font/google";
import { YeowooShell } from "@/components/yeowoo/YeowooShell";
import "./globals.css";
import "./yeowoo.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

const blackHanSans = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-black-han-sans",
});

export const metadata: Metadata = {
  title: "여우골프 리그전",
  description: "핸디 현황 · 포인트 · 라운드 · 공지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${blackHanSans.variable} h-full`}
    >
      <body
        className={`${notoSansKr.className} yeowoo flex min-h-full flex-col antialiased`}
      >
        <YeowooShell>{children}</YeowooShell>
        <footer className="yw-footer">Yeowoo Golf League</footer>
      </body>
    </html>
  );
}
