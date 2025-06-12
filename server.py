#!/usr/bin/env python
# -*- coding: utf-8 -*-

from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
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
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv
import uuid
from botocore.exceptions import ClientError
import time
import logging

# 로거 설정
logger = logging.getLogger("uvicorn")

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
        


@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    try:

        file.file.seek(0)
        sample_data = file.file.read(10)
        print(f"[DEBUG] 파일에서 읽은 샘플 데이터: {sample_data}")
        file.file.seek(0)

        filename = f"recordings/{uuid.uuid4()}.{file.filename.split('.')[-1]}"
        print(f"[DEBUG] S3 저장 경로: {filename}")

        s3_client.upload_fileobj(
            file.file,
            S3_BUCKET_NAME,
            filename,
            ExtraArgs={"ContentType": file.content_type or "application/octet-stream"}
        )

         # 250611 박남규 S3 URL 생성
        s3_url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{filename}"
        print(f"[DEBUG] 접근 가능한 S3 URL: {s3_url}")

        return {"success": True,
                 "filename": filename,
                 "url": s3_url  # 250611 박남규 
                 }

    except ClientError as e:
        print(f"[ERROR] AWS ClientError: {e}")
        return {"success": False, "error": f"AWS ClientError: {e}"}
    except NoCredentialsError:
        print("[ERROR] AWS 인증 오류 발생")
        return {"success": False, "error": "AWS 인증 오류"}
    except Exception as e:
        print(f"[ERROR] 예외 발생: {e}")
        return {"success": False, "error": str(e)}


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
            return FileResponse(output_path, media_type="audio/wav")
            
    except Exception as e:
        logger.error(f"에러 발생: {str(e)}")
        return {"error": str(e)}
    finally:
        # 임시 파일 정리
        if os.path.exists(voice_path):
            os.remove(voice_path)
        if os.path.exists(silence_path):
            os.remove(silence_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000) 