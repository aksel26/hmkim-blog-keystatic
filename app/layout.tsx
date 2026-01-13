import ClientLayout from "@/components/layout/ClientLayout";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const freesentation = localFont({
  src: "./fonts/FreesentationVF.ttf",
  display: "swap",
});


export const metadata: Metadata = {
  title: "HM Blog - Tech & Life",
  description: "This is where I tell stories. Most of them are about tech and life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${freesentation.className} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
