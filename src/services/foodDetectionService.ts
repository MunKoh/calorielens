import { FoodItem } from '../components/ResultsDisplay';
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';

// UUID를 사용한 안전한 ID 생성 함수
const generateId = (): string => {
  return uuidv4();
};

// 이미지를 base64로 변환하는 함수 (data URL 포함)
const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String); // data:image/jpeg;base64,... 형태 그대로 반환
    };
    reader.onerror = error => reject(error);
  });
};

// OpenAI 클라이언트 초기화 (ref 폴더 설정 기반)
const initializeOpenAI = () => {
  // ref 폴더의 환경 변수 설정을 참고
  const apiKey = process.env.REACT_APP_CHATAI_PAT || process.env.REACT_APP_OPENAI_API_KEY;
  const apiBase = process.env.REACT_APP_OPENAI_API_BASE || 'https://openai-proxy-apigw-genai.api.linecorp.com/v1';
  const model = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o';
  
  if (!apiKey) {
    throw new Error('AI API 키가 설정되지 않았습니다. REACT_APP_CHATAI_PAT 또는 REACT_APP_OPENAI_API_KEY 환경 변수를 설정해주세요.');
  }

  console.log('OpenAI 설정:', {
    baseURL: apiBase,
    model: model,
    hasApiKey: !!apiKey
  });

  return new OpenAI({
    apiKey: apiKey,
    baseURL: apiBase,
    dangerouslyAllowBrowser: true // 브라우저에서 사용 허용
  });
};

// AI를 사용한 실제 음식 분석
const analyzeWithAI = async (imageFile: File): Promise<FoodItem[]> => {
  const openai = initializeOpenAI();

  try {
    // 이미지를 base64로 변환
    const base64Image = await convertImageToBase64(imageFile);
    
    console.log('AI 분석 시작...');
    
    // ref 폴더 설정을 참고한 모델 사용
    const model = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o';
    
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
      throw new Error('AI 응답이 비어있습니다.');
    }

    console.log('AI 분석 응답:', content);

    // JSON 파싱 개선 - 응답에서 JSON 부분만 추출
    let jsonContent = content.trim();
    
    // 응답에 다른 텍스트가 포함된 경우 JSON 부분만 추출
    const jsonStart = jsonContent.indexOf('[');
    const jsonEnd = jsonContent.lastIndexOf(']') + 1;
    
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      jsonContent = jsonContent.substring(jsonStart, jsonEnd);
    }
    
    console.log('추출된 JSON:', jsonContent);
    
    // JSON 파싱
    const parsedResults = JSON.parse(jsonContent);
    
    // ID 추가하여 FoodItem 형식으로 변환
    const foodItems: FoodItem[] = parsedResults.map((item: any) => ({
      id: generateId(),
      name: item.name,
      calories: item.calories,
      quantity: item.quantity,
      grams: item.grams,
      carbs: item.carbs,
      protein: item.protein,
      fat: item.fat,
      confidence: item.confidence
    }));

    console.log('AI 분석 결과:', foodItems);
    return foodItems;

  } catch (error) {
    console.error('AI 분석 중 오류 발생:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // 더 친화적인 에러 메시지 제공
    if (error instanceof Error) {
      if (error.message.includes('API 키') || error.message.includes('401') || error.message.includes('unauthorized')) {
        throw new Error('AI 서비스 설정이 필요합니다. 관리자에게 문의해주세요.');
      } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        throw new Error('네트워크 연결을 확인해주세요.');
      } else if (error.message.includes('JSON') || error.message.includes('parse') || error.message.includes('SyntaxError')) {
        console.error('JSON 파싱 실패. AI 응답이 올바른 형식이 아닙니다.');
        throw new Error('AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.');
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      }
    }
    
    throw new Error('음식 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
};

// 메인 음식 분석 함수 - AI만 사용
export const analyzeFood = async (imageFile: File): Promise<FoodItem[]> => {
  console.log('음식 분석 시작', imageFile.name, imageFile.size, imageFile.type);
  
  // 파일 타입 확인
  if (!['image/jpeg', 'image/png'].includes(imageFile.type)) {
    console.error('지원하지 않는 파일 형식:', imageFile.type);
    throw new Error('지원하지 않는 파일 형식입니다. JPG 또는 PNG 파일을 업로드해주세요.');
  }
  
  // AI 분석 실행
  console.log('AI 분석 시작...');
  return await analyzeWithAI(imageFile);
};

