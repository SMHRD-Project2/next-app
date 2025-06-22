import requests
import json
import sseclient
import time
import os

# 서버 설정
BASE_URL = "http://bore.pub"
PORT = "6430"
SERVER_URL = f"{BASE_URL}:{PORT}"

# TTS 설정
MODEL_NAME = "Zyphra/Zonos-v0.1-transformer"
LANGUAGE = "ko"

def set_server_url(url):
    global SERVER_URL
    SERVER_URL = url

def upload_file(file_path, session_hash):
    url = f"{SERVER_URL}/gradio_api/upload?upload_id={session_hash}"
    
    files = {
        "files": (file_path, open(file_path, "rb"), "audio/wav")
    }
    
    headers = {
        "accept": "*/*",
        "Referer": f"{SERVER_URL}/",
    }
    
    response = requests.post(url, files=files, headers=headers)
    #print(f"Upload Status: {response.status_code}")
    #print(f"Upload Response: {response.text}")
    return response.json()[0]  # 리스트의 첫 번째 항목 반환

def call_api(session_hash, audio_path, silence_path, tts_text):
    url = f"{SERVER_URL}/gradio_api/queue/join?"
    
    headers = {
        "accept": "*/*",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "Referer": f"{SERVER_URL}/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }
    
    data = {
        "data": [
            MODEL_NAME,
            tts_text,
            LANGUAGE,
            {
                "path": audio_path,
                "url": f"{SERVER_URL}/gradio_api/file={audio_path}",
                "orig_name": "SPK080KBSCU083M001.wav",
                "size": 673700,
                "mime_type": "audio/wav",
                "meta": {"_type": "gradio.FileData"}
            },
            {
                "path": silence_path,
                "url": f"{SERVER_URL}/gradio_api/file={silence_path}",
                "size": None,
                "orig_name": "silence_100ms.wav",
                "mime_type": None,
                "is_stream": False,
                "meta": {"_type": "gradio.FileData"}
            },
            0.28, 0.05, 0.05, 0.05, 0.05, 0.05,
            0.1, 0.8, 0.78, 24000,
            45, 19.5, 4, False, 2,
            0, 0, 0, 0.5, 0.4, 0,
            420, True,
            ["emotion"]
        ],
        "event_data": None,
        "fn_index": 2,
        "trigger_id": 60,
        "session_hash": session_hash
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(data))
    #print(f"API Status: {response.status_code}")
    #print(f"API Response: {response.text}")
    return response.json()

def wait_for_result(session_hash, timeout=300):
    url = f"{SERVER_URL}/gradio_api/queue/data?session_hash={session_hash}"
    headers = {
        "accept": "text/event-stream",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "Referer": f"{SERVER_URL}/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    }
    
    start_time = time.time()
    last_progress = 0
    
    #print("SSE 대기 시작...")
    while time.time() - start_time < timeout:
        #print("SSE 요청 시도...")
        try:
            with requests.get(url, headers=headers, stream=True) as response:
                #print("SSE 응답 받음")
                client = sseclient.SSEClient(response)
                
                #print("이벤트 처리 시작...")
                for event in client.events():
                    # heartbeat 이벤트는 무시
                    if "heartbeat" in event.data:
                        continue
                        
                    try:
                        data = json.loads(event.data)
                        
                        # 진행률 표시
                        if data.get("msg") == "progress":
                            progress_data = data.get("progress_data", [{}])[0]
                            current_index = progress_data.get("index", 0)
                            total_length = progress_data.get("length", 1)
                            progress = current_index / total_length
                            if progress > last_progress:
                                #print(f"진행률: {progress*100:.1f}%")
                                last_progress = progress
                        
                        # 완료 상태 확인
                        if data.get("msg") == "process_completed":
                            #print("\n=== 변환 완료! ===")
                            output_data = data.get("output", {}).get("data", [])
                            if output_data and isinstance(output_data[0], dict):
                                audio_data = output_data[0]
                                #print("\n오디오 파일 정보:")
                                #print(f"파일 경로: {audio_data.get('path')}")
                                #print(f"URL: {audio_data.get('url')}")
                                #print(f"파일명: {audio_data.get('orig_name')}")
                                #print(f"파일 크기: {audio_data.get('size')}")
                                #print(f"MIME 타입: {audio_data.get('mime_type')}")
                                #print("==================\n")
                                
                                audio_url = audio_data.get("url")
                                if audio_url:
                                    return audio_url
                        
                        # 오류 상태 확인
                        if data.get("msg") == "error":
                            error_msg = data.get("error", "알 수 없는 오류")
                            raise Exception(f"변환 중 오류 발생: {error_msg}")
                        
                    except json.JSONDecodeError as e:
                        #print(f"JSON 파싱 오류: {str(e)}")
                        continue
                    except Exception as e:
                        #print(f"이벤트 처리 중 오류: {str(e)}")
                        continue
                
                #print("이벤트 처리 완료, 0.5초 대기...")
        except Exception as e:
            #print(f"SSE 연결 오류: {str(e)}")
            time.sleep(1)
            continue
            
        time.sleep(0.5)  # 폴링 간격 줄임
    
    raise TimeoutError("결과 대기 시간 초과")

def download_audio(file_url, output_path="output.wav"):
    response = requests.get(file_url)
    if response.status_code == 200:
        with open(output_path, "wb") as f:
            f.write(response.content)
        #print(f"오디오 저장 완료: {output_path}")
        return True
    else:
        #print(f"오디오 다운로드 실패: {response.status_code}")
        return False

if __name__ == "__main__":
    # 실행
    session_hash = "6ldz6p8r96t"

    # 파일 경로 설정
    audio = "C:/Users/smhrd/Desktop/SPK080KBSCU083M001.wav"
    silence_100ms = "C:/Users/smhrd/Desktop/silence_100ms.wav"

    try:
        # 파일 업로드
        audio_path = upload_file(audio, session_hash)
        silence_path = upload_file(silence_100ms, session_hash)

        # API 호출
        api_response = call_api(
            session_hash=session_hash,
            audio_path=audio_path,
            silence_path=silence_path,
            tts_text="텍스트 호출 실패. 조노스점파이 "
        )

        # 결과 대기 및 다운로드
        #print("결과 대기 중...")
        result = wait_for_result(session_hash)
        if result:
            download_audio(result)

    except Exception as e:
        print("")
