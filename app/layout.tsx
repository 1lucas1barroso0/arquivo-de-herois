import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "../components/locale-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arquivo de Heróis",
  description:
    "Crie, confira, salve e compartilhe fichas completas com cálculos automáticos e liberdade para a sua campanha.",
  applicationName: "Arquivo de Heróis",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Arquivo de Heróis",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#11171b" },
    { media: "(prefers-color-scheme: light)", color: "#f5f7f4" },
  ],
};

const themeBootstrap = `(() => {
  try {
    const saved = localStorage.getItem("arquivo-de-herois:tema:v2") || localStorage.getItem("mm4e-theme:v1") || "light";
    const resolved = saved === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : saved;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = saved;
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.themePreference = "light";
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
