import { FoodItem } from '../components/ResultsDisplay';
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


// AI를 사용한 실제 음식 분석 (백엔드 API 호출 방식으로 변경)
const analyzeWithAI = async (imageFile: File): Promise<FoodItem[]> => {
  try {
    // 이미지를 base64로 변환
    const base64Image = await convertImageToBase64(imageFile);
    
    console.log('서버에 AI 분석 요청 시작...');
    
    // 자체 백엔드 API(/api/analyzeImage)에 요청
    const response = await fetch('/api/analyzeImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      // 서버에서 보낸 에러가 JSON 형태인지 확인
      const contentType = response.headers.get('content-type');
      let errorMessage = '서버에서 분석 요청을 처리하는 중 오류가 발생했습니다.';
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        // JSON이 아닌 경우, 텍스트로 에러를 읽음
        errorMessage = await response.text();
      }
      
      console.error('서버 응답 오류:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    const content = result.content;

    if (!content) {
      throw new Error('AI 응답이 비어있습니다.');
    }

    console.log('서버로부터 받은 AI 분석 응답:', content);

    // JSON 파싱 개선 - 응답에서 JSON 부분만 추출
    let jsonContent = content.trim();
    
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

    console.log('최종 분석 결과:', foodItems);
    return foodItems;

  } catch (error) {
    console.error('AI 분석 과정 중 오류 발생:', error);
    
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    
    throw new Error('음식 분석 중 알 수 없는 오류가 발생했습니다.');
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
  console.log('새로운 백엔드 API를 통해 AI 분석 시작...');
  return await analyzeWithAI(imageFile);
};

