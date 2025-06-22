import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db('ONAIR')
    
    // URL에서 type 파라미터 추출
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    //console.log('=== DB Query Details ===')
    //console.log('Requested type:', type)
    
    // type에 따라 필터링하여 무작위 1개 문장 추출
    const [randomSentence] = await db.collection('SENTENCE')
      .aggregate([
        { $match: { type: type } }, // type으로 필터링
        { $sample: { size: 1 } }    // 무작위 1개 선택
      ])
      .toArray()
    
    //console.log('Random sentence:', randomSentence)
    
    if (!randomSentence) {
      return NextResponse.json({ error: `No sentence found for type: ${type}` }, { status: 404 })
    }

    // 문장 데이터와 음성 URL을 매핑
    const response = {
      ...randomSentence,
      voiceUrl1: randomSentence.audioUrl,
      voiceUrl2: randomSentence.audioUrl2,
      voiceUrl3: randomSentence.audioUrl3,
      // 챌린지 문장에 대한 음성 URL 매핑
      challengeAudioUrls: {
        "간장공장공장장": {
          "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(1).wav",
          "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(1).wav",
          "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(1).wav"
        },
        "경찰청철창살": {
          "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(2).wav",
          "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(2).wav",
          "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(2).wav"
        },
        "저기 계신 저 분이 박 법무부 장관이시다": {
          "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(3).wav",
          "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(3).wav",
          "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(3).wav"
        },
        "신라면 라면신라 신라라면 라면라신": {
          "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(4).wav",
          "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(4).wav",
          "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(4).wav"
        },
        "앞집 팥죽은 붉은 팥 팥죽이고 뒷집 콩죽은 검은 콩 콩죽이다": {
          "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(5).wav",
          "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(5).wav",
          "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(5).wav"
        },
        "내가 그린 기린 그림은 목이 긴 기린 그림이고 네가 그린 기린 그림은 목이 짧은 기린 그림이다": {
          "김주하": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO/audio+(6).wav",
          "이동욱": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO2/audio+(6).wav",
          "박소현": "https://tennyvoice.s3.ap-northeast-2.amazonaws.com/CHALL_AUDIO3/audio+(6).wav"
        }
      }
    }
    
    // console.log('Final response:', response)
    // console.log('====================')
    
    return NextResponse.json(response)
  } catch (error) {
    //console.error('Error fetching sentence:', error)
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