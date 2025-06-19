"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from 'next/link'

interface SocialLoginButtonsProps {
  isSignup?: boolean
}

export function SocialLoginButtons({ isSignup = false }: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const router = useRouter()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://next-app-gilt-one.vercel.app/'

  const handleSocialLogin = async (provider: string) => {
    setLoadingProvider(provider)

    try {
      let authUrl = ''
      let popupName = ''

      switch (provider) {
        case 'kakao':
          authUrl = 
            `https://kauth.kakao.com/oauth/authorize?` +
            `client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&` +
            `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/kakao/login`)}&` +
            `response_type=code&` +
            `scope=profile_nickname`
          popupName = 'kakao_login'
          break
          
        case 'naver':
          const state = Math.random().toString(36).substring(2, 15)
          authUrl = 
            `https://nid.naver.com/oauth2.0/authorize?` +
            `client_id=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/naver/login`)}&` +
            `response_type=code&` +
            `state=${state}&` +
            `scope=profile`
          popupName = 'naver_login'
          break
          
        case 'google':
          authUrl = 
            `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/google/login`)}&` +
            `response_type=code&` +
            `scope=profile email&` +
            `access_type=offline&` +
            `prompt=consent`
          popupName = 'google_login'
          break
          
        default:
          throw new Error('지원하지 않는 소셜 로그인 제공자입니다.')
      }

      // console.log(`[${provider.toUpperCase()} LOGIN] 로그인 URL:`, authUrl)

      // 팝업으로 소셜 로그인 페이지 열기
      const popup = window.open(
        authUrl,
        popupName,
        'width=500,height=700,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
        setLoadingProvider(null)
        return
      }

      // 팝업 상태 감시
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer)
          setLoadingProvider(null)
          // console.log(`[${provider.toUpperCase()} LOGIN] 팝업이 닫혔습니다.`)
          
          // 로그인 상태 확인
          const checkLoginStatus = async () => {
            try {
              const response = await fetch('/api/auth/check', {
                method: 'GET',
                credentials: 'include'
              });
              
              if (!response.ok) {
                // 로그인 실패 시 회원가입 페이지로 이동
                alert(`${provider} 로그인에 실패했습니다. 회원가입 페이지로 이동합니다.`);
                popup.close()
                window.location.href = '/auth/signup';
                return;
              }
              
              // 로그인 성공 시 메인 페이지로 이동
              window.location.reload();
            } catch (error) {
              console.error('로그인 상태 확인 실패:', error);
              alert(`${provider} 로그인에 실패했습니다. 회원가입 페이지로 이동합니다.`);
              popup.close()
              window.location.href = '/auth/signup';
            }
          };
          
          checkLoginStatus();
        }
      }, 800)

            // 팝업에서 메시지 받기 (선택사항)
            const messageHandler = (event: MessageEvent) => {
              if (event.origin !== window.location.origin) return
              
              if (event.data.type === 'SOCIAL_LOGIN_SUCCESS') {
                // console.log(`[${provider.toUpperCase()} LOGIN] 로그인 성공 메시지 받음:`, event.data)
                clearInterval(timer)
                setLoadingProvider(null)
                window.removeEventListener('message', messageHandler)
                popup.close()
                
                // 로그인 성공 시 메인페이지로 이동
                alert(`${event.data.user?.name || provider} 로그인이 완료되었습니다!`)
                window.location.href = '/'
                
              } else if (event.data.type === 'SOCIAL_LOGIN_ERROR') {
                console.error(`[${provider.toUpperCase()} LOGIN] 로그인 에러:`, event.data.error)
                clearInterval(timer)
                setLoadingProvider(null)
                window.removeEventListener('message', messageHandler)
                popup.close()
                alert(`${provider} 로그인 중 오류가 발생했습니다: ${event.data.error}`)
                // 로그인 실패 시 회원가입 페이지로 이동
                window.location.href = '/auth/signup'
              }
            }
            window.addEventListener('message', messageHandler)
  
    } catch (error) {
      console.error(`${provider} 로그인 실패:`, error)
      alert(`${provider} 로그인 중 오류가 발생했습니다.`)
      setLoadingProvider(null)
      
    }
  }

  const socialProviders = [
    {
      id: "google",
      name: "Google",
      color: "bg-white hover:bg-gray-50 text-gray-900 border border-gray-300",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
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
      ),
    },
    {
      id: "kakao",
      name: "카카오",
      color: "bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000]",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
        </svg>
      ),
    },
    {
      id: "naver",
      name: "네이버",
      color: "bg-[#03C75A] hover:bg-[#03C75A]/90 text-white",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      {socialProviders.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          className={`w-full ${provider.color} font-medium`}
          onClick={() => handleSocialLogin(provider.id)}
          disabled={loadingProvider !== null}
        >
          {loadingProvider === provider.id ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <span className="mr-2">{provider.icon}</span>
          )}
          {loadingProvider === provider.id
            ? `${provider.name} ${isSignup ? "가입" : "로그인"} 중...`
            : `${provider.name}로 ${isSignup ? "가입하기" : "로그인"}`}
        </Button>
      ))}
    </div>
  )
}
