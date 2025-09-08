import { supabase } from './supabaseClient';
import { FoodItem } from '../components/ResultsDisplay';
import { HistoryItem } from '../components/HistoryList';
import { MealType } from '../utils/mealTimeUtils';

/**
 * 음식 분석 결과를 Supabase에 저장
 * @param foods 분석된 음식 항목 배열
 * @param imageUrl 이미지 URL
 * @param mealType 식사 타입
 * @param mealDate 식사 날짜 (YYYY-MM-DD)
 * @returns 생성된 히스토리 항목 또는 null
 */
export const saveAnalysisToSupabase = async (
  foods: FoodItem[], 
  imageUrl: string,
  mealType: MealType,
  mealDate: string
): Promise<HistoryItem | null> => {
  try {
    console.log('Supabase에 분석 결과 저장 시작');
    
    const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);
    
    // 1. 분석 결과 기록 저장 (analysis_date는 DB에서 now()로 자동 생성)
    // 옵셔널 처리로 백워드 호환성 확보
    const insertData: any = {
      image_url: imageUrl,
      total_calories: totalCalories,
    };
    
    // meal_type과 meal_date는 옵셔널로 처리
    if (mealType) insertData.meal_type = mealType;
    if (mealDate) insertData.meal_date = mealDate;
    
    const { data: analysis, error: analysisError } = await supabase
      .from('food_analyses')
      .insert(insertData)
      .select()
      .single();
      
    if (analysisError) {
      console.error('분석 결과 저장 실패:', analysisError.message);
      throw new Error(`분석 결과 저장 실패: ${analysisError.message}`);
    }

    if (!analysis || !analysis.id) {
      console.error('분석 결과 저장 실패: 분석 ID가 생성되지 않았습니다.');
      throw new Error('분석 결과 저장 실패: 분석 ID가 생성되지 않았습니다.');
    }

    // 2. 개별 음식 항목 저장 (영양소 정보 포함)
    const foodItemsToInsert = foods.map(food => ({
      analysis_id: analysis.id,
      name: food.name,
      calories: food.calories,
      quantity: food.quantity || '',
      grams: food.grams || 0,
      carbs: food.carbs || 0,
      protein: food.protein || 0,
      fat: food.fat || 0,
      confidence: food.confidence || 0,
    }));

    // 삽입 전에 로그에 삽입할 데이터 출력 (디버깅용)
    console.log('삽입할 음식 항목:', JSON.stringify(foodItemsToInsert));

    const { error: foodsError } = await supabase
      .from('food_items')
      .insert(foodItemsToInsert);

    if (foodsError) {
      console.error('음식 항목 저장 실패:', foodsError.message);
      // 롤백: 방금 삽입한 분석 결과 삭제
      await supabase.from('food_analyses').delete().eq('id', analysis.id);
      throw new Error(`음식 항목 저장 실패: ${foodsError.message}`);
    }

    // 3. 반환할 히스토리 항목 포맷
    const historyItem: HistoryItem = {
      id: analysis.id,
      date: analysis.analysis_date, // DB에서 생성된 ISO 8601 형식 날짜 사용
      mealType: mealType,
      mealDate: mealDate,
      foods: foods,
      totalCalories: totalCalories,
      imageUrl: imageUrl,
    };

    console.log('Supabase에 분석 결과 저장 완료:', historyItem);
    return historyItem;

  } catch (error) {
    console.error('Supabase 저장 중 오류 발생:', error);
    return null;
  }
};

/**
 * Supabase에서 모든 히스토리 항목과 관련 음식 정보를 함께 조회
 * @returns 히스토리 항목 배열
 */
