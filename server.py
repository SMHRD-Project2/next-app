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
import sys
import io
import subprocess

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
        cmd = [
            "ffmpeg",
            "-i", tmp_in_path,
            "-ar", "16000",  # 16kHz 샘플레이트
            "-ac", "1",      # 모노
            "-y",            # 기존 파일 덮어쓰기
            tmp_out_path
        ]
        print(f"[DEBUG] ffmpeg 명령어: {' '.join(cmd)}")
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            error_msg = result.stderr.decode()
            print(f"[ERROR] ffmpeg 변환 실패. 에러: {error_msg}")
            raise RuntimeError(f"ffmpeg 변환 실패: {error_msg}")
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
        cmd = [
            "ffmpeg",
            "-i", tmp_in_path,
            "-ar", "16000",  # 16kHz 샘플레이트
            "-ac", "1",      # 모노
            "-y",            # 기존 파일 덮어쓰기
            tmp_out_path
        ]
        print(f"[DEBUG] ffmpeg 명령어: {' '.join(cmd)}")
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            error_msg = result.stderr.decode()
            print(f"[ERROR] ffmpeg 변환 실패. 에러: {error_msg}")
            raise RuntimeError(f"ffmpeg 변환 실패: {error_msg}")
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





# @app.post("/upload_model")
# async def upload_model(file: UploadFile = File(...)):
#     try:
#         # 250612 박남규 s3 수정: WebM 파일을 임시 저장
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_in:
#             content = await file.read()
#             tmp_in.write(content)
#             tmp_in_path = tmp_in.name

#         # 250612 박남규 s3 수정: .wav 파일로 변환할 경로 생성
#         tmp_out_path = tmp_in_path.replace(".webm", ".wav")

#         # 250612 박남규 s3 수정: ffmpeg를 이용한 변환 수행
#         cmd = [
#             "ffmpeg",
#             "-i", tmp_in_path,
#             "-ar", "16000",  # 16kHz 샘플레이트
#             "-ac", "1",      # 모노
#             "-y",            # 기존 파일 덮어쓰기
#             tmp_out_path
#         ]
#         result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
#         if result.returncode != 0:
#             raise RuntimeError(f"ffmpeg 변환 실패: {result.stderr.decode()}")

#         # 250612 박남규 s3 수정: 고유한 파일 이름 생성
#         unique_filename = f"model/{uuid.uuid4()}.wav"

#         # 250612 박남규 s3 수정: S3에 업로드
#         with open(tmp_out_path, "rb") as wav_file:
#             s3_client.upload_fileobj(
#                 wav_file,
#                 S3_BUCKET_NAME,
#                 unique_filename,
#                 ExtraArgs={"ContentType": "audio/wav"}
#             )

#         # 250612 박남규 s3 수정: S3 URL 생성
#         s3_url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{unique_filename}"

#         return {
#             "success": True,
#             "filename": unique_filename,
#             "url": s3_url  # 250612 박남규 s3 수정
#         }

#     except ClientError as e:
#         print(f"[ERROR] AWS ClientError: {e}")
#         return {"success": False, "error": f"AWS ClientError: {e}"}
#     except NoCredentialsError:
#         print("[ERROR] AWS 인증 오류 발생")
#         return {"success": False, "error": "AWS 인증 오류"}
#     except Exception as e:
#         print(f"[ERROR] 예외 발생: {e}")
#         return {"success": False, "error": str(e)}
#     finally:
#         # 250612 박남규 s3 수정: 임시 파일 정리
#         for path in [locals().get("tmp_in_path"), locals().get("tmp_out_path")]:
#             if path and os.path.exists(path):
#                 os.unlink(path)                


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
    # uvicorn.run(app, host="localhost", port=8000) 
    uvicorn.run(app, host="localhost", port=8000, log_config=None)
