import { supabase } from './supabaseClient';

/**
 * 이미지를 Supabase 스토리지에 업로드
 * @param file 업로드할 이미지 파일
 * @returns 업로드된 이미지의 공개 URL 또는 null
 */
export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop();
    
    // 고유한 파일명 생성
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `food-images/${fileName}`;
    
    console.log(`이미지 업로드 시작: ${filePath}`);
    
    // Supabase Storage에 파일 업로드
    const { data, error } = await supabase.storage
      .from('food-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('이미지 업로드 실패:', error.message);
      return null;
    }
    
    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('food-images')
      .getPublicUrl(filePath);
    
    console.log(`이미지 업로드 완료: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error('이미지 업로드 중 오류:', error);
    return null;
  }
};

/**
 * Supabase 스토리지에서 이미지 삭제
 * @param imageUrl 삭제할 이미지 URL
 * @returns 성공 여부
 */
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // URL에서 파일 경로 추출
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split('/');
    const bucketName = pathSegments[pathSegments.length - 2];
    const fileName = pathSegments[pathSegments.length - 1];
    const filePath = `${bucketName}/${fileName}`;
    
    // Supabase Storage에서 파일 삭제
    const { error } = await supabase.storage
      .from('food-images')
      .remove([filePath]);
      
    if (error) {
      console.error('이미지 삭제 실패:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('이미지 삭제 중 오류:', error);
    return false;
  }
};