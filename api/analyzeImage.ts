import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Vercel 환경 변수에서 설정값 가져오기
    const apiKey = process.env.CHATAI_PAT;
    const baseURL = process.env.OPENAI_API_BASE;
    const model = process.env.OPENAI_MODEL || 'gpt-4o';

    // API 키와 기본 URL이 설정되었는지 확인
    if (!apiKey || !baseURL) {
      console.error('서버에 API 키 또는 기본 URL이 설정되지 않았습니다.');
      return res.status(500).json({ error: '서버 구성 오류: AI 서비스가 올바르게 설정되지 않았습니다.' });
    }

    // OpenAI 클라이언트 초기화 (서버 측)
    // 초기화를 try 블록 안으로 이동하여 환경 변수 누락 시에도 에러를 잡을 수 있도록 함
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });

    const { image: base64Image } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: '이미지 데이터가 없습니다.' });
    }

    console.log('서버에서 AI 분석 시작...');

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `모든 음식을 구분하세요. 각 음식의 종류를 구분하세요. 양을 구분하세요. 칼로리와 영양소 (탄수화물, 단백질, 지방)을 분석하세요.

다음 JSON 형식으로 응답해주세요. 응답은 반드시 유효한 JSON 배열이어야 합니다:

[
  {
    "name": "음식명",
    "calories": 칼로리수치(숫자),
    "quantity": "분량 설명",
    "grams": 그램수(숫자),
    "carbs": 탄수화물(숫자),
    "protein": 단백질(숫자),
    "fat": 지방(숫자),
    "confidence": 신뢰도(0-100 숫자)
  }
]

주의사항:
- 한국어로 음식명을 작성해주세요
- 모든 영양소는 그램 단위로 표시해주세요
- 여러 음식이 보이면 각각 별도 객체로 분석해주세요
- 신뢰도는 0-100 사이 숫자로 표시해주세요
- JSON 외의 다른 텍스트는 포함하지 마세요`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('AI 응답이 비어있습니다.');
      return res.status(500).json({ error: 'AI로부터 응답을 받지 못했습니다.' });
    }

    console.log('서버에서 받은 AI 응답:', content);

    // 클라이언트로 JSON 내용 직접 전달
    return res.status(200).json({ content });

  } catch (error: any) {
    console.error('서버 AI 분석 중 오류 발생:', error);
    return res.status(500).json({ error: '음식 분석 중 서버에서 오류가 발생했습니다.', details: error.message });
  }
}