export const getHistoryFromSupabase = async (): Promise<HistoryItem[]> => {
  try {
    console.log('Supabase에서 히스토리 및 관련 음식 항목 동시 조회 시작');

    // 1. 단일 쿼리로 food_analyses와 관련 food_items를 함께 조회합니다. (영양소 정보 포함)
    const { data: analyses, error } = await supabase
      .from('food_analyses')
      .select(`
        id,
        analysis_date,
        total_calories,
        image_url,
        meal_type,
        meal_date,
        food_items (
          id, 
          name, 
          calories, 
          quantity, 
          grams,
          carbs,
          protein,
          fat,
          confidence
        )
      `)
      .order('analysis_date', { ascending: false });

    if (error) {
      console.error('히스토리 동시 조회 실패:', error.message);
      
      // meal_type 컬럼 관련 오류인 경우 fallback 쿼리 사용
      if (error.message?.includes('meal_type') || error.message?.includes('meal_date')) {
        console.warn('새 컬럼을 찾을 수 없어 기본 쿼리를 사용합니다.');
        const { data: fallbackAnalyses, error: fallbackError } = await supabase
          .from('food_analyses')
          .select(`
            id,
            analysis_date,
            total_calories,
            image_url,
            food_items (
              id, 
              name, 
              calories, 
              quantity, 
              grams,
              carbs,
              protein,
              fat,
              confidence
            )
          `)
          .order('analysis_date', { ascending: false });
          
        if (fallbackError) {
          console.error('기본 쿼리도 실패:', fallbackError.message);
          throw fallbackError;
        }
        
        // 기본값으로 처리
        const historyItems: HistoryItem[] = (fallbackAnalyses || []).map(analysis => {
          const foodItems: FoodItem[] = (analysis.food_items || []).map(food => ({
            id: food.id.toString(),
            name: food.name,
            calories: food.calories,
            quantity: food.quantity || '',
            grams: food.grams || 0,
            carbs: food.carbs || 0,
            protein: food.protein || 0,
            fat: food.fat || 0,
            confidence: food.confidence || 0,
          }));
    
          return {
            id: analysis.id,
            date: analysis.analysis_date,
            mealType: 'breakfast' as MealType,
            mealDate: analysis.analysis_date.split('T')[0],
            foods: foodItems,
            totalCalories: analysis.total_calories,
            imageUrl: analysis.image_url,
          };
        });
        
        return historyItems;
      }
      
      throw error;
    }

    if (!analyses || analyses.length === 0) {
      return [];
    }

    // 2. 조회된 데이터를 HistoryItem[] 형태로 변환합니다.
    const historyItems: HistoryItem[] = analyses.map(analysis => {
      // 디버깅 정보 추가
      console.log(`분석 ID ${analysis.id}의 음식 항목 수: ${(analysis.food_items || []).length}`);
      
      const foodItems: FoodItem[] = (analysis.food_items || []).map(food => ({
        id: food.id.toString(),
        name: food.name,
        calories: food.calories,
        quantity: food.quantity || '',
        grams: food.grams || 0,
        carbs: food.carbs || 0,
        protein: food.protein || 0,
        fat: food.fat || 0,
        confidence: food.confidence || 0,
      }));

      return {
        id: analysis.id,
        date: analysis.analysis_date,
        mealType: analysis.meal_type || 'breakfast',
        mealDate: analysis.meal_date || analysis.analysis_date.split('T')[0],
        foods: foodItems, // 이제 여기에 항상 완전한 상세 정보가 포함됩니다.
        totalCalories: analysis.total_calories,
        imageUrl: analysis.image_url,
      };
    });

    console.log(`Supabase에서 ${historyItems.length}개의 히스토리 항목을 성공적으로 조회했습니다.`);
    // 첫 번째 항목의 음식 정보 로깅 (디버깅용)
    const firstItem = historyItems[0];
    if (historyItems.length > 0 && firstItem && firstItem.foods.length > 0) {
      console.log('첫 번째 히스토리 항목의 첫 번째 음식 정보:', firstItem.foods[0]);
    }
    
    return historyItems;

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
    // RLS 정책이 허용하는 범위 내에서 모든 행을 삭제합니다.
    const { error } = await supabase
      .from('food_analyses')
      .delete()
      .gt('total_calories', -1); // 모든 행을 대상으로 하기 위한 조건
    
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