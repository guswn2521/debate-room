import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "가족 토론방",
  description: "가족이 방 코드로 모여 AI 사회자와 함께 건강하게 토론하는 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
