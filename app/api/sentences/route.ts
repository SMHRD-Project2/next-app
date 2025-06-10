import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db('ONAIR')
    
    // URL에서 type 파라미터 추출 // 250609 박남규
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    console.log('Requested sentence type:', type) // 디버깅용 로그 // 250609 박남규
    
    // type에 따라 필터링하여 무작위 1개 문장 추출 // 250609 박남규
    const [randomSentence] = await db.collection('SENTENCE')
      .aggregate([
        { $match: { type: type } }, // type으로 필터링
        { $sample: { size: 1 } }    // 무작위 1개 선택
      ])
      .toArray()
    
    // console.log('Found sentence:', randomSentence) // 디버깅용 로그 // 250609 박남규
    
    if (!randomSentence) {
      return NextResponse.json({ error: `No sentence found for type: ${type}` }, { status: 404 })
    }
    
    return NextResponse.json(randomSentence)
  } catch (error) {
    console.error('Error fetching sentence:', error) // 디버깅용 로그 // 250609 박남규
    return NextResponse.json({ error: 'Failed to fetch sentences' }, { status: 500 })
  }
}


export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db('ONAIR')
    const body = await request.json()
    
    const result = await db.collection('SENTENCE').insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create sentence' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db('ONAIR')
    const body = await request.json()
    const { id, ...updateData } = body
    
    const result = await db.collection('SENTENCE').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update sentence' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db('ONAIR')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    
    const result = await db.collection('SENTENCE').deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete sentence' }, { status: 500 })
  }
} 