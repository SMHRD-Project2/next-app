"use client"

// 디버깅을 위한 로그 함수
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[AUTH] ${message}`, data || "")
  }
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

// SNS 계정 연동 - 팝업 방식으로 변경
export const connectSNS = (provider: string) => {
  debugLog(`${provider} 계정 연동 시작`)
  
  if (typeof window === "undefined") {
    debugLog("서버 사이드에서 connectSNS 호출됨 - 무시")
    return Promise.resolve(false)
  }

  const { userProfile } = getAuthStatus()
  if (!userProfile?.email) {
    alert('로그인이 필요합니다.')
    return Promise.resolve(false)
  }

  // console.log(`[${provider.toUpperCase()}] 연동 시작 - 사용자:`, userProfile.email)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  let authUrl = ''
  const state = encodeURIComponent(userProfile.email) // 사용자 이메일을 state로 전달
  
  switch (provider.toLowerCase()) {
    case 'kakao':
      authUrl = `https://kauth.kakao.com/oauth/authorize?` +
        `client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&` +
        `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/kakao`)}&` +
        `response_type=code&` +
        `scope=profile_nickname&` +
        `state=${state}`
      break
    case 'naver':
      authUrl = `https://nid.naver.com/oauth2.0/authorize?` +
        `client_id=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/naver`)}&` +
        `response_type=code&` +
        `state=${state}`
      break
    case 'google':
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/google`)}&` +
        `response_type=code&` +
        `scope=email profile&` +
        `state=${state}`
      break
    default:
      alert('지원하지 않는 SNS입니다.')
      return Promise.resolve(false)
  }

  // console.log(`[${provider.toUpperCase()}] OAuth URL:`, authUrl)

  // 팝업으로 연동 페이지 열기
  const popup = window.open(
    authUrl,
    `${provider}_connect`,
    'width=500,height=700,scrollbars=yes,resizable=yes'
  )

  if (!popup) {
    alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
    return Promise.resolve(false)
  }

  return new Promise((resolve) => {
    // 팝업에서 메시지 받기
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'SNS_CONNECT_SUCCESS') {
        // console.log(`[${provider.toUpperCase()}] 연동 성공:`, event.data)
        clearInterval(timer)
        window.removeEventListener('message', messageHandler)
        popup.close()
        alert(`${provider} 계정 연동이 완료되었습니다!`)
        resolve(true)
      } else if (event.data.type === 'SNS_CONNECT_ERROR') {
        console.error(`[${provider.toUpperCase()}] 연동 에러:`, event.data.error)
        clearInterval(timer)
        window.removeEventListener('message', messageHandler)
        popup.close()
        alert(`${provider} 계정 연동 중 오류가 발생했습니다: ${event.data.error}`)
        resolve(false)
      }
    }

    window.addEventListener('message', messageHandler)

    // 팝업 상태 감시
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer)
        window.removeEventListener('message', messageHandler)
        // console.log(`[${provider.toUpperCase()}] 연동 팝업이 닫혔습니다.`)
        resolve(false)
      }
    }, 800)
  })
}

// 강제 상태 확인 (디버깅용)
export const forceCheckAuth = () => {
  debugLog("강제 상태 확인")
  return getAuthStatus()
}

function getSupportedMimeType() {
  const types = [
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
    'audio/wav'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'audio/webm'; // 기본값
}

let recorder: MediaRecorder | null = null;

// 녹음 시작
async function handleStartRecording() {
  try {
    recorder = await startRecording();
  } catch (err) {
    console.error('녹음 시작 실패:', err);
  }
}

// 녹음 중지 및 재생
function handleStopRecording() {
  if (recorder) {
    stopRecording(recorder);
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedMimeType();
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(chunks, { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // 오디오 재생 전에 유효성 검사
      const audio = new Audio();
      audio.onerror = (e) => {
        console.error('오디오 로드 오류:', e);
      };
      
      audio.src = audioUrl;
      audio.play().catch(err => {
        console.error('재생 오류:', err);
      });
    };

    // 녹음 시작
    mediaRecorder.start();
    
    // 1초마다 데이터 수집
    mediaRecorder.start(1000);
    
    return mediaRecorder;
  } catch (err) {
    console.error('녹음 시작 오류:', err);
    throw err;
  }
}

// 녹음 중지 함수
function stopRecording(mediaRecorder: MediaRecorder) {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
}
