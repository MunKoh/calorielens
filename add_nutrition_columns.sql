-- food_items 테이블에 영양소 컬럼 추가
ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS grams INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS carbs REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS protein REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS fat REAL DEFAULT 0;

-- 기존 데이터가 있다면 기본값으로 업데이트
UPDATE food_items SET 
  grams = 0,
  carbs = 0,
  protein = 0,
  fat = 0
WHERE grams IS NULL OR carbs IS NULL OR protein IS NULL OR fat IS NULL;