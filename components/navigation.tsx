"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Mic, Home, User, Menu, X, LogIn, Bot } from "lucide-react"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 인증 페이지에서는 네비게이션을 숨김
  if (pathname.startsWith("/auth")) {
    return null
  }

  // 로그인 상태를 false로 설정하여 로그인/회원가입 버튼을 표시
  // 하지만 모든 페이지는 접근 가능하도록 함
  const isLoggedIn = false
  const showAllPages = true // 개발용: 모든 페이지 접근 허용

  const navItems = [
    { href: "/", label: "홈", icon: Home },
    { href: "/training", label: "훈련실", icon: Mic },
    { href: "/history", label: "훈련 기록", icon: User },
    { href: "/ai-models", label: "AI 모델", icon: Bot },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-onair-bg/95 backdrop-blur-sm border-b border-onair-text-sub/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-onair-mint rounded-full flex items-center justify-center">
            <Mic className="w-5 h-5 text-onair-bg" />
          </div>
          <span className="text-xl font-bold text-onair-mint">ON AIR</span>
        </Link>

        {/* 데스크톱 메뉴 */}
        <div className="hidden md:flex items-center space-x-1">
          {/* 모든 페이지 메뉴 항상 표시 */}
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href === "/training" && pathname.startsWith("/training"))

            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className={`${
                  isActive
                    ? "text-onair-mint bg-onair-mint/10"
                    : "text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub"
                }`}
              >
                <Link href={item.href} className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            )
          })}

          {isLoggedIn ? (
            <Avatar className="ml-4 cursor-pointer">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback className="bg-onair-bg-sub text-onair-mint">사용자</AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex items-center space-x-2 ml-4">
              <Button
                asChild
                variant="ghost"
                className="text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub"
              >
                <Link href="/auth/login">로그인</Link>
              </Button>
              <Button asChild className="bg-onair-mint hover:bg-onair-mint/90 text-onair-bg">
                <Link href="/auth/signup">회원가입</Link>
              </Button>
            </div>
          )}
        </div>

        {/* 모바일 메뉴 버튼 */}
        <div className="md:hidden flex items-center">
          {isLoggedIn && (
            <Avatar className="mr-2 cursor-pointer">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback className="bg-onair-bg-sub text-onair-mint">사용자</AvatarFallback>
            </Avatar>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-onair-text-sub hover:text-onair-text"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-onair-bg border-t border-onair-text-sub/10 py-4">
          <div className="container mx-auto px-4 space-y-2">
            {/* 모든 페이지 메뉴 항상 표시 */}
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href === "/training" && pathname.startsWith("/training"))

              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive
                      ? "text-onair-mint bg-onair-mint/10"
                      : "text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href={item.href} className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              )
            })}

            {!isLoggedIn && (
              <div className="space-y-2 pt-2 border-t border-onair-text-sub/10">
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/auth/login" className="flex items-center space-x-2">
                    <LogIn className="w-4 h-4" />
                    <span>로그인</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-onair-mint hover:bg-onair-mint/90 text-onair-bg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/auth/signup">회원가입</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
