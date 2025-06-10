// app/api/upload/route.ts
import { S3 } from 'aws-sdk';
import formidable, { File } from 'formidable';
import fs from 'fs';
import { NextRequest } from 'next/server';
import { IncomingMessage } from 'http';

export const config = {
    api: {
        bodyParser: false,
    },
};

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION!,
});

function parseForm(req: IncomingMessage): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
    const form = formidable({ multiples: false });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
}

export async function POST(req: NextRequest): Promise<Response> {
    try {
        const { fields, files } = await parseForm(req as unknown as IncomingMessage);
        const file = Array.isArray(files.file)
            ? files.file[0]
            : (files.file as File | undefined);

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
        }


        const fileContent = fs.readFileSync(file.filepath);

        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: `uploads/${file.originalFilename}`,
            Body: fileContent,
            ContentType: file.mimetype ?? 'application/octet-stream',
        };

        const data = await s3.upload(uploadParams).promise();

        return new Response(JSON.stringify({ url: data.Location }), { status: 200 });
    } catch (err: any) {
        console.error('S3 Upload Error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
