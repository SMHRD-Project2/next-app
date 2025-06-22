import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/db/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    const client = await clientPromise;
    const db = client.db('ONAIR'); // 몽고DB 데이터베이스명

    // 이메일 중복 확인
    const existingUser = await db.collection('USER').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: '이미 가입된 이메일입니다.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection('USER').insertOne({
        email,
        password: hashedPassword,
        name,
        role: 'user',
        joinedAt: new Date(),
        isDefault: '684ff426ecd8c43e6caf567a'
      });

    return NextResponse.json({ message: '회원가입 성공', userId: result.insertedId }, { status: 201 });
  } catch (error: any) {
    //console.error(error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
