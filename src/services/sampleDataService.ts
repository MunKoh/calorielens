// src/services/sampleDataService.ts

import { supabase } from './supabaseClient';
import { FoodItem } from '../components/ResultsDisplay';

// 함수가 받을 인자의 타입 정의
export interface SampleDataRequest {
  month: number;  // 예: 6 for June
  count: number;  // 예: 10
}

// Supabase 'food_analyses' 테이블에 직접 삽입할 데이터 타입
type AnalysisInsert = {
  image_url: string;
  total_calories: number;
  analysis_date: string; // ISO 8601 형식
};

// Supabase 'food_items' 테이블에 직접 삽입할 데이터 타입
type FoodItemInsert = {
  analysis_id: string;
  name: string;
  calories: number;
  quantity: string;
  grams: number;
  carbs: number;
  protein: number;
  fat: number;
  confidence: number;
};

/**
 * 요청받은 월과 개수만큼 샘플 데이터를 생성하고 Supabase DB에 대량으로 추가합니다.
 * @param requests 샘플 데이터를 생성할 월과 개수가 담긴 배열
 */
export const createAndInsertSampleData = async (requests: SampleDataRequest[]) => {
  console.log('요청 기반 샘플 데이터 생성 및 Supabase 삽입 시작...', requests);

  const analysesToInsert: AnalysisInsert[] = [];
  const foodItemsToGenerate: { analysisIndex: number; foods: FoodItem[] }[] = [];
  
  const currentYear = new Date().getFullYear();
  let analysisIndexCounter = 0;

  // 1. 요청받은 내용에 따라 삽입할 데이터 준비
  for (const request of requests) {
    const { month, count } = request;
    for (let i = 0; i < count; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const date = new Date(currentYear, month - 1, day, 12, 0, 0);
      const totalCalories = Math.floor(Math.random() * 1501) + 1500;

      analysesToInsert.push({
        image_url: `https://picsum.photos/seed/${month}${i}/400/300`,
        total_calories: totalCalories,
        analysis_date: date.toISOString(),
      });

      const food1_calories = Math.floor(totalCalories * 0.6);
      const food2_calories = totalCalories - totalCalories;
      const sampleFoods: FoodItem[] = [
        {
          id: '', // DB에서 생성되므로 id는 비워둡니다.
          name: `샘플 음식 ${month}-${i}-1`,
          calories: food1_calories,
          quantity: '1인분',
          grams: 200,
          confidence: 90,
          carbs: Math.floor(food1_calories / 4),
          protein: Math.floor(food1_calories / 4),
          fat: Math.floor(food1_calories / 9),
        },
        {
          id: '',
          name: `샘플 음식 ${month}-${i}-2`,
          calories: food2_calories,
          quantity: '1개',
          grams: 150,
          confidence: 85,
          carbs: Math.floor(food2_calories / 4),
          protein: Math.floor(food2_calories / 4),
          fat: Math.floor(food2_calories / 9),
        },
      ];
      foodItemsToGenerate.push({ analysisIndex: analysisIndexCounter, foods: sampleFoods });
      analysisIndexCounter++;
    }
  }

  if (analysesToInsert.length === 0) {
    console.log('추가할 샘플 데이터가 없습니다.');
    return true;
  }

  try {
    // 2. 'food_analyses' 테이블에 대량 삽입하고, 삽입된 데이터의 id를 반환받음
    const { data: insertedAnalyses, error: analysisError } = await supabase
      .from('food_analyses')
      .insert(analysesToInsert)
      .select('id');

    if (analysisError) {
      console.error('Supabase food_analyses 삽입 오류:', analysisError);
      throw analysisError;
    }
    if (!insertedAnalyses) {
      throw new Error('분석 데이터 삽입 후 반환된 데이터가 없습니다.');
    }

    console.log(`${insertedAnalyses.length}개의 분석 기록이 성공적으로 삽입되었습니다.`);

    // 3. 'food_items' 테이블에 삽입할 데이터 준비 (반환된 analysis_id 사용)
    const foodItemsToInsert: FoodItemInsert[] = [];
    foodItemsToGenerate.forEach(item => {
      const analysis = insertedAnalyses[item.analysisIndex];
      if (!analysis) return;
      const analysisId = analysis.id;
      item.foods.forEach(food => {
        foodItemsToInsert.push({
          analysis_id: analysisId,
          name: food.name,
          calories: food.calories,
          quantity: food.quantity,
          grams: food.grams,
          carbs: food.carbs,
          protein: food.protein,
          fat: food.fat,
          confidence: food.confidence,
        });
      });
    });

    // 4. 'food_items' 테이블에 대량 삽입
    const { error: foodItemsError } = await supabase
      .from('food_items')
      .insert(foodItemsToInsert);

    if (foodItemsError) {
      console.error('Supabase food_items 삽입 오류:', foodItemsError);
      throw foodItemsError;
    }

    console.log(`${foodItemsToInsert.length}개의 음식 아이템이 성공적으로 삽입되었습니다.`);
    return true;

  } catch (error) {
    console.error('샘플 데이터 삽입 중 전체 오류 발생:', error);
    return false;
  }
};