"use client"

// 디버깅을 위한 로그 함수
const debugLog = (message: string, data?: any) => {
  console.log(`[AUTH DEBUG] ${message}`, data || "")
}

// 로그인 상태 확인
export const getAuthStatus = () => {
  debugLog("getAuthStatus 호출됨")

  if (typeof window === "undefined") {
    debugLog("서버 사이드에서 호출됨 - 기본값 반환")
    return { isLoggedIn: false, userProfile: null }
  }

  try {
    // 쿠키와 localStorage 모두 확인
    const isLoggedIn = document.cookie.includes('isLoggedIn=true') || localStorage.getItem("isLoggedIn") === "true"
    const userProfileStr = localStorage.getItem("userProfile")
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null

    debugLog("상태 확인 결과", { isLoggedIn, userProfile })

    return { isLoggedIn, userProfile }
  } catch (error) {
    debugLog("getAuthStatus 에러", error)
    return { isLoggedIn: false, userProfile: null }
  }
}

// 로그인 처리
export const login = async (email: string, password: string) => {
  debugLog("login 함수 호출됨", { email })

  if (typeof window === "undefined") {
    debugLog("서버 사이드에서 login 호출됨 - 무시")
    return
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '로그인에 실패했습니다.')
    }

    // 로그인 상태 저장
    localStorage.setItem("isLoggedIn", "true")
    localStorage.setItem("userProfile", JSON.stringify(data.user))

    // 로그인 상태 변경 이벤트 발생
    window.dispatchEvent(new Event('localStorageChange'))

    debugLog("로그인 성공", data)

    // 페이지 새로고침
    window.location.href = "/"
  } catch (error) {
    debugLog("login 에러", error)
    throw error
  }
}

// 로그아웃
export const logout = async () => {
  debugLog("logout 함수 호출됨")

  if (typeof window === "undefined") {
    debugLog("서버 사이드에서 logout 호출됨 - 무시")
    return
  }

  try {
    // 로컬 스토리지 정리
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userProfile")

    // 로그아웃 API 호출
    await fetch('/api/logout', {
      method: 'POST',
    })

    // 로그인 상태 변경 이벤트 발생
    window.dispatchEvent(new Event('localStorageChange'))

    debugLog("로그아웃 완료")

    // 페이지 새로고침
    window.location.href = "/"
  } catch (error) {
    debugLog("logout 에러", error)
    throw error
  }
}

// SNS 계정 연동
export const connectSNS = (provider: string) => {
  debugLog(`${provider} 계정 연동 시작`)
  alert(`${provider} 계정 연동 기능이 실행됩니다.`)
  return Promise.resolve(true)
}

// 강제 상태 확인 (디버깅용)
export const forceCheckAuth = () => {
  debugLog("강제 상태 확인")
  return getAuthStatus()
}
