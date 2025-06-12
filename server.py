#!/usr/bin/env python
# -*- coding: utf-8 -*-

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 