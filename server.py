#!/usr/bin/env python
# -*- coding: utf-8 -*-

from fastapi import FastAPI, UploadFile, File, Query, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from ZonosTTS import upload_file, call_api, wait_for_result, download_audio, set_server_url
from VoiceAnalyzer import Analyzer
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

# OpenAI API 키 설정
# .env.local 파일에 OPENAI_API_KEY=sk-proj-... 추가 필요
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("⚠️  OPENAI_API_KEY 환경 변수가 설정되지 않았습니다!")
    print("📝 .env.local 파일에 다음을 추가하세요:")
else:
    print(f"✅ OpenAI API 키 설정됨 (길이: {len(OPENAI_API_KEY)})")

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://next-app-gilt-one.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],  # Next.js 개발 서버 및 프로덕션
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

# OpenAI API 호출 함수
async def generate_voice_feedback(analysis_result):
    """OpenAI API를 사용하여 음성 분석 결과에 대한 피드백 생성"""
    try:
        logger.info(f"OpenAI API 키 길이: {len(OPENAI_API_KEY) if OPENAI_API_KEY else 0}")
        
        # 분석 결과를 텍스트로 포맷팅
        analysis_text = f"""
분석 항목	점수 (100점 만점)
MFCC (발음 정확도)	{analysis_result.get('mfcc', 0):.2f}
Pitch (음높이)	{analysis_result.get('pitch', 0):.2f}
Energy (음성 강도)	{analysis_result.get('energy', 0):.2f}
Speech-rate (말하기 속도)	{analysis_result.get('speed', 0):.2f}
Formant (모음 정확도)	{analysis_result.get('formant', 0):.2f}
Intonation (억양)	{analysis_result.get('intonation', 0):.2f}
Rhythm (리듬감)	{analysis_result.get('rhythm', 0):.2f}
Pause (휴지 조절)	{analysis_result.get('pause', 0):.2f}
Overall (전체 점수)	{analysis_result.get('total', 0):.2f}
        """

        prompt = f"""
음성 분석 결과를 바탕으로 각 항목별 피드백을 작성해주세요:

{analysis_text}

각 분석 항목별로 한 문장 요약과 2-3 문장의 상세 피드백을 제공해주세요.
점수에 따른 피드백 가이드라인:
- 90점 이상: 매우 우수, 유지 권장
- 80-89점: 우수, 약간의 개선 권장  
- 70-79점: 보통, 꾸준한 연습 필요
- 60-69점: 개선 필요, 집중 연습 권장
- 60점 미만: 많은 개선 필요, 기초 연습 권장

다음 JSON 형식으로만 응답하세요:

{{
  "analysisId": "{str(uuid.uuid4())}",
  "overallScore": {analysis_result.get('total', 0):.2f},
  "items": [
    {{
      "metric": "pronunciation",
      "score": {analysis_result.get('mfcc', 0):.2f},
      "shortFeedback": "MFCC 점수에 따른 한 문장 피드백",
      "detailedFeedback": [
        "첫 번째 상세 피드백",
        "두 번째 상세 피드백"
      ]
    }},
    {{
      "metric": "pitch",
      "score": {analysis_result.get('pitch', 0):.2f},
      "shortFeedback": "Pitch 점수에 따른 한 문장 피드백",
      "detailedFeedback": [
        "첫 번째 상세 피드백",
        "두 번째 상세 피드백"
      ]
    }},
    {{
      "metric": "stress",
      "score": {analysis_result.get('energy', 0):.2f},
      "shortFeedback": "Energy 점수에 따른 한 문장 피드백",
      "detailedFeedback": [
        "첫 번째 상세 피드백",
        "두 번째 상세 피드백"
      ]
    }},
    {{
      "metric": "speed",
      "score": {analysis_result.get('speed', 0):.2f},
      "shortFeedback": "Speech-rate 점수에 따른 한 문장 피드백",
      "detailedFeedback": [
        "첫 번째 상세 피드백",
        "두 번째 상세 피드백"
      ]
    }},
    {{
      "metric": "vowel",
      "score": {analysis_result.get('formant', 0):.2f},
      "shortFeedback": "Formant 점수에 따른 한 문장 피드백",
      "detailedFeedback": [
        "첫 번째 상세 피드백",
        "두 번째 상세 피드백"
      ]
    }},
    {{
      "metric": "intonation",
      "score": {analysis_result.get('intonation', 0):.2f},
      "shortFeedback": "Intonation 점수에 따른 한 문장 피드백",
      "detailedFeedback": [
        "첫 번째 상세 피드백",
        "두 번째 상세 피드백"
      ]
    }},
    {{
      "metric": "rhythm",
      "score": {analysis_result.get('rhythm', 0):.2f},
      "shortFeedback": "Rhythm 점수에 따른 한 문장 피드백",
      "detailedFeedback": [
        "첫 번째 상세 피드백",
        "두 번째 상세 피드백"
      ]
    }},
    {{
      "metric": "pause",
      "score": {analysis_result.get('pause', 0):.2f},
      "shortFeedback": "Pause 점수에 따른 한 문장 피드백",
      "detailedFeedback": [
        "첫 번째 상세 피드백",
        "두 번째 상세 피드백"
      ]
    }}
  ]
}}

한국어로 피드백을 작성하고, 위의 JSON 형식만 반환하세요.
        """

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }

        data = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "당신은 전문적인 음성 분석 전문가입니다. 주어진 음성 분석 결과를 바탕으로 한국어로 실용적이고 건설적인 피드백을 제공합니다. 반드시 유효한 JSON 형식으로만 응답하세요."
                },
                {
                    "role": "user",  
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "max_tokens": 2500
        }

        logger.info("OpenAI API 호출 시작")
        response = req.post("https://api.openai.com/v1/chat/completions", 
                           headers=headers, 
                           json=data, 
                           timeout=60)

        logger.info(f"OpenAI API 응답 상태 코드: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"OpenAI API 오류: {response.status_code}")
            logger.error(f"응답 내용: {response.text}")
            return None

        result = response.json()
        feedback_content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        logger.info(f"OpenAI 원본 응답 길이: {len(feedback_content)}")
        logger.info(f"OpenAI 원본 응답 일부: {feedback_content[:200]}...")
        
        # JSON 파싱 시도
        try:
            # 응답에서 JSON 부분만 추출 (```json 태그 제거)
            if "```json" in feedback_content:
                feedback_content = feedback_content.split("```json")[1].split("```")[0].strip()
            elif "```" in feedback_content:
                feedback_content = feedback_content.split("```")[1].split("```")[0].strip()
            
            feedback_json = json.loads(feedback_content)
            logger.info("OpenAI JSON 파싱 성공")
            return feedback_json
            
        except json.JSONDecodeError as e:
            logger.error(f"OpenAI 응답 JSON 파싱 오류: {e}")
            logger.error(f"파싱 시도한 내용: {feedback_content}")
            return None

    except Exception as e:
        logger.error(f"OpenAI API 호출 중 오류: {str(e)}")
        import traceback
        logger.error(f"상세 오류: {traceback.format_exc()}")
        return None

def create_fallback_feedback(analysis_result):
    """OpenAI API를 사용할 수 없을 때 기본 피드백 생성"""
    analysis_id = str(uuid.uuid4())
    overall_score = analysis_result.get('total', 0)
    
    # 기본 피드백 템플릿
    def get_basic_feedback(metric, score):
        if score >= 90:
            return "매우 우수한 수준입니다.", ["발음이 정확하고 자연스럽습니다.", "현재 수준을 유지하시면 됩니다."]
        elif score >= 80:
            return "우수한 수준입니다.", ["전반적으로 좋은 발음을 보여주고 있습니다.", "조금 더 연습하면 완벽해질 것 같습니다."]
        elif score >= 70:
            return "보통 수준입니다.", ["기본적인 발음은 갖추고 있습니다.", "꾸준한 연습을 통해 개선할 수 있습니다."]
        elif score >= 60:
            return "개선이 필요합니다.", ["발음에 다소 부족한 부분이 있습니다.", "집중적인 연습이 필요합니다."]
        else:
            return "많은 개선이 필요합니다.", ["발음 개선을 위한 기초 연습이 필요합니다.", "전문가의 도움을 받는 것을 권장합니다."]
    
    metrics = [
        ("pronunciation", analysis_result.get('mfcc', 0)),
        ("pitch", analysis_result.get('pitch', 0)),
        ("stress", analysis_result.get('energy', 0)),
        ("speed", analysis_result.get('speed', 0)),
        ("vowel", analysis_result.get('formant', 0)),
        ("intonation", analysis_result.get('intonation', 0)),
        ("rhythm", analysis_result.get('rhythm', 0)),
        ("pause", analysis_result.get('pause', 0))
    ]
    
    items = []
    for metric, score in metrics:
        short_feedback, detailed_feedback = get_basic_feedback(metric, score)
        items.append({
            "metric": metric,
            "score": round(score, 2),
            "shortFeedback": short_feedback,
            "detailedFeedback": detailed_feedback
        })
    
    return {
        "analysisId": analysis_id,
        "overallScore": round(overall_score, 2),
        "items": items
    }



# 음성 분석 요청 모델
class VoiceAnalysisRequest(BaseModel):
    reference_url: str  # AI 아나운서 음성 파일 URL
    user_url: str       # 사용자 녹음 파일 URL

# 음성 분석 API 엔드포인트
@app.post("/analyze-voice")
async def analyze_voice(request: VoiceAnalysisRequest):
    """음성 분석 API - 레퍼런스 음성과 사용자 음성을 비교 분석"""
    temp_ref_path = None
    temp_user_path = None
    
    try:
        logger.info(f"음성 분석 시작 - 레퍼런스: {request.reference_url}, 사용자: {request.user_url}")
        
        # 임시 디렉토리 생성
        temp_dir = "temp"
        os.makedirs(temp_dir, exist_ok=True)
        
        # 레퍼런스 음성 파일 다운로드
        ref_response = req.get(request.reference_url)
        if ref_response.status_code != 200:
            raise HTTPException(status_code=400, detail="레퍼런스 음성 파일을 다운로드할 수 없습니다.")
        
        temp_ref_path = os.path.join(temp_dir, f"ref_{uuid.uuid4()}.wav")
        with open(temp_ref_path, "wb") as f:
            f.write(ref_response.content)
        
        # 사용자 음성 파일 다운로드
        user_response = req.get(request.user_url)
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="사용자 음성 파일을 다운로드할 수 없습니다.")
        
        temp_user_path = os.path.join(temp_dir, f"user_{uuid.uuid4()}.wav")
        with open(temp_user_path, "wb") as f:
            f.write(user_response.content)
        
        logger.info(f"음성 파일 다운로드 완료 - 레퍼런스: {temp_ref_path}, 사용자: {temp_user_path}")
        
        # 음성 분석 실행
        analyzer = Analyzer(temp_ref_path, temp_user_path)
        result = analyzer.run()
        
        logger.info("음성 분석 완료")
        logger.info(f"분석 결과: {result}")
        
        # OpenAI 피드백 생성
        feedback = None
        if OPENAI_API_KEY:
            logger.info("OpenAI 피드백 생성 시작")
            feedback = await generate_voice_feedback(result)
            if feedback:
                logger.info("OpenAI 피드백 생성 완료")
            else:
                logger.error("OpenAI 피드백 생성 실패 - API 호출 재시도 없이 오류 반환")
                # 기본 피드백 대신 오류 메시지 포함하여 반환
                return {
                    "success": False,
                    "error": "OpenAI 피드백 생성에 실패했습니다. API 키나 네트워크 연결을 확인해주세요.",
                    "analysis_result": result,
                    "timestamp": datetime.now().isoformat()
                }
        else:
            logger.error("OpenAI API 키가 설정되지 않았습니다.")
            return {
                "success": False,
                "error": "OpenAI API 키가 설정되지 않았습니다. 환경변수 OPENAI_API_KEY를 확인해주세요.",
                "analysis_result": result,
                "timestamp": datetime.now().isoformat()
            }
        
        response_data = {
            "success": True,
            "analysis_result": result,
            "ai_feedback": feedback,
            "timestamp": datetime.now().isoformat(),
            "files": {
                "reference_url": request.reference_url,
                "user_url": request.user_url
            }
        }
        
        return response_data
        
    except Exception as e:
        logger.error(f"음성 분석 중 오류 발생: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
    
    finally:
        # 임시 파일 정리
        for path in [temp_ref_path, temp_user_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                    logger.info(f"임시 파일 삭제: {path}")
                except Exception as e:
                    logger.error(f"임시 파일 삭제 실패: {path}, 에러: {e}")




@app.post("/upload_record")
async def upload_recording(file: UploadFile = File(...)):
    tmp_in_path = None
    tmp_out_path = None
    try:
        print(f"[DEBUG] 파일 업로드 시작: {file.filename}, 타입: {file.content_type}")
        
        # 파일 확장자 확인
        file_extension = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        is_wav_file = file_extension == ".wav"
        is_webm_file = file_extension == ".webm"
        
        print(f"[DEBUG] 파일 확장자: {file_extension}")
        print(f"[DEBUG] WAV 파일 여부: {is_wav_file}")
        print(f"[DEBUG] WebM 파일 여부: {is_webm_file}")
        
        if not is_wav_file and not is_webm_file:
            raise ValueError("지원하지 않는 파일 형식입니다. WAV 또는 WebM 파일만 업로드 가능합니다.")
        
        # 파일을 임시 저장
        if is_wav_file:
            # WAV 파일인 경우 바로 임시 저장
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_in:
                content = await file.read()
                if not content:
                    raise ValueError("업로드된 파일이 비어있습니다.")
                print(f"[DEBUG] 파일 크기: {len(content)} bytes")
                tmp_in.write(content)
                tmp_in_path = tmp_in.name
                tmp_out_path = tmp_in_path  # WAV 파일은 변환하지 않으므로 같은 경로 사용
                print(f"[DEBUG] 임시 WAV 파일 저장됨: {tmp_in_path}")
        else:
            # WebM 파일인 경우 기존 로직 사용
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_in:
                content = await file.read()
                if not content:
                    raise ValueError("업로드된 파일이 비어있습니다.")
                print(f"[DEBUG] 파일 크기: {len(content)} bytes")
                tmp_in.write(content)
                tmp_in_path = tmp_in.name
                print(f"[DEBUG] 임시 WebM 파일 저장됨: {tmp_in_path}")

            # WebM 파일을 WAV로 변환할 경로 생성
            tmp_out_path = tmp_in_path.replace(".webm", ".wav")
            print(f"[DEBUG] 변환될 WAV 파일 경로: {tmp_out_path}")

            # ffmpeg를 이용한 변환 수행
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
            raise RuntimeError("WAV 파일이 생성되지 않았습니다.")

        # 변환된 파일 크기 확인
        wav_size = os.path.getsize(tmp_out_path)
        print(f"[DEBUG] WAV 파일 크기: {wav_size} bytes")
        if wav_size == 0:
            raise RuntimeError("WAV 파일이 비어있습니다.")

        # 고유한 파일 이름 생성
        unique_filename = f"recordings/{uuid.uuid4()}.wav"

        # S3에 업로드
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

        # S3 URL 생성
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
        # 임시 파일 정리
        for path in [tmp_in_path, tmp_out_path]:
            if path and os.path.exists(path) and path != tmp_in_path:  # tmp_in_path와 tmp_out_path가 같은 경우 중복 삭제 방지
                try:
                    os.unlink(path)
                    print(f"[DEBUG] 임시 파일 삭제됨: {path}")
                except Exception as e:
                    print(f"[ERROR] 임시 파일 삭제 실패: {path}, 에러: {e}")
        # tmp_in_path가 tmp_out_path와 다른 경우에만 삭제
        if tmp_in_path and tmp_in_path != tmp_out_path and os.path.exists(tmp_in_path):
            try:
                os.unlink(tmp_in_path)
                print(f"[DEBUG] 임시 파일 삭제됨: {tmp_in_path}")
            except Exception as e:
                print(f"[ERROR] 임시 파일 삭제 실패: {tmp_in_path}, 에러: {e}")


@app.post("/upload_model")
async def upload_recording(file: UploadFile = File(...)):
    tmp_in_path = None
    tmp_out_path = None
    try:
        print(f"[DEBUG] 파일 업로드 시작: {file.filename}, 타입: {file.content_type}")
        
        # 파일 확장자 확인
        file_extension = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        is_wav_file = file_extension == ".wav"
        is_webm_file = file_extension == ".webm"
        
        print(f"[DEBUG] 파일 확장자: {file_extension}")
        print(f"[DEBUG] WAV 파일 여부: {is_wav_file}")
        print(f"[DEBUG] WebM 파일 여부: {is_webm_file}")
        
        if not is_wav_file and not is_webm_file:
            raise ValueError("지원하지 않는 파일 형식입니다. WAV 또는 WebM 파일만 업로드 가능합니다.")
        
        # 파일을 임시 저장
        if is_wav_file:
            # WAV 파일인 경우 바로 임시 저장
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_in:
                content = await file.read()
                if not content:
                    raise ValueError("업로드된 파일이 비어있습니다.")
                print(f"[DEBUG] 파일 크기: {len(content)} bytes")
                tmp_in.write(content)
                tmp_in_path = tmp_in.name
                tmp_out_path = tmp_in_path  # WAV 파일은 변환하지 않으므로 같은 경로 사용
                print(f"[DEBUG] 임시 WAV 파일 저장됨: {tmp_in_path}")
        else:
            # WebM 파일인 경우 기존 로직 사용
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_in:
                content = await file.read()
                if not content:
                    raise ValueError("업로드된 파일이 비어있습니다.")
                print(f"[DEBUG] 파일 크기: {len(content)} bytes")
                tmp_in.write(content)
                tmp_in_path = tmp_in.name
                print(f"[DEBUG] 임시 WebM 파일 저장됨: {tmp_in_path}")

            # WebM 파일을 WAV로 변환할 경로 생성
            tmp_out_path = tmp_in_path.replace(".webm", ".wav")
            print(f"[DEBUG] 변환될 WAV 파일 경로: {tmp_out_path}")

            # ffmpeg를 이용한 변환 수행
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
            raise RuntimeError("WAV 파일이 생성되지 않았습니다.")

        # 변환된 파일 크기 확인
        wav_size = os.path.getsize(tmp_out_path)
        print(f"[DEBUG] WAV 파일 크기: {wav_size} bytes")
        if wav_size == 0:
            raise RuntimeError("WAV 파일이 비어있습니다.")

        # 고유한 파일 이름 생성
        unique_filename = f"model/{uuid.uuid4()}.wav"

        # S3에 업로드
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

        # S3 URL 생성
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
        # 임시 파일 정리
        for path in [tmp_in_path, tmp_out_path]:
            if path and os.path.exists(path) and path != tmp_in_path:  # tmp_in_path와 tmp_out_path가 같은 경우 중복 삭제 방지
                try:
                    os.unlink(path)
                    print(f"[DEBUG] 임시 파일 삭제됨: {path}")
                except Exception as e:
                    print(f"[ERROR] 임시 파일 삭제 실패: {path}, 에러: {e}")
        # tmp_in_path가 tmp_out_path와 다른 경우에만 삭제
        if tmp_in_path and tmp_in_path != tmp_out_path and os.path.exists(tmp_in_path):
            try:
                os.unlink(tmp_in_path)
                print(f"[DEBUG] 임시 파일 삭제됨: {tmp_in_path}")
            except Exception as e:
                print(f"[ERROR] 임시 파일 삭제 실패: {tmp_in_path}, 에러: {e}")


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
            
            # output.wav 파일을 S3에 업로드
            try:
                logger.info("output.wav 파일 S3 업로드 시작")
                
                # 고유한 파일 이름 생성
                unique_filename = f"tts_output/{uuid.uuid4()}.wav"
                
                # S3에 업로드
                with open(output_path, "rb") as wav_file:
                    file_content = wav_file.read()
                    if not file_content:
                        raise ValueError("output.wav 파일이 비어있습니다.")
                    logger.info(f"S3에 업로드할 파일 크기: {len(file_content)} bytes")
                    s3_client.upload_fileobj(
                        io.BytesIO(file_content),
                        S3_BUCKET_NAME,
                        unique_filename,
                        ExtraArgs={"ContentType": "audio/wav"}
                    )
                
                # S3 URL 생성
                s3_url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{unique_filename}"
                logger.info(f"TTS 결과 S3 업로드 완료: {s3_url}")
                
                return {"success": True, "url": s3_url}
                
            except Exception as e:
                logger.error(f"output.wav S3 업로드 실패: {str(e)}")
                return {"success": False, "error": f"S3 업로드 실패: {str(e)}"}
            finally:
                # output.wav 파일 정리
                if os.path.exists(output_path):
                    try:
                        os.remove(output_path)
                        logger.info("output.wav 임시 파일 삭제됨")
                    except Exception as e:
                        logger.error(f"output.wav 파일 삭제 실패: {e}")
        else:
            logger.error("TTS 변환 실패")
            return {"success": False, "error": "TTS 변환 실패"}
    except Exception as e:
        logger.error(f"에러 발생: {str(e)}")
        return {"error": str(e)}

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
