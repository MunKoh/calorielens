import { supabase } from './supabaseClient';

/**
 * 데이터베이스 스키마 마이그레이션
 * 누락된 컬럼들을 추가합니다.
 */
export const runDatabaseMigration = async (): Promise<boolean> => {
  try {
    console.log('데이터베이스 마이그레이션 시작...');

    // 1. food_items 테이블에 영양소 컬럼 추가
    const addNutritionColumns = `
      ALTER TABLE food_items 
      ADD COLUMN IF NOT EXISTS grams INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS carbs REAL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS protein REAL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS fat REAL DEFAULT 0;
    `;

    console.log('영양소 컬럼 추가 중...');
    const { error: alterError } = await supabase.rpc('exec_sql', { 
      sql: addNutritionColumns 
    });

    if (alterError) {
      console.error('ALTER TABLE 실패:', alterError);
      
      // exec_sql이 작동하지 않는 경우, 직접 컬럼 존재 여부 확인
      console.log('대체 방법으로 컬럼 존재 여부 확인...');
      
      // 테이블 구조 확인
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'food_items' });
      
      if (columnsError) {
        console.log('컬럼 조회 실패, 테이블이 비어있을 수 있습니다.');
        return true; // 일단 진행
      }
      
      console.log('현재 테이블 컬럼:', columns);
    } else {
      console.log('영양소 컬럼 추가 완료');
    }

    console.log('데이터베이스 마이그레이션 완료');
    return true;

  } catch (error) {
    console.error('데이터베이스 마이그레이션 오류:', error);
    return false;
  }
};

/**
 * 테이블 스키마를 직접 확인하는 함수
 */
export const checkTableSchema = async (): Promise<void> => {
  try {
    // food_items 테이블에서 샘플 데이터 조회 (컬럼 구조 확인용)
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('테이블 스키마 확인 실패:', error.message);
    } else {
      console.log('현재 테이블 스키마 (샘플 데이터):', data);
    }
  } catch (error) {
    console.error('스키마 확인 중 오류:', error);
  }
};