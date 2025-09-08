// historyService.ts
import { HistoryItem } from '../components/HistoryList';
import { FoodItem } from '../components/ResultsDisplay';
import { MealType } from '../utils/mealTimeUtils';
import { 
  saveAnalysisToSupabase, 
  getHistoryFromSupabase, 
  deleteHistoryFromSupabase, 
  clearAllHistoryFromSupabase 
} from './supabaseDataService';
import { deleteImage } from './supabaseStorageService';

/**
 * 히스토리 아이템을 Supabase에 저장합니다.
 * @param foods 분석된 음식 항목 배열
 * @param imageUrl 이미지 URL
 * @param mealType 식사 타입
 * @param mealDate 식사 날짜 (YYYY-MM-DD)
 */
export const saveHistoryItem = async (
  foods: FoodItem[], 
  imageUrl: string, 
  mealType: MealType, 
  mealDate: string
): Promise<void> => {
  try {
    console.log('Supabase에 히스토리 저장');
    await saveAnalysisToSupabase(foods, imageUrl, mealType, mealDate);
  } catch (error) {
    console.error('히스토리 저장 중 오류 발생:', error);
    throw error;
  }
};

/**
 * Supabase에서 모든 히스토리 아이템을 조회합니다.
 * @returns 히스토리 항목 배열
 */
export const getHistoryItems = async (): Promise<HistoryItem[]> => {
  try {
    console.log('Supabase에서 히스토리 조회');
    const supabaseHistory = await getHistoryFromSupabase();
    return supabaseHistory;
  } catch (error) {
    console.error('히스토리 불러오기 중 오류 발생:', error);
    return [];
  }
};

/**
 * Supabase에서 특정 히스토리 아이템을 삭제합니다.
 * @param itemToDelete 삭제할 히스토리 아이템 객체 (이미지 URL 포함)
 */
export const deleteHistoryItem = async (itemToDelete: HistoryItem): Promise<void> => {
  try {
    console.log(`Supabase에서 히스토리 항목 삭제: ${itemToDelete.id}`);
    
    // 이미지 URL이 Supabase URL이면 스토리지에서 이미지 삭제
    if (itemToDelete.imageUrl && itemToDelete.imageUrl.includes('supabase.co')) {
      console.log(`Supabase 스토리지에서 이미지 삭제 시도: ${itemToDelete.imageUrl}`);
      await deleteImage(itemToDelete.imageUrl);
    }
    
    // 데이터베이스에서 항목 삭제
    await deleteHistoryFromSupabase(itemToDelete.id);
  } catch (error) {
    console.error('히스토리 삭제 중 오류 발생:', error);
    throw error;
  }
};

/**
 * Supabase에서 모든 히스토리 아이템을 삭제합니다.
 * @param allHistoryItems 삭제할 모든 히스토리 아이템 배열 (이미지 URL 조회를 위함)
 */
export const clearAllHistory = async (allHistoryItems: HistoryItem[]): Promise<void> => {
  try {
    console.log('Supabase에서 모든 히스토리 삭제');
    
    // Supabase URL을 가진 모든 이미지 삭제
    const supabaseImages = allHistoryItems.filter(item => 
      item.imageUrl && item.imageUrl.includes('supabase.co')
    );
    
    if (supabaseImages.length > 0) {
      console.log(`${supabaseImages.length}개의 이미지를 스토리지에서 삭제 시도`);
      await Promise.allSettled(
        supabaseImages.map(item => deleteImage(item.imageUrl))
      );
    }
    
    // 데이터베이스에서 모든 항목 삭제
    await clearAllHistoryFromSupabase();
  } catch (error) {
    console.error('히스토리 전체 삭제 중 오류 발생:', error);
    throw error;
  }
};