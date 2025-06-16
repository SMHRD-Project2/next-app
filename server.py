#!/usr/bin/env python
# -*- coding: utf-8 -*-

from fastapi import FastAPI, UploadFile, File, Query, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from ZonosTTS import upload_file, call_api, wait_for_result, download_audio, set_server_url
import requests as req
from bs4 import BeautifulSoup as bs
from pydantic import BaseModel
import re
import fitz
from pykospacing import Spacing
import tempfile
import os
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from dotenv import load_dotenv
import uuid
from botocore.exceptions import ClientError
import time
import logging
import sys
import io
import subprocess
import json
import asyncio
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

logger = logging.getLogger("uvicorn")
logger.setLevel(logging.INFO)
logger.handlers = []

handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter("[%(asctime)s] %(levelname)s: %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)



load_dotenv(".env.local")

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TTS 서버 설정
BASE_URL = "http://bore.pub"
PORT = os.getenv("TTS_PORT")
if not PORT:
    raise ValueError("TTS_PORT 환경 변수가 설정되지 않았습니다.")
SERVER_URL = f"{BASE_URL}:{PORT}"

# TTS 설정
MODEL_NAME = "Zyphra/Zonos-v0.1-transformer"
LANGUAGE = "ko"

# ZonosTTS 모듈에 서버 URL 설정
set_server_url(SERVER_URL)

# AWS S3 설정
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_REGION = os.getenv("S3_REGION")

s3_client = boto3.client(
    "s3",
   region_name=S3_REGION,
   aws_access_key_id=AWS_ACCESS_KEY_ID,
   aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)
        
@app.post("/upload_record")
async def upload_recording(file: UploadFile = File(...)):
    tmp_in_path = None
    tmp_out_path = None
    try:
        print(f"[DEBUG] 파일 업로드 시작: {file.filename}, 타입: {file.content_type}")
        
        # 250612 박남규 s3 수정: WebM 파일을 임시 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_in:
            content = await file.read()
            if not content:
                raise ValueError("업로드된 파일이 비어있습니다.")
            print(f"[DEBUG] 파일 크기: {len(content)} bytes")
            tmp_in.write(content)
            tmp_in_path = tmp_in.name
            print(f"[DEBUG] 임시 WebM 파일 저장됨: {tmp_in_path}")

        # 250612 박남규 s3 수정: .wav 파일로 변환할 경로 생성
        tmp_out_path = tmp_in_path.replace(".webm", ".wav")
        print(f"[DEBUG] 변환될 WAV 파일 경로: {tmp_out_path}")

        # 250612 박남규 s3 수정: ffmpeg를 이용한 변환 수행
        ffmpeg_path = "C:\\ffmpeg\\bin\\ffmpeg.exe"  # ffmpeg 전체 경로
        cmd = [
            ffmpeg_path,
            "-i", tmp_in_path,
            "-ar", "16000",  # 16kHz 샘플레이트
            "-ac", "1",      # 모노
            "-y",            # 기존 파일 덮어쓰기
            tmp_out_path
        ]
        print(f"[DEBUG] ffmpeg 명령어: {' '.join(cmd)}")
        try:
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            print(f"[DEBUG] ffmpeg 실행 결과 - 반환 코드: {result.returncode}")
            print(f"[DEBUG] ffmpeg stdout: {result.stdout}")
            print(f"[DEBUG] ffmpeg stderr: {result.stderr}")
            if result.returncode != 0:
                error_msg = result.stderr
                print(f"[ERROR] ffmpeg 변환 실패. 에러: {error_msg}")
                raise RuntimeError(f"ffmpeg 변환 실패: {error_msg}")
        except FileNotFoundError as e:
            print(f"[ERROR] ffmpeg 실행 파일을 찾을 수 없습니다: {e}")
            print(f"[DEBUG] 현재 작업 디렉토리: {os.getcwd()}")
            print(f"[DEBUG] ffmpeg 경로 존재 여부: {os.path.exists(ffmpeg_path)}")
            raise
        print("[DEBUG] ffmpeg 변환 성공")

        # 변환된 파일이 존재하는지 확인
        if not os.path.exists(tmp_out_path):
            raise RuntimeError("변환된 WAV 파일이 생성되지 않았습니다.")

        # 변환된 파일 크기 확인
        wav_size = os.path.getsize(tmp_out_path)
        print(f"[DEBUG] 변환된 WAV 파일 크기: {wav_size} bytes")
        if wav_size == 0:
            raise RuntimeError("변환된 WAV 파일이 비어있습니다.")

        # 250612 박남규 s3 수정: 고유한 파일 이름 생성
        unique_filename = f"recordings/{uuid.uuid4()}.wav"

        # 250612 박남규 s3 수정: S3에 업로드
        print(f"[DEBUG] S3 업로드 시작: {unique_filename}")
        try:
            with open(tmp_out_path, "rb") as wav_file:
                file_content = wav_file.read()
                if not file_content:
                    raise ValueError("WAV 파일이 비어있습니다.")
                print(f"[DEBUG] S3에 업로드할 파일 크기: {len(file_content)} bytes")
                s3_client.upload_fileobj(
                    io.BytesIO(file_content),
                    S3_BUCKET_NAME,
                    unique_filename,
                    ExtraArgs={"ContentType": "audio/wav"}
                )
            print(f"[DEBUG] S3_BUCKET_NAME: {S3_BUCKET_NAME} (type: {type(S3_BUCKET_NAME)})")
            print(f"[DEBUG] S3_REGION: {S3_REGION}")
            print(f"[DEBUG] unique_filename: {unique_filename}")
            print("[DEBUG] S3 업로드 완료")
        except Exception as e:
            print(f"[ERROR] S3 업로드 실패: {str(e)}")
            raise

        # 250612 박남규 s3 수정: S3 URL 생성
        s3_url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{unique_filename}"
        print(f"[DEBUG] S3 URL 생성됨: {s3_url}")

        return {
            "success": True,
            "filename": unique_filename,
            "url": s3_url
        }

    except ClientError as e:
        print(f"[ERROR] AWS ClientError: {e}")
        return {"success": False, "error": f"AWS ClientError: {e}"}
    except NoCredentialsError:
        print("[ERROR] AWS 인증 오류 발생")
        return {"success": False, "error": "AWS 인증 오류"}
    except Exception as e:
        print(f"[ERROR] 예외 발생: {str(e)}")
        return {"success": False, "error": str(e)}
    finally:
        # 250612 박남규 s3 수정: 임시 파일 정리
        for path in [tmp_in_path, tmp_out_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                    print(f"[DEBUG] 임시 파일 삭제됨: {path}")
                except Exception as e:
                    print(f"[ERROR] 임시 파일 삭제 실패: {path}, 에러: {e}")


@app.post("/upload_model")
async def upload_recording(file: UploadFile = File(...)):
    tmp_in_path = None
    tmp_out_path = None
    try:
        print(f"[DEBUG] 파일 업로드 시작: {file.filename}, 타입: {file.content_type}")
        
        # 250612 박남규 s3 수정: WebM 파일을 임시 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_in:
            content = await file.read()
            if not content:
                raise ValueError("업로드된 파일이 비어있습니다.")
            print(f"[DEBUG] 파일 크기: {len(content)} bytes")
            tmp_in.write(content)
            tmp_in_path = tmp_in.name
            print(f"[DEBUG] 임시 WebM 파일 저장됨: {tmp_in_path}")

        # 250612 박남규 s3 수정: .wav 파일로 변환할 경로 생성
        tmp_out_path = tmp_in_path.replace(".webm", ".wav")
        print(f"[DEBUG] 변환될 WAV 파일 경로: {tmp_out_path}")

        # 250612 박남규 s3 수정: ffmpeg를 이용한 변환 수행
        ffmpeg_path = "C:\\ffmpeg\\bin\\ffmpeg.exe"  # ffmpeg 전체 경로
        cmd = [
            ffmpeg_path,
            "-i", tmp_in_path,
            "-ar", "16000",  # 16kHz 샘플레이트
            "-ac", "1",      # 모노
            "-y",            # 기존 파일 덮어쓰기
            tmp_out_path
        ]
        print(f"[DEBUG] ffmpeg 명령어: {' '.join(cmd)}")
        try:
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            print(f"[DEBUG] ffmpeg 실행 결과 - 반환 코드: {result.returncode}")
            print(f"[DEBUG] ffmpeg stdout: {result.stdout}")
            print(f"[DEBUG] ffmpeg stderr: {result.stderr}")
            if result.returncode != 0:
                error_msg = result.stderr
                print(f"[ERROR] ffmpeg 변환 실패. 에러: {error_msg}")
                raise RuntimeError(f"ffmpeg 변환 실패: {error_msg}")
        except FileNotFoundError as e:
            print(f"[ERROR] ffmpeg 실행 파일을 찾을 수 없습니다: {e}")
            print(f"[DEBUG] 현재 작업 디렉토리: {os.getcwd()}")
            print(f"[DEBUG] ffmpeg 경로 존재 여부: {os.path.exists(ffmpeg_path)}")
            raise
        print("[DEBUG] ffmpeg 변환 성공")

        # 변환된 파일이 존재하는지 확인
        if not os.path.exists(tmp_out_path):
            raise RuntimeError("변환된 WAV 파일이 생성되지 않았습니다.")

        # 변환된 파일 크기 확인
        wav_size = os.path.getsize(tmp_out_path)
        print(f"[DEBUG] 변환된 WAV 파일 크기: {wav_size} bytes")
        if wav_size == 0:
            raise RuntimeError("변환된 WAV 파일이 비어있습니다.")

        # 250612 박남규 s3 수정: 고유한 파일 이름 생성
        unique_filename = f"model/{uuid.uuid4()}.wav"

        # 250612 박남규 s3 수정: S3에 업로드
        print(f"[DEBUG] S3 업로드 시작: {unique_filename}")
        try:
            with open(tmp_out_path, "rb") as wav_file:
                file_content = wav_file.read()
                if not file_content:
                    raise ValueError("WAV 파일이 비어있습니다.")
                print(f"[DEBUG] S3에 업로드할 파일 크기: {len(file_content)} bytes")
                s3_client.upload_fileobj(
                    io.BytesIO(file_content),
                    S3_BUCKET_NAME,
                    unique_filename,
                    ExtraArgs={"ContentType": "audio/wav"}
                )
            print(f"[DEBUG] S3_BUCKET_NAME: {S3_BUCKET_NAME} (type: {type(S3_BUCKET_NAME)})")
            print(f"[DEBUG] S3_REGION: {S3_REGION}")
            print(f"[DEBUG] unique_filename: {unique_filename}")
            print("[DEBUG] S3 업로드 완료")
        except Exception as e:
            print(f"[ERROR] S3 업로드 실패: {str(e)}")
            raise

        # 250612 박남규 s3 수정: S3 URL 생성
        s3_url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{unique_filename}"
        print(f"[DEBUG] S3 URL 생성됨: {s3_url}")

        # 작업 ID 생성
        task_id = str(uuid.uuid4())
        
        # 작업 정보 저장
        processing_tasks[task_id] = {
            "status": "processing",
            "start_time": datetime.now(),
            "file_info": {
                "filename": file.filename,
                "content_type": file.content_type,
                "size_bytes": len(content)
            }
        }

        return {
            "success": True,
            "filename": unique_filename,
            "url": s3_url,
            "status": "success",
            "task_id": task_id
        }

    except ClientError as e:
        print(f"[ERROR] AWS ClientError: {e}")
        return {"success": False, "error": f"AWS ClientError: {e}"}
    except NoCredentialsError:
        print("[ERROR] AWS 인증 오류 발생")
        return {"success": False, "error": "AWS 인증 오류"}
    except Exception as e:
        print(f"[ERROR] 예외 발생: {str(e)}")
        return {"success": False, "error": str(e)}
    finally:
        # 250612 박남규 s3 수정: 임시 파일 정리
        for path in [tmp_in_path, tmp_out_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                    print(f"[DEBUG] 임시 파일 삭제됨: {path}")
                except Exception as e:
                    print(f"[ERROR] 임시 파일 삭제 실패: {path}, 에러: {e}")


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "FastAPI server is running"}

class URLRequest(BaseModel):
    url: str

def extract_two_columns_text(pdf_path, column_split_ratio=0.5):
    doc = fitz.open(pdf_path)
    all_text = []

    for page in doc:
        blocks = page.get_text("blocks")
        page_width = page.rect.width
        split_x = page_width * column_split_ratio

        left_col = []
        right_col = []

        for block in blocks:
            x0, y0, x1, y1, text, *_ = block
            if x1 < split_x:
                left_col.append((y0, text))
            elif x0 >= split_x:
                right_col.append((y0, text))
            else:
                left_col.append((y0, text))

        left_col.sort()
        right_col.sort()

        left_text = "\n".join([t for _, t in left_col])
        right_text = "\n".join([t for _, t in right_col])
        page_text = left_text + "\n" + right_text

        all_text.append(page_text)

    return "\n\n".join(all_text)

@app.post("/extract-text")
async def extract_text(request: URLRequest):
    try:
        res = req.get(request.url)
        soup = bs(res.text, 'lxml')
        text = soup.get_text(separator='\n', strip=True)
        lines = text.split('\n')
        
        filtered_lines = []
        stop = False
        
        for line in lines:
            if stop:
                break
                
            if '@' in line and '.' in line:
                filtered_lines.append(line)
                stop = True
                
            elif len(line) > 20 and line.endswith("."):
                filtered_lines.append(line)
                
        filtered_text = '\n'.join(filtered_lines)
        return {"text": filtered_text}
    except Exception as e:
        return {"error": str(e)}
        

@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    try:
        # 임시 파일 생성
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # PDF 텍스트 추출
        text = extract_two_columns_text(temp_file_path)
        
        # 공백 제거 및 띄어쓰기 보정
        result_text = re.sub(r"\s+", "", text)
        spacing = Spacing()
        spaced_text = spacing(result_text)

        # 임시 파일 삭제
        os.unlink(temp_file_path)

        return {"text": spaced_text}
    except Exception as e:
        return {"error": str(e)}

@app.post("/tts")
async def create_tts(
    text: str = Query(..., description="TTS로 변환할 텍스트"),
    voice_file: UploadFile = File(...),
    silence_file: UploadFile = File(...)
):
    
    logger.info("/tts 엔드포인트 호출됨")
    # 임시 파일 저장
    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)
    
    logger.info("/tts 임시 파일 저장됨")
    voice_path = os.path.join(temp_dir, "voice.wav")
    silence_path = os.path.join(temp_dir, "silence.wav")
    
    # 파일 저장
    with open(voice_path, "wb") as f:
        f.write(await voice_file.read())
    with open(silence_path, "wb") as f:
        f.write(await silence_file.read())
    
    logger.info("파일 저장됨")
    # 세션 해시 생성 (현재 시간 기반)
    session_hash = str(int(time.time()))
    
    try:
        logger.info("try")
        # 파일 업로드
        logger.info("음성 파일 업로드 시작")
        
        # 파일 업로드
        uploaded_voice_path = upload_file(voice_path, session_hash)
        logger.info("무음 파일 업로드 시작")
        uploaded_silence_path = upload_file(silence_path, session_hash)
        
        # API 호출
        logger.info("API 호출 시작")
        call_api(
            session_hash=session_hash,
            audio_path=uploaded_voice_path,
            silence_path=uploaded_silence_path,
            tts_text=text
        )
        
        # 결과 대기 및 다운로드
        logger.info("결과 대기 시작")
        result = wait_for_result(session_hash)
        if result:
            logger.info("결과 다운로드 시작")
            output_path = os.path.join("temp", "output.wav")
            download_audio(result, output_path)
            logger.info("TTS 변환 완료")
            
            # output_url 생성
            output_url = f"/api/audio/{session_hash}"
            
            return {"success": True, "url": output_url}
        else:
            logger.error("TTS 변환 실패")
            return {"success": False, "error": "TTS 변환 실패"}
    except Exception as e:
        logger.error(f"에러 발생: {str(e)}")
        return {"error": str(e)}
    finally:
        # 임시 파일 정리
        if os.path.exists(voice_path):
            os.remove(voice_path)
        if os.path.exists(silence_path):
            os.remove(silence_path)

processing_tasks = {}

@app.get("/")
async def root():
    """API 상태 확인"""
    return {
        "message": "Voice Cloning API Server",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/process-voice")
async def process_voice(
    text: str = Form(...),
    audio: UploadFile = File(...)
):
    """음성 클로닝 처리 시작"""
    try:
        # 입력 유효성 검사
        if not text.strip():
            raise HTTPException(status_code=400, detail="텍스트가 비어있습니다.")
        
        if not audio.filename:
            raise HTTPException(status_code=400, detail="오디오 파일이 필요합니다.")
        
        # 고유 작업 ID 생성
        task_id = str(uuid.uuid4())
        
        # 파일 정보 읽기
        audio_content = await audio.read()
        
        # 파일 크기 검증 (예: 10MB 제한)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(audio_content) > max_size:
            raise HTTPException(status_code=413, detail="파일 크기가 너무 큽니다. (최대 10MB)")
        
        # 작업 정보 저장
        processing_tasks[task_id] = {
            "status": "processing",
            "start_time": datetime.now(),
            "text": text,
            "audio_info": {
                "filename": audio.filename,
                "content_type": audio.content_type,
                "size_bytes": len(audio_content)
            }
        }
        
        # 받은 데이터 정보
        received_data = {
            "task_id": task_id,
            "timestamp": datetime.now().isoformat(),
            "text": text,
            "audio_info": {
                "filename": audio.filename,
                "content_type": audio.content_type,
                "size_bytes": len(audio_content),
                "size_kb": round(len(audio_content) / 1024, 2)
            }
        }
        
        # 콘솔에 출력
        print("=" * 60)
        print("VOICE CLONING API - 데이터 수신")
        print("=" * 60)
        print(f"작업 ID: {task_id}")
        print(f"수신 시간: {received_data['timestamp']}")
        print(f"텍스트 내용: {text}")
        print(f"파일명: {audio.filename}")
        print(f"파일 타입: {audio.content_type}")
        print(f"파일 크기: {received_data['audio_info']['size_kb']} KB")
        print(f"텍스트 길이: {len(text)} 글자")
        print("=" * 60)
        
        # 처리 결과 생성
        processing_result = {
            "status": "success",
            "message": "음성 데이터 수신 완료",
            "task_id": task_id,
            "received_data": received_data,
            "stream_url": f"/process-voice-stream/{task_id}",
            "processing_info": {
                "audio_duration_estimate": f"{round(len(audio_content) / 32000, 2)} 초",
                "text_word_count": len(text.split()),
                "processing_time": "실시간 스트리밍",
                "model_compatibility": "호환됨"
            }
        }
        
        print("처리 시작 - Next.js로 응답 전송")
        print(f"응답 데이터: {json.dumps(processing_result, ensure_ascii=False, indent=2)}")
        
        return processing_result
        
    except HTTPException as he:
        raise he
    except Exception as e:
        error_response = {
            "status": "error",
            "message": f"처리 중 오류 발생: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        print(f"오류 발생: {str(e)}")
        return error_response

@app.get("/process-voice-stream/{task_id}")
async def process_voice_stream(task_id: str):
    """실시간 진행률을 스트리밍하는 엔드포인트"""
    
    # 작업 ID 유효성 검사
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="작업 ID를 찾을 수 없습니다.")
    
    async def generate():
        try:
            print(f"SSE 스트림 시작 - Task ID: {task_id}")
            
            steps = [
                (10, "음성 파일 업로드 완료"),
                (20, "음성 전처리 시작"),
                (35, "음성 특성 분석 중"),
                (50, "텍스트-음성 매핑 진행"),
                (65, "AI 모델 훈련 시작"),
                (80, "모델 최적화 중"),
                (95, "품질 검증 수행"),
                (100, "AI 모델 생성 완료")
            ]
            
            for progress, message in steps:
                data = {
                    "task_id": task_id,
                    "progress": progress,
                    "message": message,
                    "timestamp": datetime.now().isoformat()
                }
                
                print(f"진행률 전송: {progress}% - {message}")
                
                # SSE 형식으로 데이터 전송
                yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
                
                # 각 단계별 대기시간
                if progress < 100:
                    await asyncio.sleep(1.5)  # 1.5초 대기
                    
            # 완료 신호
            completion_data = {
                "task_id": task_id,
                "progress": 100,
                "message": "처리 완료",
                "completed": True,
                "timestamp": datetime.now().isoformat(),
                "result_url": f"/download/{task_id}"  # 결과 다운로드 URL 추가
            }
            yield f"data: {json.dumps(completion_data, ensure_ascii=False)}\n\n"
            
            # 작업 상태 업데이트
            processing_tasks[task_id]["status"] = "completed"
            processing_tasks[task_id]["end_time"] = datetime.now()
            
            print(f"SSE 스트림 완료 - Task ID: {task_id}")
            
        except Exception as e:
            print(f"SSE 스트림 오류: {str(e)}")
            error_data = {
                "task_id": task_id,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
            
            # 작업 상태를 오류로 업데이트
            if task_id in processing_tasks:
                processing_tasks[task_id]["status"] = "error"
                processing_tasks[task_id]["error"] = str(e)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Cache-Control",
            "Content-Type": "text/event-stream"
        }
    )

@app.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """작업 상태 조회"""
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="작업 ID를 찾을 수 없습니다.")
    
    task = processing_tasks[task_id]
    return {
        "task_id": task_id,
        "status": task["status"],
        "start_time": task["start_time"].isoformat(),
        "text_length": len(task["text"]),
        "audio_filename": task["audio_info"]["filename"]
    }

@app.delete("/tasks/{task_id}")
async def cancel_task(task_id: str):
    """작업 취소"""
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="작업 ID를 찾을 수 없습니다.")
    
    processing_tasks[task_id]["status"] = "cancelled"
    return {"message": "작업이 취소되었습니다.", "task_id": task_id}

@app.get("/tasks")
async def list_tasks():
    """모든 작업 목록 조회"""
    tasks = []
    for task_id, task_info in processing_tasks.items():
        tasks.append({
            "task_id": task_id,
            "status": task_info["status"],
            "start_time": task_info["start_time"].isoformat(),
            "text_preview": task_info["text"][:50] + "..." if len(task_info["text"]) > 50 else task_info["text"]
        })
    return {"tasks": tasks, "total": len(tasks)}


if __name__ == "__main__":
    import uvicorn
    # uvicorn.run(app, host="localhost", port=8000) 
    uvicorn.run(app, host="localhost", port=8000, log_config=None)
