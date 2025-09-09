import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase 환경 변수
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'dummy-key';

// 환경 변수 검증 및 경고
if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase 환경 변수가 설정되지 않았습니다. ' +
    'Vercel에서 REACT_APP_SUPABASE_URL과 REACT_APP_SUPABASE_ANON_KEY를 설정해주세요. ' +
    '현재는 더미 클라이언트로 실행됩니다.'
  );
} else {
  console.log('Supabase 클라이언트 초기화 완료');
}

// Supabase 클라이언트 생성 (항상 성공)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);