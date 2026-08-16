import type { Metadata } from "next";
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
      <body className="bg-[#FAF7F2] text-[#2D2A26] antialiased">
        {children}
      </body>
    </html>
  );
}