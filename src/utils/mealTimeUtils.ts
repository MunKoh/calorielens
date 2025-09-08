export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealTimeInfo {
  type: MealType;
  date: string; // YYYY-MM-DD 형식
  displayName: string;
}

/**
 * 현재 시간을 기준으로 기본 식사 타입을 결정합니다.
 * @returns MealType
 */
export const getDefaultMealType = (): MealType => {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 5 && hour < 11) {
    return 'breakfast'; // 아침: 5시~11시
  } else if (hour >= 11 && hour < 15) {
    return 'lunch'; // 점심: 11시~15시
  } else if (hour >= 15 && hour < 21) {
    return 'dinner'; // 저녁: 15시~21시
  } else {
    return 'snack'; // 간식: 21시~5시
  }
};

/**
 * 식사 타입의 한글 표시명을 반환합니다.
 * @param mealType 식사 타입
 * @returns 한글 표시명
 */
export const getMealTypeDisplayName = (mealType: MealType): string => {
  const displayNames: Record<MealType, string> = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    snack: '간식'
  };
  
  return displayNames[mealType];
};

/**
 * 현재 날짜와 기본 식사 타입 정보를 반환합니다.
 * @returns MealTimeInfo
 */
export const getCurrentMealTimeInfo = (): MealTimeInfo => {
  const now = new Date();
  const type = getDefaultMealType();
  const date = now.toISOString().split('T')[0] || now.toISOString().substring(0, 10); // YYYY-MM-DD 형식
  const displayName = getMealTypeDisplayName(type);
  
  return {
    type,
    date,
    displayName
  };
};

/**
 * 날짜 문자열을 한국어 형식으로 포맷팅합니다.
 * @param dateString YYYY-MM-DD 형식의 날짜 문자열
 * @returns 한국어 형식 날짜 (예: "2025년 1월 15일")
 */
export const formatKoreanDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return `${year}년 ${month}월 ${day}일`;
};

/**
 * 모든 식사 타입 목록을 반환합니다.
 * @returns 식사 타입과 표시명의 배열
 */
export const getAllMealTypes = (): Array<{ value: MealType; label: string }> => {
  return [
    { value: 'breakfast', label: '아침' },
    { value: 'lunch', label: '점심' },
    { value: 'dinner', label: '저녁' },
    { value: 'snack', label: '간식' }
  ];
};