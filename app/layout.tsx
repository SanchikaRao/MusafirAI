import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MusafirAI — Smart Travel Planner",
  description: "AI-powered personalized travel itineraries, route maps, and verified local budgets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2D2A26] antialiased">
        <main className="flex-1">{children}</main>

        <footer className="w-full border-t border-[#2D2A26]/10 py-6 text-center text-sm text-[#2D2A26]/70">
          © 2026 MusafirAI · Built by{" "}
          <a
            href="https://github.com/SanchikaRao"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#2D2A26] underline-offset-4 hover:underline"
          >
            Sanchika Rao
          </a>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}