import { supabase } from './supabaseClient';

/**
 * Supabase Storage 설정을 초기화합니다.
 * 버킷 생성 및 정책 설정을 수행합니다.
 */
export const initializeSupabaseStorage = async (): Promise<void> => {
  try {
    console.log('Supabase Storage 초기화 시작...');

    // 1. 버킷 생성 (이미 있으면 무시)
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('food-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Storage 버킷 생성 실패:', bucketError);
    } else {
      console.log('Storage 버킷 생성/확인 완료');
    }

    // 2. Storage 정책을 SQL로 직접 실행
    console.log('Storage 정책 설정 중...');
    
    // Storage objects에 대한 정책 생성
    const storagePolicy = `
      -- Storage objects에 대한 공개 읽기 정책
      INSERT INTO storage.policies (name, bucket_id, operation, definition)
      VALUES (
        'food-images-public-read',
        'food-images',
        'SELECT',
        'true'
      )
      ON CONFLICT (name, bucket_id) DO NOTHING;

      -- Storage objects에 대한 공개 업로드 정책
      INSERT INTO storage.policies (name, bucket_id, operation, definition)
      VALUES (
        'food-images-public-insert',
        'food-images',
        'INSERT',
        'true'
      )
      ON CONFLICT (name, bucket_id) DO NOTHING;

      -- Storage objects에 대한 공개 삭제 정책
      INSERT INTO storage.policies (name, bucket_id, operation, definition)
      VALUES (
        'food-images-public-delete',
        'food-images',
        'DELETE',
        'true'
      )
      ON CONFLICT (name, bucket_id) DO NOTHING;
    `;

    // SQL 정책 실행
    const { error: policyError } = await supabase.rpc('exec_sql', { 
      sql: storagePolicy 
    });

    if (policyError) {
      console.warn('Storage 정책 자동 설정 실패:', policyError);
      console.warn('수동으로 Supabase 대시보드에서 Storage 정책을 설정해주세요.');
    } else {
      console.log('Storage 정책 설정 완료');
    }
    
  } catch (error) {
    console.error('Supabase Storage 초기화 중 오류:', error);
    
    // 대체 방법 안내
    console.warn(`
      Supabase Storage 설정을 수동으로 완료해주세요:
      
      1. Supabase 대시보드 > Storage 이동
      2. 'food-images' 버킷이 없다면 생성
      3. Storage > Policies 이동
      4. 다음 정책들을 생성:
         - 이름: "food-images public read"
           작업: SELECT
           대상: storage.objects
           조건: bucket_id = 'food-images'
           정책: true
           
         - 이름: "food-images public insert"  
           작업: INSERT
           대상: storage.objects
           조건: bucket_id = 'food-images'
           정책: true
    `);
  }
};

/**
 * Storage 연결을 테스트합니다.
 */
export const testStorageConnection = async (): Promise<boolean> => {
  try {
    console.log('Storage 연결 테스트 중...');
    
    // 버킷 목록 가져오기
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Storage 연결 테스트 실패:', error);
      return false;
    }
    
    console.log('Storage 연결 성공. 사용 가능한 버킷:', data?.map(b => b.name));
    
    // food-images 버킷 확인
    const foodImagesBucket = data?.find(bucket => bucket.name === 'food-images');
    if (!foodImagesBucket) {
      console.warn('food-images 버킷이 없습니다. 초기화를 실행합니다.');
      await initializeSupabaseStorage();
    }
    
    return true;
    
  } catch (error) {
    console.error('Storage 연결 테스트 중 오류:', error);
    return false;
  }
};