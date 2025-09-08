import { supabase } from './supabaseClient';

/**
 * food_items 테이블에 누락된 영양소 관련 필드 추가
 * - grams: 음식 무게(g)
 * - carbs: 탄수화물(g)
 * - protein: 단백질(g) 
 * - fat: 지방(g)
 */
export const updateFoodItemsTable = async (): Promise<boolean> => {
  try {
    console.log('food_items 테이블 스키마 업데이트 시작...');

    // ALTER TABLE을 통해 새 컬럼 추가
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE food_items
        ADD COLUMN IF NOT EXISTS grams INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS carbs REAL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS protein REAL DEFAULT 0, 
        ADD COLUMN IF NOT EXISTS fat REAL DEFAULT 0;
      `
    });

    if (error) {
      console.error('테이블 스키마 업데이트 실패:', error.message);
      throw error;
    }

    console.log('food_items 테이블 스키마 업데이트 완료');
    return true;
  } catch (error) {
    console.error('테이블 스키마 업데이트 중 오류 발생:', error);
    return false;
  }
};

// 앱 시작 시 테이블 스키마 업데이트 실행
updateFoodItemsTable().then(success => {
  if (success) {
    console.log('데이터베이스 스키마가 성공적으로 업데이트되었습니다.');
  } else {
    console.error('데이터베이스 스키마 업데이트 실패');
  }
});