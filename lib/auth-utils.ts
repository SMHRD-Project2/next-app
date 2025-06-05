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
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userProfileStr = localStorage.getItem("userProfile")
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null

    debugLog("localStorage에서 읽은 값", { isLoggedIn, userProfileStr, userProfile })

    return { isLoggedIn, userProfile }
  } catch (error) {
    debugLog("getAuthStatus 에러", error)
    return { isLoggedIn: false, userProfile: null }
  }
}

// 로그인 처리
export const login = (email: string) => {
  debugLog("login 함수 호출됨", { email })

  if (typeof window === "undefined") {
    debugLog("서버 사이드에서 login 호출됨 - 무시")
    return
  }

  try {
    // 로그인 상태 저장
    localStorage.setItem("isLoggedIn", "true")
    const profileData = JSON.stringify({
      name: "사용자",
      email: email,
      image: "/placeholder.svg?height=32&width=32",
    })
    localStorage.setItem("userProfile", profileData)

    debugLog("localStorage에 저장 완료", {
      isLoggedIn: localStorage.getItem("isLoggedIn"),
      userProfile: localStorage.getItem("userProfile"),
    })

    // 즉시 확인
    const verification = getAuthStatus()
    debugLog("저장 후 즉시 확인", verification)

    // 페이지 새로고침
    debugLog("페이지 새로고침 시작")
    setTimeout(() => {
      window.location.href = "/"
    }, 100)
  } catch (error) {
    debugLog("login 에러", error)
    alert("로그인 처리 중 오류가 발생했습니다: " + error)
  }
}

// 로그아웃
// export const logout = () => {
//   debugLog("logout 함수 호출됨")

//   if (typeof window === "undefined") {
//     debugLog("서버 사이드에서 logout 호출됨 - 무시")
//     return
//   }

//   try {
//     // 저장 전 상태 확인
//     debugLog("로그아웃 전 상태", getAuthStatus())

//     // 모든 스토리지 정리
//     localStorage.removeItem("isLoggedIn")
//     localStorage.removeItem("userProfile")
    

//     debugLog("localStorage 삭제 완료", {
//       isLoggedIn: localStorage.getItem("isLoggedIn"),
//       userProfile: localStorage.getItem("userProfile"),
//     })

//     // 즉시 확인
//     const verification = getAuthStatus()
//     debugLog("삭제 후 즉시 확인", verification)

//     // 페이지 새로고침
//     debugLog("페이지 새로고침 시작")
//     window.location.href = "/"
//   } catch (error) {
//     debugLog("logout 에러", error)
//     alert("로그아웃 처리 중 오류가 발생했습니다: " + error)
//   }
// }


export const logout = () => {
  debugLog("logout 함수 호출됨")

  if (typeof window === "undefined") {
    debugLog("서버 사이드에서 logout 호출됨 - 무시")
    return
  }

  try {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userProfile")
    debugLog("localStorage 삭제 완료")
  } catch (error) {
    debugLog("logout 에러", error)
    alert("로그아웃 처리 중 오류가 발생했습니다: " + error)
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
  if (typeof window !== "undefined") {
    debugLog("현재 localStorage 전체 내용", {
      all: { ...localStorage },
      isLoggedIn: localStorage.getItem("isLoggedIn"),
      userProfile: localStorage.getItem("userProfile"),
    })
  }
  return getAuthStatus()
}
