import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

const client = new MongoClient(uri);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, name, type, quality, description, avatar, modelUrl } = body;

    if (!userEmail || !name || !modelUrl) {
      return NextResponse.json(
        { error: "필수 필드 누락: userEmail, name, modelUrl" },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db("ONAIR");
    const collection = db.collection("MODEL");

    const newModel = {
      userEmail,                  // 사용자 이메일 (FK 역할)
      name,                      // 모델 이름
      type,                      // 모델 유형 (예: 개인 맞춤)
      quality,                   // 품질 정보
      description,               // 설명
      avatar,                    // 프로필 이미지
      modelUrl,                  // S3에 업로드된 URL
      isDefault: false,          // 사용자 생성 모델
      createdAt: new Date().toISOString(),
      usageCount: 0              // 사용 횟수 초기값
    };

    const result = await collection.insertOne(newModel);

    return NextResponse.json({
      success: true,
      modelId: result.insertedId
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to save model" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
