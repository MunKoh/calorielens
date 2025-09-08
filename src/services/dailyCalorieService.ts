import { HistoryItem } from '../components/HistoryList';
import { getCalorieGoalFromSupabase, saveCalorieGoalToSupabase } from './supabaseDataService';

// 날짜 인터페이스 정의
export interface DailyCalorieData {
  date: string; // YYYY-MM-DD 형식
  formattedDate: string; // 전체 날짜 형식 (예: '2025년 8월 19일 화요일')
  shortDate: string; // 표시용 짧은 날짜 (예: '8월 19일')
  calories: number;
  carbs: number;      // 탄수화물 총량 (g)
  protein: number;    // 단백질 총량 (g)
  fat: number;        // 지방 총량 (g)
  goal: number;
  percentage: number;
}

// ISO 8601 형식의 날짜 문자열 (예: "2025-08-24T10:30:00.000Z")에서 "YYYY-MM-DD" 부분만 추출합니다.
const getYYYYMMDD = (dateString: string): string => {
  if (!dateString || typeof dateString !== 'string' || dateString.length < 10) {
    // 유효하지 않은 입력값에 대한 방어 코드
    console.error('Invalid date string provided:', dateString);
    // 오늘 날짜를 기본값으로 반환하거나, 특정 에러 문자열을 반환할 수 있습니다.
    return new Date().toISOString().substring(0, 10);
  }
  // ISO 문자열의 날짜 부분만 잘라냅니다.
  return dateString.substring(0, 10);
};

// 모든 히스토리 아이템을 날짜별로 집계하는 함수
export const processAllDailyData = async (historyItems: HistoryItem[]): Promise<DailyCalorieData[]> => {
  if (!historyItems || historyItems.length === 0) {
    return [];
  }

  const goal = await getCalorieGoal();
  
  // 각 날짜별로 칼로리와 영양소를 추적하기 위한 맵
  const dailyDataMap = new Map<string, { calories: number; carbs: number; protein: number; fat: number }>();

  historyItems.forEach(item => {
    // mealDate를 우선적으로 사용하고, 없으면 date에서 추출
    const dateKey = item.mealDate || getYYYYMMDD(item.date);
    const currentData = dailyDataMap.get(dateKey) || { calories: 0, carbs: 0, protein: 0, fat: 0 };
    
    // 총 칼로리 업데이트
    currentData.calories += item.totalCalories;
    
    // 각 음식의 영양소 합산
    item.foods.forEach(food => {
      currentData.carbs += food.carbs || 0;
      currentData.protein += food.protein || 0;
      currentData.fat += food.fat || 0;
    });
    
    dailyDataMap.set(dateKey, currentData);
  });

  const result: DailyCalorieData[] = [];
  
  // Map.entries() 대신 forEach를 사용하여 TypeScript 호환성 문제 해결
  dailyDataMap.forEach((data, date) => {
    // UTC 시간 기준으로 Date 객체 생성
    const d = new Date(`${date}T00:00:00`);
    result.push({
      date: date,
      formattedDate: formatFullDate(d),
      shortDate: formatShortDate(d),
      calories: data.calories,
      carbs: Math.round(data.carbs),     // 소수점 제거
      protein: Math.round(data.protein), // 소수점 제거
      fat: Math.round(data.fat),         // 소수점 제거
      goal,
      percentage: Math.round((data.calories / goal) * 100)
    });
  });

  // 날짜 내림차순으로 정렬 (최신 날짜가 위로)
  return result.sort((a, b) => b.date.localeCompare(a.date));
};


// 오늘의 총 칼로리 섭취량 계산
export const calculateDailyIntake = (historyItems: HistoryItem[]): number => {
  if (!historyItems || historyItems.length === 0) {
    return 0;
  }
  
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식

  const todaysItems = historyItems.filter(item => {
    const itemDateKey = item.mealDate || getYYYYMMDD(item.date);
    return itemDateKey === todayKey;
  });
  
  const total = todaysItems.reduce((total, item) => {
    return total + item.totalCalories;
  }, 0);
  
  return total;
};


// 날짜 포맷팅 함수 (짧은 포맷)
export const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString('ko-KR', { 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Asia/Seoul'
  });
};

// 날짜 포맷팅 함수 (전체 포맷)
export const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul'
  });
};

// Supabase 사용 여부 확인 (기본값은 true로 설정하여 Supabase 우선 사용)
const isSupabaseConfigured = (): boolean => {
  return true; // Supabase를 기본 스토리지로 사용
};

// 목표 칼로리 관리
export const getCalorieGoal = async (): Promise<number> => {
  if (isSupabaseConfigured()) {
    try {
      const goal = await getCalorieGoalFromSupabase();
      localStorage.setItem('calorielens_goal', goal.toString());
      return goal;
    } catch (error) {
      console.error('Supabase에서 칼로리 목표 조회 실패:', error);
      const savedGoal = localStorage.getItem('calorielens_goal');
      return savedGoal ? parseInt(savedGoal, 10) : 2000;
    }
  }
  
  const savedGoal = localStorage.getItem('calorielens_goal');
  return savedGoal ? parseInt(savedGoal, 10) : 2000;
};

export const saveCalorieGoal = async (goal: number): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      await saveCalorieGoalToSupabase(goal);
    } catch (error) {
      console.error('Supabase에 칼로리 목표 저장 실패:', error);
    }
  }
  localStorage.setItem('calorielens_goal', goal.toString());
};
