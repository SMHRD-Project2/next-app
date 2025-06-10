import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navigation } from "@/components/navigation"
import NextAuthProvider from "@/components/NextAuthProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ON AIR - AI 발음 피드백 훈련 플랫폼",
  description: "아나운서 및 스피치 입시/실무 준비생을 위한 AI 기반 발음 피드백 훈련 플랫폼",
  generator: "v0.dev",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.className} bg-onair-bg text-onair-text min-h-screen`}>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <Navigation />
            <main className="pt-16">{children}</main>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
