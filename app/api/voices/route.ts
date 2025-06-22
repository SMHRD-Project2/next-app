import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('ONAIR')
    
    //console.log('=== Fetching Voice Data ===')
    
    // 세 명의 아나운서에 대한 음성 데이터를 모두 가져옵니다
    const voices = await db.collection('VOICE').find({
      name: { 
        $in: ['김주하 아나운서', '이동욱 아나운서', '박소현 아나운서'] 
      }
    }).toArray()

    //console.log('Found voices:', voices)

    // 각 아나운서별로 voiceUrl을 매핑합니다
    const formattedVoices = voices.map(voice => {
      //console.log(`Processing voice: ${voice.name}`, voice)
      return {
        ...voice,
        voiceUrl1: voice.name === '김주하 아나운서' ? voice.voiceUrl || voice.url : null,
        voiceUrl2: voice.name === '이동욱 아나운서' ? voice.voiceUrl || voice.url : null,
        voiceUrl3: voice.name === '박소현 아나운서' ? voice.voiceUrl || voice.url : null
      }
    })

    //console.log('Formatted voices:', formattedVoices)
    //console.log('========================')

    return NextResponse.json(formattedVoices)
  } catch (error) {
    console.error('Error fetching voices:', error)
    return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db('ONAIR')
    const body = await request.json()
    
    const result = await db.collection('VOICE').insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create voice record' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db('ONAIR')
    const body = await request.json()
    const { id, ...updateData } = body
    
    const result = await db.collection('VOICE').updateOne(
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
    return NextResponse.json({ error: 'Failed to update voice record' }, { status: 500 })
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
    
    const result = await db.collection('VOICE').deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete voice record' }, { status: 500 })
  }
} 