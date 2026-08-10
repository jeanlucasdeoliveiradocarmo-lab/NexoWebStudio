import type { Metadata } from "next";
import { DotGothic16, Space_Mono } from "next/font/google";
import type { CSSProperties } from "react";
import "./globals.css";

const dotGothic = DotGothic16({
  variable: "--font-dot-gothic",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nexo-web-studio-br.jeanlucasdeoliveirad.chatgpt.site"),
  title: "Nexo Web Studio | Soluções digitais sob medida",
  description:
    "Estratégia, design e tecnologia para transformar desafios em resultados extraordinários.",
  icons: {
    icon: [{ url: "/nexo-favicon.png", type: "image/png" }],
    shortcut: "/nexo-favicon.png",
    apple: "/nexo-favicon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const fontVariables = {
    "--font-dot-gothic": dotGothic.style.fontFamily,
    "--font-space-mono": spaceMono.style.fontFamily,
  } as CSSProperties;

  return (
    <html lang="pt-BR" className={`${dotGothic.variable} ${spaceMono.variable} scroll-smooth`} style={fontVariables}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
