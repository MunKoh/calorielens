import { supabase } from './supabaseClient';

/**
 * Supabase 스키마 초기화 함수
 * - 테이블이 없을 경우 생성합니다.
 */
export const initializeSupabaseSchema = async (): Promise<boolean> => {
  try {
    console.log('Supabase 스키마 초기화 시작...');
    
    // 테이블 존재 여부 확인
    const { data: tables, error: tableError } = await supabase
      .from('food_analyses')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.log('테이블 확인 실패. 테이블이 없을 수 있습니다:', tableError.message);
      
      // 테이블이 없는 경우 스키마 생성
      console.log('스키마 생성 시작...');
      
      // food_analyses 테이블 생성
      const createFoodAnalysesTable = `
        CREATE TABLE IF NOT EXISTS food_analyses (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          image_url TEXT NOT NULL,
          analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          total_calories INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      const { error: createFoodAnalysesError } = await supabase
        .rpc('exec_sql', { sql: createFoodAnalysesTable });
      
      if (createFoodAnalysesError) {
        console.error('food_analyses 테이블 생성 실패:', createFoodAnalysesError.message);
        return false;
      }
      
      // food_items 테이블 생성
      const createFoodItemsTable = `
        CREATE TABLE IF NOT EXISTS food_items (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          analysis_id UUID REFERENCES food_analyses(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          calories INTEGER NOT NULL,
          quantity TEXT,
          grams INTEGER DEFAULT 0,
          carbs REAL DEFAULT 0,
          protein REAL DEFAULT 0,
          fat REAL DEFAULT 0,
          confidence REAL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      const { error: createFoodItemsError } = await supabase
        .rpc('exec_sql', { sql: createFoodItemsTable });
      
      if (createFoodItemsError) {
        console.error('food_items 테이블 생성 실패:', createFoodItemsError.message);
        return false;
      }
      
      // calorie_goals 테이블 생성
      const createCalorieGoalsTable = `
        CREATE TABLE IF NOT EXISTS calorie_goals (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          goal_value INTEGER NOT NULL DEFAULT 2000,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      const { error: createCalorieGoalsError } = await supabase
        .rpc('exec_sql', { sql: createCalorieGoalsTable });
      
      if (createCalorieGoalsError) {
        console.error('calorie_goals 테이블 생성 실패:', createCalorieGoalsError.message);
        return false;
      }
      
      // 스토리지 버킷 확인 및 생성
      const { data: buckets } = await supabase
        .storage
        .listBuckets();
      
      const foodImagesBucket = buckets?.find(b => b.name === 'food-images');
      
      if (!foodImagesBucket) {
        console.log('food-images 버킷이 없습니다. 생성을 시도합니다.');
        
        const { error: createBucketError } = await supabase
          .storage
          .createBucket('food-images', {
            public: true
          });
        
        if (createBucketError) {
          console.error('food-images 버킷 생성 실패:', createBucketError.message);
        } else {
          console.log('food-images 버킷이 생성되었습니다.');
          
          // 스토리지 RLS 정책 생성 (모든 사용자가 업로드/읽기 가능)
          const createStoragePolicy = `
            CREATE POLICY "Allow public uploads" ON storage.objects
            FOR ALL USING (bucket_id = 'food-images');
          `;
          
          const { error: policyError } = await supabase
            .rpc('exec_sql', { sql: createStoragePolicy });
          
          if (policyError) {
            console.error('스토리지 정책 생성 실패:', policyError.message);
          } else {
            console.log('스토리지 정책이 생성되었습니다.');
          }
        }
      }
      
      console.log('스키마 생성 완료');
    } else {
      console.log('테이블이 이미 존재합니다. 현재 테이블 업데이트를 확인합니다.');
      
      // food_items 테이블에 누락된 필드 추가 (영양소 관련 필드)
      const alterFoodItemsTable = `
        ALTER TABLE food_items
        ADD COLUMN IF NOT EXISTS grams INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS carbs REAL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS protein REAL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS fat REAL DEFAULT 0;
      `;
      
      const { error: alterError } = await supabase
        .rpc('exec_sql', { sql: alterFoodItemsTable });
      
      if (alterError) {
        console.error('food_items 테이블 업데이트 실패:', alterError.message);
      } else {
        console.log('food_items 테이블에 영양소 필드 추가 완료');
      }
    }
    
    console.log('Supabase 스키마 초기화 완료');
    return true;
    
  } catch (error) {
    console.error('Supabase 스키마 초기화 오류:', error);
    return false;
  }
};