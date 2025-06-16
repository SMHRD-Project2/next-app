import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

const client = new MongoClient(uri);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, quality, description, avatar, modelUrl } = body;

    await client.connect();
    const db = client.db("ONAIR");
    const collection = db.collection("model");

    const newModel = {
      name,
      type,
      quality,
      description,
      avatar,
      modelUrl,
      isDefault: false,
      createdAt: new Date().toISOString(),
      usageCount: 0
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
