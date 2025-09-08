import { createClient } from '@supabase/supabase-js'

// Supabase 환경 변수
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 환경 변수가 설정되어 있는지 확인
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.\n' +
    'REACT_APP_SUPABASE_URL과 REACT_APP_SUPABASE_ANON_KEY를 설정해야 합니다.'
  );
}