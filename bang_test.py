import sys
import os
if os.name == 'nt':  # Windows
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
import asyncio
import uuid
from datetime import datetime

app = FastAPI(title="Voice Cloning API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# 전역 변수로 작업 상태 관리
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
    print("=" * 60)
    print("Voice Cloning API Server 시작")
    print("서버 주소: http://localhost:8000")
    print("API 문서: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000) 