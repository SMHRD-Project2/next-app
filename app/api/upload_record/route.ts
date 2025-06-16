import { S3 } from 'aws-sdk';
import { NextResponse } from "next/server";

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-northeast-2'
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: "Invalid file type. Only audio files are allowed." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const fileName = `recordings/${timestamp}-${file.name}`;

    const uploadParams = {
      Bucket: "tennyvoice",
      Key: fileName,
      Body: Buffer.from(buffer),
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadTime: timestamp.toString(),
        fileType: file.type
      }
    };

    const data = await s3.upload(uploadParams).promise();

    return NextResponse.json({
      success: true,
      fileUrl: data.Location,
      fileName,
      fileType: file.type,
      fileSize: file.size
    });

  } catch (error) {
    console.error("Upload error (record):", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
