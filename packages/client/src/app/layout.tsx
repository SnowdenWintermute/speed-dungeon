import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speed Dungeon",
  description: "A cooperative RPG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="box-border h-screen w-screen bg-slate-800 text-zinc-300 relative pointer-events-none">
        {children}
      </body>
    </html>
  );
}
