import { supabase } from './supabaseClient';
import { FoodItem } from '../components/ResultsDisplay';
import { HistoryItem } from '../components/HistoryList';

/**
 * 음식 분석 결과를 Supabase에 저장
 * @param foods 분석된 음식 항목 배열
 * @param imageUrl 이미지 URL
 * @returns 생성된 히스토리 항목 또는 null
 */
export const saveAnalysisToSupabase = async (
  foods: FoodItem[], 
  imageUrl: string
): Promise<HistoryItem | null> => {
  try {
    console.log('Supabase에 분석 결과 저장 시작');
    
    // 총 칼로리 계산
    const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);
    
    // 현재 날짜 및 시간 포맷팅
    const now = new Date();
    const dateString = now.toLocaleString('ko-KR', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // 분석 결과 기록 저장
    const { data: analysis, error: analysisError } = await supabase
      .from('food_analyses')
      .insert({
        image_url: imageUrl,
        total_calories: totalCalories
      })
      .select()
      .single();
    
    if (analysisError) {
      console.error('분석 결과 저장 실패:', analysisError.message);
      return null;
    }
    
    // 개별 음식 항목 저장
    const foodItems = foods.map(food => ({
      analysis_id: analysis.id,
      name: food.name,
      calories: food.calories,
      quantity: food.quantity || '',
      confidence: food.confidence || 0
    }));
    
    const { error: foodsError } = await supabase
      .from('food_items')
      .insert(foodItems);
    
    if (foodsError) {
      console.error('음식 항목 저장 실패:', foodsError.message);
      return null;
    }
    
    // 히스토리 항목 포맷 반환
    const historyItem: HistoryItem = {
      id: analysis.id,
      date: dateString,
      foods: foods,
      totalCalories: totalCalories,
      imageUrl: imageUrl
    };
    
    console.log('Supabase에 분석 결과 저장 완료:', historyItem);
    return historyItem;
    
  } catch (error) {
    console.error('Supabase 저장 중 오류 발생:', error);
    return null;
  }
};

/**
 * Supabase에서 모든 히스토리 항목 조회
 * @returns 히스토리 항목 배열
 */
export const getHistoryFromSupabase = async (): Promise<HistoryItem[]> => {
  try {
    console.log('Supabase에서 히스토리 조회 시작');
    
    // 분석 결과 조회
    const { data: analyses, error: analysesError } = await supabase
      .from('food_analyses')
      .select('*')
      .order('analysis_date', { ascending: false });
    
    if (analysesError) {
      console.error('히스토리 조회 실패:', analysesError.message);
      return [];
    }
    
    if (!analyses || analyses.length === 0) {
      console.log('히스토리가 없습니다.');
      return [];
    }
    
    // 각 분석에 대한 음식 항목 조회
    const historyItems = await Promise.all(
      analyses.map(async (analysis) => {
        const { data: foods, error: foodsError } = await supabase
          .from('food_items')
          .select('*')
          .eq('analysis_id', analysis.id);
        
        if (foodsError) {
          console.error(`분석 ID ${analysis.id}의 음식 항목 조회 실패:`, foodsError.message);
          return null;
        }
        
        // 날짜 포맷팅
        const date = new Date(analysis.analysis_date);
        const dateString = date.toLocaleString('ko-KR', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // FoodItem 형식으로 변환
        const foodItems: FoodItem[] = foods.map(food => ({
          id: food.id || food.id.toString(),
          name: food.name,
          calories: food.calories,
          quantity: food.quantity || '',
          confidence: food.confidence || 0
        }));
        
        // HistoryItem 형식으로 반환
        return {
          id: analysis.id,
          date: dateString,
          foods: foodItems,
          totalCalories: analysis.total_calories,
          imageUrl: analysis.image_url
        };
      })
    );
    
    // null 값 필터링
    const validHistoryItems = historyItems.filter(item => item !== null) as HistoryItem[];
    console.log(`Supabase에서 ${validHistoryItems.length}개의 히스토리 항목 조회 완료`);
    
    return validHistoryItems;
    
  } catch (error) {
    console.error('히스토리 조회 중 오류 발생:', error);
    return [];
  }
};

/**
 * Supabase에서 히스토리 항목 삭제
 * @param id 삭제할 분석 ID
 * @returns 성공 여부
 */
export const deleteHistoryFromSupabase = async (id: string): Promise<boolean> => {
  try {
    console.log(`Supabase에서 히스토리 항목 삭제 시작: ${id}`);
    
    // food_analyses 테이블에서 삭제
    // (food_items는 ON DELETE CASCADE로 자동 삭제)
    const { error } = await supabase
      .from('food_analyses')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('히스토리 삭제 실패:', error.message);
      return false;
    }
    
    console.log(`히스토리 항목 삭제 완료: ${id}`);
    return true;
    
  } catch (error) {
    console.error('히스토리 삭제 중 오류 발생:', error);
    return false;
  }
};

/**
 * Supabase에서 모든 히스토리 항목 삭제
 * @returns 성공 여부
 */
export const clearAllHistoryFromSupabase = async (): Promise<boolean> => {
  try {
    console.log('Supabase에서 모든 히스토리 항목 삭제 시작');
    
    // food_analyses 테이블의 모든 데이터 삭제
    // (food_items는 ON DELETE CASCADE로 자동 삭제)
    const { error } = await supabase
      .from('food_analyses')
      .delete()
      .neq('id', 'none'); // 모든 행 선택
    
    if (error) {
      console.error('모든 히스토리 삭제 실패:', error.message);
      return false;
    }
    
    console.log('모든 히스토리 항목 삭제 완료');
    return true;
    
  } catch (error) {
    console.error('모든 히스토리 삭제 중 오류 발생:', error);
    return false;
  }
};

/**
 * Supabase에서 칼로리 목표 가져오기
 * @returns 칼로리 목표 값
 */
export const getCalorieGoalFromSupabase = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('calorie_goals')
      .select('goal_value')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.log('칼로리 목표 조회 실패 (기본값 2000 사용):', error.message);
      return 2000;
    }
    
    return data ? data.goal_value : 2000;
    
  } catch (error) {
    console.error('칼로리 목표 조회 중 오류 발생:', error);
    return 2000;
  }
};

/**
 * Supabase에 칼로리 목표 저장
 * @param goal 칼로리 목표 값
 * @returns 성공 여부
 */
export const saveCalorieGoalToSupabase = async (goal: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('calorie_goals')
      .insert({ goal_value: goal });
    
    if (error) {
      console.error('칼로리 목표 저장 실패:', error.message);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('칼로리 목표 저장 중 오류 발생:', error);
    return false;
  }
};