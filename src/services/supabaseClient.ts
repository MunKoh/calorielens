import { createClient } from '@supabase/supabase-js'

// Supabase 환경 변수
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// 환경 변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경 변수가 설정되지 않았습니다. ' +
    '.env 파일에 REACT_APP_SUPABASE_URL과 REACT_APP_SUPABASE_ANON_KEY를 설정해주세요.'
  );
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase 클라이언트 초기화 완료');