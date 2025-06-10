"use client"

import { useState, useEffect } from 'react'
import { getAuthStatus } from '@/lib/auth-utils'

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const { isLoggedIn } = getAuthStatus()
      setIsLoggedIn(isLoggedIn)
    }

    // 초기 상태 확인
    checkAuth()

    // localStorage 변경 이벤트 리스너 등록
    window.addEventListener('localStorageChange', checkAuth)

    return () => {
      window.removeEventListener('localStorageChange', checkAuth)
    }
  }, [])

  return {
    isLoggedIn,
  }
} 