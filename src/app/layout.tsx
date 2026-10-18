import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Anek_Malayalam } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const anekMalayalam = Anek_Malayalam({
  variable: "--font-malayalam",
  subsets: ["malayalam", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://quiz.jawharathululoomsuffadars.online"),
  title: "MAERIKA 2K26 Arts Fest | Live Quiz Competition",
  description:
    "Official Live Quiz Competition Platform for MAERIKA 2K26 Arts Fest. Experience real-time timed challenges, cultural Malayalam questions, and interactive competition.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/nattarivu-favicon.png", type: "image/png" },
      { url: "/images/nattarivu-quiz-logo.png", type: "image/png" },
    ],
    shortcut: "/images/nattarivu-quiz-logo.png",
    apple: "/images/nattarivu-favicon.png",
  },
  openGraph: {
    title: "MAERIKA 2K26 Arts Fest | Live Quiz Competition",
    description:
      "Official Live Quiz Competition Platform for MAERIKA 2K26 Arts Fest. Experience real-time timed challenges, cultural Malayalam questions, and interactive competition.",
    url: "https://quiz.jawharathululoomsuffadars.online",
    siteName: "MAERIKA 2K26 Quiz",
    images: [
      {
        url: "/images/nattarivu-quiz-logo.png",
        width: 1024,
        height: 555,
        alt: "നാട്ടറിവ് QUIZ 2026 - MAERIKA 2K26 Arts Fest",
      },
    ],
    locale: "ml_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAERIKA 2K26 Arts Fest | Live Quiz Competition",
    description:
      "Official Live Quiz Competition Platform for MAERIKA 2K26 Arts Fest. Experience real-time timed challenges, cultural Malayalam questions, and interactive competition.",
    images: ["/images/nattarivu-quiz-logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${anekMalayalam.variable} h-full dark`}
    >
      <body className="min-h-full flex flex-col bg-[#080c14] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
