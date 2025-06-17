import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { NextRequest } from "next/server";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not defined");

const client = new MongoClient(uri);

// 모델 추가
export async function POST(request: Request) {
  const body = await request.json();
  const { userEmail, name, type, quality, description, avatar, modelUrl } = body;

  await client.connect();
  const db = client.db("ONAIR");
  const collection = db.collection("MODEL");

  const newModel = {
    userEmail,
    name,
    type,
    quality,
    description,
    avatar,
    modelUrl,
    createdAt: new Date().toISOString(),
    usageCount: 0
  };

  const result = await collection.insertOne(newModel);
  await client.close();

  return NextResponse.json({
    success: true,
    modelId: result.insertedId
  });
}

// 모델 전체 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  await client.connect();
  const db = client.db("ONAIR");
  const collection = db.collection("MODEL");

  let query = {};
  if (email) {
    query = {
      $or: [
        { userEmail: email },
        { email: email }
      ]
    };
  }

  const models = await collection.find(query).toArray();

  const formattedModels = models.map(model => ({
    id: model._id.toString(),
    _id: model._id.toString(),
    name: model.name,
    type: model.type,
    quality: model.quality,
    description: model.description,
    avatar: model.avatar || "/placeholder.svg?height=40&width=40",
    createdAt: model.createdAt,
    usageCount: model.usageCount || 0,
    url: model.modelUrl || model.url
  }));

  await client.close();
  return NextResponse.json(formattedModels);
}

// 모델 삭제
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return NextResponse.json({ success: false });
  }

  await client.connect();
  const db = client.db("ONAIR");
  const collection = db.collection("MODEL");

  await collection.deleteOne({ _id: new ObjectId(id) });
  await client.close();

  return NextResponse.json({ success: true });
}
