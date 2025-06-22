import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not defined");

const client = new MongoClient(uri);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "이메일이 필요합니다." },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db("ONAIR");
    const collection = db.collection("USER");

    const user = await collection.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      isDefault: user.isDefault || null
    });
  } catch (error) {
    //console.error("GET error:", error);
    return NextResponse.json(
      { error: "기본 모델 정보 조회 실패" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function PUT(request: Request) {
  try {
    const { email, modelId } = await request.json();

    if (!email || !modelId) {
      return NextResponse.json(
        { error: "필수 필드 누락: email, modelId" },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db("ONAIR");
    const collection = db.collection("USER");

    const result = await collection.updateOne(
      { email },
      { $set: { isDefault: modelId } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "기본 모델이 업데이트되었습니다.",
      modelId
    });
  } catch (error) {
    //console.error("PUT error:", error);
    return NextResponse.json(
      { error: "기본 모델 업데이트 실패" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
} 