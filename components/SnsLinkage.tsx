'use client'

import { useState, useEffect } from 'react'

interface SnsLinkageProps {
  userId: string
}

export default function SnsLinkage({ userId }: SnsLinkageProps) {
  const [loading, setLoading] = useState('')
  const [message, setMessage] = useState('')
  const [currentOrigin, setCurrentOrigin] = useState('')

  useEffect(() => {
    // 클라이언트 사이드에서만 window.location.origin 사용
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin)
    }
  }, [])

  const handleKakaoLink = () => {
    setLoading('kakao')
    
    const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY
    const redirectUri = `${currentOrigin}api/auth/kakao/callback`
    
    // console.log('카카오 클라이언트 ID:', clientId)
    // console.log('현재 Origin:', currentOrigin)
    // console.log('Redirect URI:', redirectUri)
    
    if (!clientId) {
      setMessage('카카오 클라이언트 ID가 설정되지 않았습니다.')
      setLoading('')
      return
    }

    if (!currentOrigin) {
      setMessage('현재 도메인을 확인할 수 없습니다.')
      setLoading('')
      return
    }

    const kakaoUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile_nickname,profile_image,account_email`
    
    // console.log('최종 카카오 URL:', kakaoUrl)
    
    // 새 창으로 열기 (디버깅용)
    // window.open(kakaoUrl, '_blank')
    
    // 현재 창에서 이동
    window.location.href = kakaoUrl
  }

  const handleNaverLink = () => {
    setLoading('naver')
    
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID
    const redirectUri = `${currentOrigin}/api/auth/naver/callback`
    const state = Math.random().toString(36).substring(2, 15)
    
    if (!clientId || !currentOrigin) {
      setMessage('네이버 설정에 오류가 있습니다.')
      setLoading('')
      return
    }

    const naverUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile`
    
    window.location.href = naverUrl
  }

  const handleGoogleLink = () => {
    setLoading('google')
    
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = `${currentOrigin}api/auth/google/callback`
    
    if (!clientId || !currentOrigin) {
      setMessage('구글 설정에 오류가 있습니다.')
      setLoading('')
      return
    }

    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile email&access_type=offline`
    
    window.location.href = googleUrl
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">SNS 계정 연동</h3>
      
      {/* 디버깅 정보 표시 */}
      <div className="text-sm text-gray-600 p-2 bg-gray-100 rounded">
        <p>현재 도메인: {currentOrigin || '로딩 중...'}</p>
        <p>카카오 클라이언트 ID: {process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ? '설정됨' : '설정되지 않음'}</p>
      </div>
      
      <div className="grid gap-3">
        <button
          onClick={handleKakaoLink}
          disabled={loading === 'kakao' || !currentOrigin}
          className="flex items-center justify-center gap-2 p-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 disabled:opacity-50"
        >
          {loading === 'kakao' ? '연동 중...' : '카카오 연동'}
        </button>

        <button
          onClick={handleNaverLink}
          disabled={loading === 'naver' || !currentOrigin}
          className="flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {loading === 'naver' ? '연동 중...' : '네이버 연동'}
        </button>

        <button
          onClick={handleGoogleLink}
          disabled={loading === 'google' || !currentOrigin}
          className="flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading === 'google' ? '연동 중...' : '구글 연동'}
        </button>
      </div>

      {message && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg">
          {message}
        </div>
      )}
    </div>
  )
} 