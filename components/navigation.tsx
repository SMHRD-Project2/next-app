"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Mic, Home, User, Menu, X, LogIn, Bot, LogOut, ChevronDown, RefreshCw } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAuthStatus, logout, connectSNS, forceCheckAuth } from "@/lib/auth-utils"

export function Navigation() {
  const pathname = usePathname()
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

  const profileMenuRef = useRef<HTMLDivElement>(null)

  // 클라이언트 사이드 마운트 확인
  useEffect(() => {
    console.log("[NAV] 컴포넌트 마운트됨")
    setMounted(true)
  }, [])

  // 로그인 상태 확인 함수
  const checkAuthStatus = () => {
    console.log("[NAV] checkAuthStatus 호출됨")
    if (typeof window !== "undefined") {
      const { isLoggedIn: loggedIn, userProfile: profile } = getAuthStatus()
      console.log("[NAV] 상태 확인 결과:", { loggedIn, profile })

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
  }

  // 강제 새로고침 (디버깅용)
  const handleForceRefresh = () => {
    console.log("[NAV] 강제 새로고침")
    const authStatus = forceCheckAuth()
    console.log("[NAV] 강제 확인 결과:", authStatus)
    checkAuthStatus()
  }

  // 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    if (mounted) {
      console.log("[NAV] 마운트 완료 - 상태 확인 시작")
      checkAuthStatus()
    }
  }, [mounted])

  // 주기적으로 상태 확인 (디버깅용)
  useEffect(() => {
    if (mounted) {
      const interval = setInterval(() => {
        console.log("[NAV] 주기적 상태 확인")
        checkAuthStatus()
      }, 5000) // 5초마다 확인

      return () => clearInterval(interval)
    }
  }, [mounted])

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // 인증 페이지에서는 네비게이션을 숨김
  if (pathname.startsWith("/auth")) {
    return null
  }

  // 로그인 페이지로 이동
  const handleLoginRedirect = () => {
    console.log("[NAV] 로그인 페이지로 이동")
    window.location.href = "/auth/login"
  }

  // 로그아웃 처리
  const handleLogout = () => {
    console.log("[NAV] 로그아웃 버튼 클릭됨")
    logout()
  }

  // SNS 연동 처리
  const handleSNSConnect = (provider: string) => {
    connectSNS(provider)
    setProfileMenuOpen(false)
  }

  const navItems = [
    { href: "/", label: "홈", icon: Home },
    { href: "/training", label: "훈련실", icon: Mic },
    { href: "/history", label: "훈련 기록", icon: User },
    { href: "/ai-models", label: "AI 모델", icon: Bot },
  ]

  // 클라이언트 사이드 렌더링이 완료되지 않았으면 기본 상태로 표시
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-onair-bg/95 backdrop-blur-sm border-b border-onair-text-sub/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-onair-mint rounded-full flex items-center justify-center">
              <Mic className="w-5 h-5 text-onair-bg" />
            </div>
            <span className="text-xl font-bold text-onair-mint">ON AIR</span>
          </Link>
          <div className="hidden md:flex items-center space-x-1">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" className="text-onair-text-sub hover:text-onair-text hover:bg-onair-bg-sub">
                로그인
              </Button>
              <Button className="bg-onair-mint hover:bg-onair-mint/90 text-onair-bg">회원가입</Button>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  console.log("[NAV] 렌더링 - 로그인:", isLoggedIn, "프로필:", userProfile.name, "디버그:", debugInfo)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-onair-bg/95 backdrop-blur-sm border-b border-onair-text-sub/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-onair-mint rounded-full flex items-center justify-center">
            <Mic className="w-5 h-5 text-onair-bg" />
          </div>
          <span className="text-xl font-bold text-onair-mint">ON AIR</span>
        </Link>

        {/* 디버그 정보 (개발용) */}
        <div className="hidden lg:block text-xs text-onair-text-sub">
          {debugInfo} |
          <button onClick={handleForceRefresh} className="ml-1 text-onair-mint hover:underline">
            <RefreshCw className="w-3 h-3 inline" />
          </button>
        </div>

        {/* 데스크톱 메뉴 */}
        <div className="hidden md:flex items-center space-x-1">
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

          {/* 로그인 상태에 따른 조건부 렌더링 */}
          <div className="ml-4">
            {isLoggedIn ? (
              // 로그인된 상태: 프로필 메뉴 표시
              <div className="relative" ref={profileMenuRef}>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 text-onair-text hover:text-onair-mint hover:bg-onair-mint/10"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile.image || "/placeholder.svg"} alt={userProfile.name} />
                    <AvatarFallback className="bg-onair-bg-sub text-onair-mint text-sm">
                      {userProfile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{userProfile.name}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
                </Button>

                {/* 프로필 드롭다운 메뉴 */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-onair-bg-sub border border-onair-text-sub/20 rounded-lg shadow-lg z-50">
                    {/* 사용자 정보 */}
                    <div className="px-4 py-3 border-b border-onair-text-sub/10">
                      <p className="text-sm font-medium text-onair-text">{userProfile.name}</p>
                      <p className="text-xs text-onair-text-sub">{userProfile.email}</p>
                    </div>

                    {/* SNS 연동 섹션 */}
                    <div className="py-2">
                      <div className="px-4 py-2">
                        <p className="text-xs font-medium text-onair-text-sub">SNS 계정 연동</p>
                      </div>
                      <button
                        onClick={() => handleSNSConnect("Google")}
                        className="w-full px-4 py-2 text-left text-sm text-onair-text hover:bg-onair-mint/10 hover:text-onair-mint flex items-center"
                      >
                        <div className="mr-3 h-4 w-4 flex items-center justify-center">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        </div>
                        Google 연동
                      </button>
                      <button
                        onClick={() => handleSNSConnect("Naver")}
                        className="w-full px-4 py-2 text-left text-sm text-onair-text hover:bg-onair-mint/10 hover:text-onair-mint flex items-center"
                      >
                        <div className="mr-3 h-4 w-4 flex items-center justify-center bg-[#03C75A] rounded-sm">
                          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
                          </svg>
                        </div>
                        Naver 연동
                      </button>
                      <button
                        onClick={() => handleSNSConnect("Kakao")}
                        className="w-full px-4 py-2 text-left text-sm text-onair-text hover:bg-onair-mint/10 hover:text-onair-mint flex items-center"
                      >
                        <div className="mr-3 h-4 w-4 flex items-center justify-center bg-[#FEE500] rounded-sm">
                          <svg className="h-2.5 w-2.5 text-black" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
                          </svg>
                        </div>
                        Kakao 연동
                      </button>
                    </div>

                    {/* 로그아웃 */}
                    <div className="border-t border-onair-text-sub/10">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-400 flex items-center"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 로그아웃된 상태: 로그인/회원가입 버튼 표시
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

        {/* 모바일 메뉴 버튼 */}
        <div className="md:hidden flex items-center">
          {isLoggedIn && (
            <div className="mr-2 relative" ref={profileMenuRef}>
              <Button variant="ghost" size="sm" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile.image || "/placeholder.svg"} alt={userProfile.name} />
                  <AvatarFallback className="bg-onair-bg-sub text-onair-mint text-xs">
                    {userProfile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>

              {/* 모바일 프로필 드롭다운 메뉴 */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-onair-bg-sub border border-onair-text-sub/20 rounded-lg shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-onair-text-sub/10">
                    <p className="text-sm font-medium text-onair-text">{userProfile.name}</p>
                    <p className="text-xs text-onair-text-sub">{userProfile.email}</p>
                  </div>
                  <div className="py-2">
                    <div className="px-4 py-2">
                      <p className="text-xs font-medium text-onair-text-sub">SNS 계정 연동</p>
                    </div>
                    <button
                      onClick={() => handleSNSConnect("Google")}
                      className="w-full px-4 py-2 text-left text-sm text-onair-text hover:bg-onair-mint/10 hover:text-onair-mint flex items-center"
                    >
                      Google 연동
                    </button>
                    <button
                      onClick={() => handleSNSConnect("Naver")}
                      className="w-full px-4 py-2 text-left text-sm text-onair-text hover:bg-onair-mint/10 hover:text-onair-mint flex items-center"
                    >
                      Naver 연동
                    </button>
                    <button
                      onClick={() => handleSNSConnect("Kakao")}
                      className="w-full px-4 py-2 text-left text-sm text-onair-text hover:bg-onair-mint/10 hover:text-onair-mint flex items-center"
                    >
                      Kakao 연동
                    </button>
                  </div>
                  <div className="border-t border-onair-text-sub/10">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-400 flex items-center"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
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
