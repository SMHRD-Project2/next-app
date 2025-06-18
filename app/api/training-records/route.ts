import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('ONAIR')
    const records = await db
      .collection('TRAINING_RECORD')
      .find({ email: email })
      .sort({ createdAt: -1 })
      .toArray()
    return NextResponse.json(records)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db('ONAIR')
    const body = await request.json()

    // AI 분석 결과의 모든 데이터를 포함하여 저장
    const recordData = {
      ...body,
      createdAt: new Date(),
      // AI 분석 결과가 있는 경우 추가 필드들 저장
      ...(body.analysisResult && {
        analysisId: body.analysisResult.analysisId,
        overallScore: body.analysisResult.overallScore,
        analysisItems: body.analysisResult.items,
        referenceUrl: body.referenceUrl,
        userRecordingUrl: body.userRecordingUrl,
      }),
      // 기존 scores 필드도 유지 (하위 호환성)
      scores: body.analysisResult || body.scores,
    }

    const result = await db.collection('TRAINING_RECORD').insertOne(recordData)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Training record save error:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    const client = await clientPromise
    const db = client.db('ONAIR')
    const result = await db.collection('TRAINING_RECORD').deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}