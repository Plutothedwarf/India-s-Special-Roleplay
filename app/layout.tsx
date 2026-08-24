import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "India's Special Roleplay — Nation Sim",
  description:
    "A multiplayer nation simulation game. Sign in with Google to create or join rooms, claim nations, and shape the world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
