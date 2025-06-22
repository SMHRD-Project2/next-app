import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/db/mongodb';
import bcrypt from 'bcryptjs';
import {cookies} from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const client = await clientPromise;
    const db = client.db('ONAIR');

    const user = await db.collection('USER').findOne({ email });

    if (!user) {
      return NextResponse.json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: '이메일 또는 비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }
    // 쿠키에 로그인 상태 저장
    const cookieStore = await cookies()
    cookieStore.set('isLoggedIn', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1주일
    })

    // 필요한 경우 JWT 발급 후 전달 (여기서는 생략)

    return NextResponse.json({
      message: '로그인 성공',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    //console.error(error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
