"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Mic,
  Home,
  User,
  Menu,
  X,
  LogIn,
  Bot,
  LogOut,
  ChevronDown,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAuthStatus, connectSNS, forceCheckAuth } from "@/lib/auth-utils"

//--------------------------------------------------------------
// Navigation Component
//--------------------------------------------------------------
export function Navigation() {
  const pathname = usePathname()

  /* ------------------------------------------------------------------ */
  /* state                                                               */
  /* ------------------------------------------------------------------ */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [userProfile, setUserProfile] = useState({
    name: "사용자",
    email: "user@example.com",
    image: "/placeholder.svg?height=32&width=32",
  })
  const [mounted, setMounted] = useState(false)
  const [debugInfo, setDebugInfo] = useState("")

  /* ------------------------------------------------------------------ */
  /* refs – 두 개로 분리                                                 */
  /* ------------------------------------------------------------------ */
  const desktopMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */
  const checkAuthStatus = () => {
    if (typeof window === "undefined") return
    const { isLoggedIn: loggedIn, userProfile: profile } = getAuthStatus()

    setIsLoggedIn(loggedIn)
    if (profile && loggedIn) {
      setUserProfile(profile)
      setDebugInfo(`로그인됨: ${profile.email}`)
    } else {
      setUserProfile({
        name: "사용자",
        email: "user@example.com",
        image: "/placeholder.svg?height=32&width=32",
      })
      setDebugInfo("로그아웃 상태")
    }
  }

  const handleLoginRedirect = () => {
    window.location.href = "/auth/login"
  }

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", { method: "POST" })
      if (!response.ok) throw new Error("로그아웃 API 호출 실패")

      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("userProfile")

      setProfileMenuOpen(false)
      setIsLoggedIn(false)
      setUserProfile({
        name: "사용자",
        email: "user@example.com",
        image: "/placeholder.svg?height=32&width=32",
      })

      window.dispatchEvent(new Event("localStorageChange"))
      window.location.href = "/"
    } catch (err) {
      console.error("[NAV] 로그아웃 오류", err)
      alert("로그아웃 처리 중 오류가 발생했습니다.")
    }
  }

  const handleSNSConnect = (provider: string) => {
    connectSNS(provider.toLowerCase())
    setProfileMenuOpen(false)
  }

  /* ------------------------------------------------------------------ */
  /* lifecycle                                                           */
  /* ------------------------------------------------------------------ */
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    checkAuthStatus()
  }, [mounted])

  // storage 이벤트로 로그인 상태 동기화
  useEffect(() => {
    const listener = () => checkAuthStatus()
    window.addEventListener("storage", listener)
    window.addEventListener("localStorageChange", listener)
    return () => {
      window.removeEventListener("storage", listener)
      window.removeEventListener("localStorageChange", listener)
    }
  }, [])

  /* ------------------------------------------------------------------ */
  /* early‑return: auth pages                                            */
  /* ------------------------------------------------------------------ */
  if (pathname?.startsWith("/auth")) return null

  /* ------------------------------------------------------------------ */
  /* nav items                                                           */
  /* ------------------------------------------------------------------ */
  const navItems = [
    { href: "/", label: "홈", icon: Home },
    { href: "/training", label: "훈련실", icon: Mic },
    { href: "/history", label: "훈련 기록", icon: User },
    { href: "/ai-models", label: "AI 모델", icon: Bot },
  ]

  /* ------------------------------------------------------------------ */
  /* skeleton while mounting                                             */
  /* ------------------------------------------------------------------ */
  // if (!mounted) {
  //   return (
  //     <nav className="fixed top-0 left-0 right-0 z-50 bg-onair-bg/95 backdrop-blur-sm border-b border-onair-text-sub/10">
  //       <div className="container mx-auto px-4 h-16 flex items-center justify-between">
  //         <Link href="/" className="flex items-center space-x-2">
  //           <div className="w-8 h-8 bg-onair-mint rounded-full flex items-center justify-center">
  //             <Mic className="w-5 h-5 text-onair-bg" />
  //           </div>
  //           <span className="text-xl font-bold text-onair-mint">ON AIR</span>
  //         </Link>
  //       </div>
  //     </nav>
  //   )
  // }

  /* ------------------------------------------------------------------ */
  /* render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-onair-bg/95 backdrop-blur-sm border-b border-onair-text-sub/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-onair-mint rounded-full flex items-center justify-center">
            <Mic className="w-5 h-5 text-onair-bg" />
          </div>
          <span className="text-xl font-bold text-onair-mint">ON AIR</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href === "/training" && pathname?.startsWith("/training"))
            return (
              <Button
                key={href}
                asChild
                variant="ghost"
                className={
                  active
                    ? "text-onair-mint bg-onair-mint/10"
                    : "text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub"
                }
              >
                <Link href={href} className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              </Button>
            )
          })}

          {/* auth area */}
          <div className="ml-4">
            {isLoggedIn ? (
              /* ---------------- Desktop profile ---------------- */
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 text-onair-text hover:text-onair-mint hover:bg-onair-mint/10"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile.image} alt={userProfile.name} />
                    <AvatarFallback className="bg-onair-bg-sub text-onair-mint text-sm">
                      {userProfile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{userProfile.name}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`}
                  />
                </Button>

                {profileMenuOpen && (
                  <div
                    ref={desktopMenuRef}
                    className="absolute right-0 mt-2 w-64 bg-onair-bg-sub border border-onair-text-sub/20 rounded-lg shadow-lg z-50"
                  >
                    {/* profile header */}
                    <div className="px-4 py-3 border-b border-onair-text-sub/10">
                      <p className="text-sm font-medium text-onair-text">{userProfile.name}</p>
                      <p className="text-xs text-onair-text-sub">{userProfile.email}</p>
                    </div>

                    {/* sns links */}
                    <div className="py-2">
                      <p className="px-4 py-2 text-xs font-medium text-onair-text-sub">SNS 계정 연동</p>
                      {[
                        { label: "Google", provider: "google", icon: "https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" },
                        { label: "Naver", provider: "naver", icon: '/naver.png' },
                        { label: "Kakao", provider: "kakao", icon: "https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png" },
                      ].map(({ label, provider, icon }) => (
                        <button
                          key={provider}
                          onClick={() => handleSNSConnect(provider)}
                          className="w-full px-4 py-2 text-left text-sm text-onair-text hover:bg-onair-mint/10 hover:text-onair-mint flex items-center gap-2"
                        >
                          {icon && <img src={icon} alt={`${label} 로고`} className="w-5 h-5" />}
                          {label} 연동
                        </button>
                      ))}
                    </div>

                    {/* logout */}
                    <div className="border-t border-onair-text-sub/10">
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-400"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        로그아웃
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ---------------- Desktop guest ---------------- */
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  className="text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub"
                  onClick={handleLoginRedirect}
                >
                  로그인
                </Button>
                <Button asChild className="bg-onair-mint hover:bg-onair-mint/90 text-onair-bg">
                  <Link href="/auth/signup">회원가입</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- Mobile top‑right ---------------- */}
        <div className="md:hidden flex items-center">
          {isLoggedIn && (
            <Button variant="ghost" size="sm" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={userProfile.image} alt={userProfile.name} />
                <AvatarFallback className="bg-onair-bg-sub text-onair-mint text-xs">
                  {userProfile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Button>
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

      {/* ---------------- Mobile profile dropdown ---------------- */}
      {isLoggedIn && profileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden absolute right-4 top-16 w-56 bg-onair-bg-sub border border-onair-text-sub/20 rounded-lg shadow-lg z-50"
        >
          <div className="px-4 py-3 border-b border-onair-text-sub/10">
            <p className="text-sm font-medium text-onair-text">{userProfile.name}</p>
            <p className="text-xs text-onair-text-sub">{userProfile.email}</p>
          </div>
          <div className="py-2">
            <p className="px-4 py-2 text-xs font-medium text-onair-text-sub">SNS 계정 연동</p>
            {[
              { label: "Google", provider: "google", icon: "https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" },
              { label: "Naver", provider: "naver", icon: '/naver.png' },
              { label: "Kakao", provider: "kakao", icon: "https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png" },
            ].map(({ label, provider, icon }) => (
              <button
                key={provider}
                onClick={() => handleSNSConnect(provider)}
                className="w-full px-4 py-2 text-left text-sm text-onair-text hover:bg-onair-mint/10 hover:text-onair-mint flex items-center gap-2"
              >
                {icon && <img src={icon} alt={`${label} 로고`} className="w-5 h-5" />}
                {label} 연동
              </button>
            ))}
          </div>
          <div className="border-t border-onair-text-sub/10">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-400 flex items-center"
            >
              <LogOut className="mr-3 h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Mobile nav list ---------------- */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-onair-bg border-t border-onair-text-sub/10 py-4">
          <div className="container mx-auto px-4 space-y-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || (href === "/training" && pathname?.startsWith("/training"))
              return (
                <Button
                  key={href}
                  asChild
                  variant="ghost"
                  className={`w-full justify-start ${
                    active
                      ? "text-onair-mint bg-onair-mint/10"
                      : "text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href={href} className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                </Button>
              )
            })}

            {!isLoggedIn && (
              <div className="space-y-2 pt-2 border-t border-onair-text-sub/10">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLoginRedirect()
                  }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  <span>로그인</span>
                </Button>
                <Button asChild className="w-full bg-onair-mint hover:bg-onair-mint/90 text-onair-bg">
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    회원가입
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
