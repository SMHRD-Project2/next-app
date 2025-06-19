const API_BASE_URL = process.env.NEXT_PUBLIC_PY_URL ;

export async function extractTextFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/extract-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('텍스트 추출에 실패했습니다.');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('API 호출 중 오류 발생:', error);
    throw error;
  }
}

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/extract-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('PDF 텍스트 추출에 실패했습니다.');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('PDF 처리 중 오류 발생:', error);
    throw error;
  }
} 