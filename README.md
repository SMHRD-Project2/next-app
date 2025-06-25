# 🎥 태니위니 (TaeniWeeny)

F5‑TTS를 활용한 **발음 트레이닝 & 피드백** 서비스

---

## 🔗 프로젝트 링크

- **GitHub**: [https://github.com/SMHRD-Project2/next-app](https://github.com/SMHRD-Project2/next-app)  
- **배포 (Vercel)**: [https://f5-onair.vercel.app/](https://f5-onair.vercel.app/)

---

## 📌 프로젝트 개요

> **태니위니**는 사용자 음성을 AI 기반 **아나운서 발음 스타일**로 변환하고, 음성 분석과 LLM 피드백을 제공하는 발음 교정 서비스입니다.

1. 사용자 음성 업로드  
2. TTS 보이스 클로닝으로 아나운서 스타일 변형된 음성 생성  
3. 발음·속도·MFCC 등 분석  
4. LLM 기반 피드백  
5. 원본 음성과 변형 음성을 비교 청취

---

## 🧩 주요 기능

### 🎙️ 음성 업로드
- `.mp4`, `.mov`, `.wav` 등 포맷 지원  
- 업로드된 음성은 FastAPI 백엔드로 전송

### ✨ 보이스 클로닝
- 사용자의 목소리를 기반으로 TTS 모델 생성  
- 아나운서 스타일로 재발화된 음성 제공

### 📊 음성 비교 분석
- **발음 정확도** 측정  
- **발화 속도** 분석  
- **MFCC**, **피치**, **강세** 등 음향 특징 분석  
- 결과를 데이터 및 그래프로 시각화

### 📝 LLM 피드백
- AI 언어 모델 기반의 발음 교정 피드백 자동 생성  
- 명확한 발음, 호흡, 억양 등 개선 방향 제시

### 🎧 음성 청취 & 비교
- 사용자 음성과 AI 변형 음성 원클릭 청취 가능  
- 실시간 비교 및 A/B 테스트 형태 제공

### 🔗 텍스트 입력 & 스크립트 매칭
- URL, PDF, TXT 등 다양한 소스로 텍스트 입력  
- 입력한 스크립트와 음성 싱크 매칭 및 분석 가능

### 🔧 터널링 지원
- **Bore**, **ngrok** 사용한 로컬 개발 서버 외부 공개  
- 원활한 테스트 & 데모용 환경 구성

---

## 🛠️ 기술 스택

### Frontend
- **Next.js** + **TypeScript**
- **Tailwind CSS**
- **Recharts** (음향 분석 그래프)

### Backend
- **FastAPI** 기반 API 서버
- **PyTorch 기반 TTS 모델** (보이스 클로닝)
- **LLM 피드백 엔진** (GPT 등)
- **Audio Processing**: MFCC, pitch 분석 라이브러리

### Deployment
- **Vercel**: 프론트엔드 배포  
- **Cloud Storage**: 업로드된 음성 파일 저장  
- **Bore / ngrok**: 로컬 백엔드 터널링 환경
