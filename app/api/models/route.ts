import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { NextRequest } from "next/server";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not defined");

const client = new MongoClient(uri);

// 모델 추가
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
    console.error("POST error:", error);
    return NextResponse.json({ error: "Failed to save model" }, { status: 500 });
  } finally {
    await client.close();
  }
}

// 기본 모델 추가
async function addDefaultModels() {
  try {
    await client.connect();
    const db = client.db("ONAIR");
    const collection = db.collection("MODEL");

    // 기존 모델 확인
    const existingModels = await collection.find({ userEmail: "admin@tennyvoice.com" }).toArray();
    console.log("Existing admin models:", existingModels);

    if (existingModels.length === 0) {
      // 기본 모델 추가
      const defaultModels = [
        {
          name: "김주하 아나운서",
          type: "뉴스 앵커",
          quality: "프리미엄",
          description: "정확하고 신뢰감 있는 뉴스 전달 스타일",
          avatar: "/placeholder.svg?height=40&width=40",
          isDefault: true,
          createdAt: new Date().toISOString(),
          usageCount: 156,
          modelUrl: "/audio/SPK005.wav",
          userEmail: "admin@tennyvoice.com"
        },
        {
          name: "이동욱 아나운서",
          type: "스포츠 캐스터",
          quality: "프리미엄",
          description: "역동적이고 열정적인 스포츠 중계 스타일",
          avatar: "/placeholder.svg?height=40&width=40",
          isDefault: false,
          createdAt: new Date().toISOString(),
          usageCount: 89,
          modelUrl: "/audio/SPK006.wav",
          userEmail: "admin@tennyvoice.com"
        },
        {
          name: "박소현 아나운서",
          type: "교양 프로그램",
          quality: "프리미엄",
          description: "부드럽고 친근한 교양 프로그램 진행 스타일",
          avatar: "/placeholder.svg?height=40&width=40",
          isDefault: false,
          createdAt: new Date().toISOString(),
          usageCount: 134,
          modelUrl: "/audio/SPK007.wav",
          userEmail: "admin@tennyvoice.com"
        }
      ];

      const result = await collection.insertMany(defaultModels);
      console.log("Added default models:", result);
    }
  } catch (error) {
    console.error("Error adding default models:", error);
  } finally {
    await client.close();
  }
}

// 모델 전체 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    console.log("Fetching models for email:", email);

    // 기본 모델 추가 확인
    await addDefaultModels();

    await client.connect();
    const db = client.db("ONAIR");
    const collection = db.collection("MODEL");

    let query = {};
    if (email) {
      query = { userEmail: email };
    }
    console.log("MongoDB query:", query);

    const models = await collection.find(query).toArray();
    console.log("Found models:", models);

    // DB 데이터 형식에 맞게 변환
    const formattedModels = models.map(model => ({
      id: model._id.toString(),
      _id: model._id.toString(),
      name: model.name,
      type: model.type,
      quality: model.quality,
      description: model.description,
      avatar: model.avatar || "/placeholder.svg?height=40&width=40",
      isDefault: model.isDefault || false,
      createdAt: model.createdAt,
      usageCount: model.usageCount || 0,
      url: model.modelUrl
    }));

    return NextResponse.json(formattedModels);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  } finally {
    await client.close();
  }
}

// 모델 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await client.connect();
    const db = client.db("ONAIR");
    const collection = db.collection("MODEL");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 });
  } finally {
    await client.close();
  }
}

// 기본 모델 설정 업데이트
export async function PUT(request: Request) {
  try {
    const { userEmail, modelId } = await request.json();
    
    if (!userEmail || !modelId) {
      return NextResponse.json(
        { error: "필수 필드 누락: userEmail, modelId" },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db("ONAIR");
    const collection = db.collection("MODEL");

    // 해당 사용자의 모든 모델의 isDefault를 false로 설정
    await collection.updateMany(
      { userEmail },
      { $set: { isDefault: false } }
    );

    // 선택된 모델만 isDefault를 true로 설정
    const result = await collection.updateOne(
      { _id: new ObjectId(modelId), userEmail },
      { $set: { isDefault: true } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "모델을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "기본 모델이 업데이트되었습니다."
    });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "기본 모델 업데이트 실패" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
