-- 음식 분석 결과 테이블
CREATE TABLE food_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_calories INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 개별 음식 항목 테이블
CREATE TABLE food_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES food_analyses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  quantity TEXT,
  confidence REAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 칼로리 목표 설정 테이블
CREATE TABLE calorie_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_value INTEGER NOT NULL DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) 정책 설정
ALTER TABLE food_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE calorie_goals ENABLE ROW LEVEL SECURITY;

-- 기본 정책 - 모든 사용자가 데이터에 접근 가능
CREATE POLICY "Allow full access to food_analyses" ON food_analyses FOR ALL USING (true);
CREATE POLICY "Allow full access to food_items" ON food_items FOR ALL USING (true);
CREATE POLICY "Allow full access to calorie_goals" ON calorie_goals FOR ALL USING (true);

-- 저장소 버킷 설정 (SQL 아님, 별도로 Supabase 대시보드에서 설정)
-- 1. Storage > 새 버킷 생성
-- 2. 버킷 이름: food-images
-- 3. Public access: 활성화