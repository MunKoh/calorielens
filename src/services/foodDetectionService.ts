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

// 음식 분석을 위한 스마트 패턴 매칭 (AI 없이도 동작)
const analyzeFoodFromFilename = (filename: string): FoodItem[] => {
  const name = filename.toLowerCase();
  
  // 한국 음식 패턴 매칭
  const foodPatterns = [
    // 밥류
    { keywords: ['밥', 'rice', '비빔밥'], name: '비빔밥', calories: 550, carbs: 80, protein: 15, fat: 12 },
    { keywords: ['김치볶음밥', 'kimchi'], name: '김치볶음밥', calories: 450, carbs: 65, protein: 12, fat: 15 },
    { keywords: ['볶음밥', 'fried'], name: '볶음밥', calories: 400, carbs: 60, protein: 10, fat: 12 },
    
    // 면류
    { keywords: ['라면', 'ramen', 'noodle'], name: '라면', calories: 500, carbs: 70, protein: 12, fat: 20 },
    { keywords: ['냉면', 'naengmyeon'], name: '냉면', calories: 350, carbs: 65, protein: 8, fat: 5 },
    { keywords: ['파스타', 'pasta', 'spaghetti'], name: '파스타', calories: 600, carbs: 80, protein: 18, fat: 18 },
    
    // 고기류
    { keywords: ['치킨', 'chicken', '닭'], name: '치킨', calories: 700, carbs: 30, protein: 45, fat: 35 },
    { keywords: ['삼겹살', 'pork', '돼지'], name: '삼겹살', calories: 800, carbs: 5, protein: 40, fat: 65 },
    { keywords: ['불고기', 'bulgogi', '소고기'], name: '불고기', calories: 400, carbs: 15, protein: 35, fat: 20 },
    
    // 기타
    { keywords: ['피자', 'pizza'], name: '피자', calories: 650, carbs: 70, protein: 25, fat: 25 },
    { keywords: ['햄버거', 'burger'], name: '햄버거', calories: 550, carbs: 45, protein: 25, fat: 30 },
    { keywords: ['샐러드', 'salad'], name: '샐러드', calories: 200, carbs: 15, protein: 8, fat: 12 },
    { keywords: ['도시락', 'bento'], name: '도시락', calories: 650, carbs: 85, protein: 20, fat: 18 }
  ];
  
  // 파일명에서 매칭되는 음식 찾기
  for (const pattern of foodPatterns) {
    if (pattern.keywords.some(keyword => name.includes(keyword))) {
      return [{
        id: generateId(),
        name: pattern.name,
        calories: pattern.calories,
        quantity: '1인분',
        grams: 300,
        confidence: 0.85,
        carbs: pattern.carbs,
        protein: pattern.protein,
        fat: pattern.fat
      }];
    }
  }
  
  // 매칭되지 않으면 기본값
  return [{
    id: generateId(),
    name: '혼합 음식',
    calories: 500,
    quantity: '1인분',
    grams: 300,
    confidence: 0.70,
    carbs: 65,
    protein: 15,
    fat: 18
  }];
};

// OpenAI 클라이언트 초기화 (선택적)
const initializeOpenAI = () => {
  // REACT_APP_CHATAI_PAT 환경변수를 OPENAI API 키로 사용
  const apiKey = process.env.REACT_APP_CHATAI_PAT;
  
  if (!apiKey) {
    console.info('OpenAI API 키가 없어서 스마트 패턴 매칭을 사용합니다.');
    return null;
  }

  return new OpenAI({
    apiKey: apiKey,
    baseURL: process.env.REACT_APP_OPENAI_API_BASE,
    dangerouslyAllowBrowser: true
  });
};

// AI를 사용한 실제 음식 분석
const analyzeWithAI = async (imageFile: File): Promise<FoodItem[]> => {
  const openai = initializeOpenAI();
  
  // openai 객체가 null인 경우 처리
  if (!openai) {
    console.error('OpenAI 클라이언트 초기화 실패: API 키가 없거나 잘못되었습니다.');
    throw new Error('API 키 설정이 필요합니다. 관리자에게 문의해주세요.');
  }

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
              text: `모든 음식을 구분하세요. 각 음식의 종류를 구분하세요. 양을 구분하세요. 칼로리와 영양소 (탄수화물, 단백질, 지방)을 분석하세요.\n\n다음 JSON 형식으로 응답해주세요. 응답은 반드시 유효한 JSON 배열이어야 합니다:\n\n[\n  {\n    "name": "음식명",\n    "calories": 칼로리수치(숫자),\n    "quantity": "분량 설명",\n    "grams": 그램수(숫자),\n    "carbs": 탄수화물(숫자),\n    "protein": 단백질(숫자),\n    "fat": 지방(숫자),\n    "confidence": 신뢰도(0-100 숫자)\n  }\n]\n\n주의사항:\n- 한국어로 음식명을 작성해주세요\n- 모든 영양소는 그램 단위로 표시해주세요\n- 여러 음식이 보이면 각각 별도 객체로 분석해주세요\n- 신뢰도는 0-100 사이 숫자로 표시해주세요\n- JSON 외의 다른 텍스트는 포함하지 마세요`
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

