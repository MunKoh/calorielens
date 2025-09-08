import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { FoodItem } from './ResultsDisplay';
import { formatFullDate } from '../services/dailyCalorieService';
import { MealType, getMealTypeDisplayName, formatKoreanDate } from '../utils/mealTimeUtils';

export interface HistoryItem {
  id: string;
  date: string;
  mealType: MealType;
  mealDate: string; // YYYY-MM-DD 형식
  foods: FoodItem[];
  totalCalories: number;
  imageUrl: string;
}

// 히스토리 아이템의 총 영양소 계산을 위한 인터페이스
export interface HistoryNutrients {
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
}

// 히스토리 아이템의 영양소 총합을 계산하는 함수
export const calculateHistoryNutrients = (item: HistoryItem): HistoryNutrients => {
  const totalCarbs = item.foods.reduce((sum, food) => sum + (food.carbs || 0), 0);
  const totalProtein = item.foods.reduce((sum, food) => sum + (food.protein || 0), 0);
  const totalFat = item.foods.reduce((sum, food) => sum + (food.fat || 0), 0);
  
  return {
    totalCarbs,
    totalProtein,
    totalFat
  };
};

interface HistoryListProps {
  history: HistoryItem[];
  onItemClick: (item: HistoryItem) => void;
  onDeleteItem: (id: string, event: React.MouseEvent) => void;
  onClearAll: () => void;
}

// 날짜별 영양소 총합 계산 인터페이스
interface DayNutritionSummary {
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  mealCount: number;
}

// 목표값 인터페이스
interface NutritionGoals {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

const HistoryContainer = styled.div`
  margin-top: ${props => props.theme.spacing.xl};
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const HistoryTitle = styled.h2`
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const ClearAllButton = styled.button`
  background-color: transparent;
  color: ${props => props.theme.colors.textLight};
  border: 1px solid ${props => props.theme.colors.textLight};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f8f8f8;
    color: ${props => props.theme.colors.error};
    border-color: ${props => props.theme.colors.error};
  }
`;

const HistoryCardsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const HistoryCard = styled.div`
  background-color: ${props => props.theme.colors.cardBg};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.medium};
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.theme.shadows.large};
  }
`;

const CardContent = styled.div`
  cursor: pointer;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  color: ${props => props.theme.colors.error};
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 5;
  
  &:hover {
    background-color: ${props => props.theme.colors.error};
    color: white;
  }
  
  ${HistoryCard}:hover & {
    opacity: 1;
  }
`;

const HistoryImage = styled.div<{ imageUrl: string }>`
  height: 160px;
  background-image: url(${props => props.imageUrl});
  background-size: cover;
  background-position: center;
`;

const HistoryInfo = styled.div`
  padding: ${props => props.theme.spacing.md};
`;

const HistoryDate = styled.p`
  margin: 0;
  color: ${props => props.theme.colors.textLight};
  font-size: 0.9rem;
`;

const HistoryCalories = styled.p`
  margin: ${props => props.theme.spacing.xs} 0 0;
  font-weight: 700;
  color: ${props => props.theme.colors.primaryDark};
  font-size: 1.1rem;
`;

const FoodsList = styled.ul`
  margin: ${props => props.theme.spacing.sm} 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.85rem;
  color: ${props => props.theme.colors.text};
`;

const FoodItemLi = styled.li`
  margin: 0;
  padding: ${props => props.theme.spacing.xs} 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:not(:last-child) {
    border-bottom: 1px dashed ${props => props.theme.colors.secondaryLight};
  }
`;

const FoodItemInfo = styled.div`
  flex: 1;
`;

const FoodItemCalories = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.primaryDark};
  font-size: 0.9rem;
`;

const NutritionSummary = styled.div`
  margin-top: ${props => props.theme.spacing.md};
  padding-top: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.secondaryLight};
  display: flex;
  justify-content: space-around;
  background-color: ${props => props.theme.colors.secondaryLight + '20'};
  border-radius: ${props => props.theme.borderRadius.small};
  padding: ${props => props.theme.spacing.sm};
`;

const NutrientItem = styled.div`
  text-align: center;
  font-size: 0.8rem;
`;

const NutrientValue = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  font-size: 0.9rem;
`;

const NutrientLabel = styled.div`
  color: ${props => props.theme.colors.textLight};
  margin-top: 2px;
`;

const DateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.md} 0;
  margin-bottom: ${props => props.theme.spacing.md};
  border-bottom: 2px solid ${props => props.theme.colors.primary};
  cursor: pointer;
  background-color: ${props => props.theme.colors.primary + '10'};
  border-radius: ${props => props.theme.borderRadius.small};
  
  &:hover {
    background-color: ${props => props.theme.colors.primary + '20'};
  }
`;

const DateTitle = styled.h3`
  margin: 0;
  color: ${props => props.theme.colors.primary};
  font-weight: 600;
  font-size: 1.1rem;
`;

const DateSummary = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  align-items: center;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textLight};
`;

const DaySummaryCard = styled.div`
  background: linear-gradient(135deg, #E8FFD7 0%, #FFFFFF 100%);
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.secondaryLight};
  box-shadow: ${props => props.theme.shadows.medium};
`;

const DaySummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.small};
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

const CalorieGoalProgress = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex: 1;
  margin-left: ${props => props.theme.spacing.md};
`;

const SummaryToggleButton = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.small};
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.4);
  }
`;

const CalorieBadge = styled.div<{ percentage: number }>`
  background: ${props => {
    if (props.percentage > 110) return 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
    if (props.percentage >= 80) return 'linear-gradient(45deg, #93DA97, #5E936C)';
    return 'linear-gradient(45deg, #ffa726, #ff9800)';
  }};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  border-radius: 20px;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &::before {
    content: ${props => {
      if (props.percentage > 110) return '"⚠️"';
      if (props.percentage >= 80) return '"✅"';
      return '"⚡"';
    }};
    font-size: 0.9rem;
  }
`;

const ProgressBarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex: 1;
`;

const ProgressBar = styled.div<{ percentage: number }>`
  flex: 1;
  height: 8px;
  background-color: ${props => props.theme.colors.secondaryLight};
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => Math.min(props.percentage, 100)}%;
    background: ${props => {
      if (props.percentage > 100) return 'linear-gradient(90deg, #ff6b6b, #ee5a52)';
      if (props.percentage >= 80) return 'linear-gradient(90deg, #93DA97, #5E936C)';
      return 'linear-gradient(90deg, #ffa726, #ff9800)';
    }};
    border-radius: 4px;
    transition: width 0.3s ease;
  }
`;

const ProgressText = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  min-width: 45px;
  text-align: right;
`;

const NutritionProgressGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const NutritionProgressCard = styled.div<{ type: 'carbs' | 'protein' | 'fat' }>`
  background: ${props => {
    switch(props.type) {
      case 'carbs': return 'linear-gradient(135deg, #93DA97, #5E936C)';
      case 'protein': return 'linear-gradient(135deg, #E8FFD7, #93DA97)';
      case 'fat': return 'linear-gradient(135deg, #5E936C, #3E5F44)';
    }
  }};
  color: ${props => props.type === 'protein' ? props.theme.colors.text : 'white'};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.medium};
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: rotate(45deg);
  }
`;

const NutritionIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: ${props => props.theme.spacing.xs};
  position: relative;
  z-index: 1;
`;

const NutritionValue = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.xs};
  position: relative;
  z-index: 1;
`;

const NutritionLabel = styled.div`
  font-size: 0.8rem;
  opacity: 0.9;
  font-weight: 500;
  position: relative;
  z-index: 1;
`;

const NutritionPercentage = styled.div<{ $isOver?: boolean }>`
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: ${props => props.theme.spacing.xs};
  position: relative;
  z-index: 1;
  color: ${props => props.$isOver ? '#ff6b6b' : 'inherit'};
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
`;

const NutritionTarget = styled.div`
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: ${props => props.theme.spacing.xs};
  position: relative;
  z-index: 1;
`;

const NutritionProgressBar = styled.div<{ percentage: number; $isOver?: boolean }>`
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-top: ${props => props.theme.spacing.xs};
  overflow: hidden;
  position: relative;
  z-index: 1;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => Math.min(props.percentage, 100)}%;
    background: ${props => props.$isOver ? '#ff6b6b' : 'rgba(255, 255, 255, 0.8)'};
    border-radius: 2px;
    transition: width 0.3s ease;
  }
`;

const ExpandToggle = styled.span`
  color: ${props => props.theme.colors.textLight};
  font-size: 0.9rem;
  font-weight: 500;
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: ${props => props.theme.colors.textLight};
  padding: ${props => props.theme.spacing.xl} 0;
`;

// 히스토리 아이템을 일별로 그룹화하는 함수
const groupHistoryByDate = (history: HistoryItem[]): Record<string, HistoryItem[]> => {
  const grouped: Record<string, HistoryItem[]> = {};
  
  // 히스토리가 없으면 빈 객체 반환
  if (!history || history.length === 0) {
    return {};
  }
  
  history.forEach(item => {
    try {
      // mealDate를 사용하여 그룹화 (YYYY-MM-DD 형식)
      const dateKey = item.mealDate || item.date.split('T')[0] || item.date.substring(0, 10);
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey]!.push(item);
    } catch (error) {
      console.error('날짜 파싱 오류:', error, item);
      // 오류 발생 시 기본 그룹으로 분류
      const defaultKey = '기타 날짜';
      if (!grouped[defaultKey]) {
        grouped[defaultKey] = [];
      }
      grouped[defaultKey].push(item);
    }
  });
  
  return grouped;
};

// 식사 타입별 정렬 순서
const mealTypeOrder: Record<MealType, number> = {
  breakfast: 1,
  lunch: 2,
  dinner: 3,
  snack: 4
};

// 하루의 식사들을 타입별로 정렬하는 함수
const sortMealsByType = (meals: HistoryItem[]): HistoryItem[] => {
  return meals.sort((a, b) => {
    const orderA = mealTypeOrder[a.mealType] || 999;
    const orderB = mealTypeOrder[b.mealType] || 999;
    return orderA - orderB;
  });
};

const HistoryList: React.FC<HistoryListProps> = ({ history, onItemClick, onDeleteItem, onClearAll }) => {
  // 일별로 그룹화된 히스토리 데이터
  const groupedHistory = useMemo(() => groupHistoryByDate(history), [history]);
  
  // 각 날짜별 섹션의 확장/축소 상태
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  
  // 각 날짜별 요약 카드의 확장/축소 상태
  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({});
  
  // 목표값 상태
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals>({
    calories: 2000,
    carbs: 250,
    protein: 100,
    fat: 67
  });
  
  // 최초 렌더링 시 모든 날짜를 확장 상태로 설정
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    const initialSummaryState: Record<string, boolean> = {};
    Object.keys(groupedHistory).forEach(date => {
      initialExpandedState[date] = true; // 기본적으로 모두 펼침
      initialSummaryState[date] = true; // 요약 카드도 기본적으로 펼침
    });
    setExpandedDates(initialExpandedState);
    setExpandedSummaries(initialSummaryState);
  }, [groupedHistory]);
  
  // 로컬 스토리지에서 목표값 로드
  useEffect(() => {
    const savedCalorieGoal = localStorage.getItem('calorielens_goal');
    const savedNutritionGoal = localStorage.getItem('calorielens_nutrition_goal') || 'health';
    const savedUserProfile = localStorage.getItem('calorielens_user_profile');
    
    if (savedCalorieGoal) {
      const calorieGoal = parseInt(savedCalorieGoal, 10);
      let profile = { weight: 70, height: 170, gender: 'male', age: 30 };
      
      if (savedUserProfile) {
        try {
          profile = JSON.parse(savedUserProfile);
        } catch (error) {
          console.error('프로필 파싱 오류:', error);
        }
      }
      
      // 영양소 목표 계산 (DailyCalorieTracker와 동일한 로직)
      const proteinPerKg = savedNutritionGoal === 'muscle' ? 2.2 : savedNutritionGoal === 'diet' ? 1.8 : 1.2;
      const targetProtein = Math.round(profile.weight * proteinPerKg);
      
      const proteinCalories = targetProtein * 4;
      const remainingCalories = calorieGoal - proteinCalories;
      
      let carbRatio, fatRatio;
      switch(savedNutritionGoal) {
        case 'muscle':
          carbRatio = 0.45; fatRatio = 0.55;
          break;
        case 'diet':
          carbRatio = 0.30; fatRatio = 0.70;
          break;
        case 'health':
        default:
          carbRatio = 0.55; fatRatio = 0.45;
          break;
      }
      
      const targetCarbs = Math.round((remainingCalories * carbRatio) / 4);
      const targetFat = Math.round((remainingCalories * fatRatio) / 9);
      
      setNutritionGoals({
        calories: calorieGoal,
        carbs: targetCarbs,
        protein: targetProtein,
        fat: targetFat
      });
    }
  }, []);
  
  // 날짜별 섹션 토글 핸들러
  const toggleDateExpanded = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };
  
  // 요약 카드 토글 핸들러
  const toggleSummaryExpanded = (date: string) => {
    setExpandedSummaries(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };
  
  // 하루 내 전체 칼로리 계산
  const calculateDayTotalCalories = (dayMeals: HistoryItem[]): number => {
    return dayMeals.reduce((total, meal) => total + meal.totalCalories, 0);
  };
  
  // 날짜별 영양소 총합 계산
  const calculateDayNutritionSummary = (dayMeals: HistoryItem[]): DayNutritionSummary => {
    return dayMeals.reduce((summary, meal) => {
      const mealNutrients = calculateHistoryNutrients(meal);
      return {
        totalCalories: summary.totalCalories + meal.totalCalories,
        totalCarbs: summary.totalCarbs + mealNutrients.totalCarbs,
        totalProtein: summary.totalProtein + mealNutrients.totalProtein,
        totalFat: summary.totalFat + mealNutrients.totalFat,
        mealCount: summary.mealCount + 1
      };
    }, {
      totalCalories: 0,
      totalCarbs: 0,
      totalProtein: 0,
      totalFat: 0,
      mealCount: 0
    });
  };

  return (
    <HistoryContainer>
      <HistoryHeader>
        <HistoryTitle>나의 종합 기록</HistoryTitle>
        {history.length > 0 && (
          <ClearAllButton onClick={onClearAll}>전체 삭제</ClearAllButton>
        )}
      </HistoryHeader>
      
      {history.length === 0 ? (
        <EmptyMessage>저장된 기록이 없습니다.</EmptyMessage>
      ) : (
        <div>
          {Object.keys(groupedHistory)
            .sort((a, b) => b.localeCompare(a)) // 최신 날짜가 먼저 오도록 정렬
            .map(dateKey => {
              const dayMeals = sortMealsByType(groupedHistory[dateKey] || []);
              const dayNutrition = calculateDayNutritionSummary(dayMeals);
              const caloriePercentage = Math.round((dayNutrition.totalCalories / nutritionGoals.calories) * 100);
              
              return (
                <div key={dateKey}>
                  <DateHeader onClick={() => toggleDateExpanded(dateKey)}>
                    <DateTitle>
                      {formatKoreanDate(dateKey)}
                    </DateTitle>
                    <DateSummary>
                      <span>{dayMeals.length}개 식사</span>
                      <span>{dayNutrition.totalCalories} kcal</span>
                      <ExpandToggle>
                        {expandedDates[dateKey] ? '접기 ▲' : '펼치기 ▼'}
                      </ExpandToggle>
                    </DateSummary>
                  </DateHeader>
                  
                  {/* 날짜별 모든 내용 - 접기 가능 */}
                  {expandedDates[dateKey] && (
                    <>
                      {/* 날짜별 영양소 요약 카드 */}
                      <DaySummaryCard>
                        <DaySummaryHeader onClick={() => toggleSummaryExpanded(dateKey)}>
                          <CalorieBadge percentage={caloriePercentage}>
                            {dayNutrition.totalCalories}kcal ({caloriePercentage}%)
                          </CalorieBadge>
                          <CalorieGoalProgress>
                            <ProgressBarContainer>
                              <ProgressBar percentage={caloriePercentage} />
                              <ProgressText>{caloriePercentage}%</ProgressText>
                            </ProgressBarContainer>
                          </CalorieGoalProgress>
                          <SummaryToggleButton>
                            {expandedSummaries[dateKey] ? '접기 ▲' : '영양소 보기 ▼'}
                          </SummaryToggleButton>
                        </DaySummaryHeader>
                        
                        {/* 영양소 진행 상황 - 접기 가능 */}
                        {expandedSummaries[dateKey] && (
                          <NutritionProgressGrid>
                            {(() => {
                              const carbsPercentage = Math.round((dayNutrition.totalCarbs / nutritionGoals.carbs) * 100);
                              const proteinPercentage = Math.round((dayNutrition.totalProtein / nutritionGoals.protein) * 100);
                              const fatPercentage = Math.round((dayNutrition.totalFat / nutritionGoals.fat) * 100);
                              
                              return (
                                <>
                                  <NutritionProgressCard type="carbs">
                                    <NutritionIcon>🍞</NutritionIcon>
                                    <NutritionPercentage $isOver={dayNutrition.totalCarbs > nutritionGoals.carbs}>
                                      {carbsPercentage}%
                                    </NutritionPercentage>
                                    <NutritionValue>{Math.round(dayNutrition.totalCarbs)}g</NutritionValue>
                                    <NutritionLabel>탄수화물</NutritionLabel>
                                    <NutritionTarget>목표: {nutritionGoals.carbs}g</NutritionTarget>
                                    <NutritionProgressBar 
                                      percentage={carbsPercentage}
                                      $isOver={dayNutrition.totalCarbs > nutritionGoals.carbs}
                                    />
                                  </NutritionProgressCard>
                                  
                                  <NutritionProgressCard type="protein">
                                    <NutritionIcon>🥩</NutritionIcon>
                                    <NutritionPercentage $isOver={dayNutrition.totalProtein > nutritionGoals.protein}>
                                      {proteinPercentage}%
                                    </NutritionPercentage>
                                    <NutritionValue>{Math.round(dayNutrition.totalProtein)}g</NutritionValue>
                                    <NutritionLabel>단백질</NutritionLabel>
                                    <NutritionTarget>목표: {nutritionGoals.protein}g</NutritionTarget>
                                    <NutritionProgressBar 
                                      percentage={proteinPercentage}
                                      $isOver={dayNutrition.totalProtein > nutritionGoals.protein}
                                    />
                                  </NutritionProgressCard>
                                  
                                  <NutritionProgressCard type="fat">
                                    <NutritionIcon>🥑</NutritionIcon>
                                    <NutritionPercentage $isOver={dayNutrition.totalFat > nutritionGoals.fat}>
                                      {fatPercentage}%
                                    </NutritionPercentage>
                                    <NutritionValue>{Math.round(dayNutrition.totalFat)}g</NutritionValue>
                                    <NutritionLabel>지방</NutritionLabel>
                                    <NutritionTarget>목표: {nutritionGoals.fat}g</NutritionTarget>
                                    <NutritionProgressBar 
                                      percentage={fatPercentage}
                                      $isOver={dayNutrition.totalFat > nutritionGoals.fat}
                                    />
                                  </NutritionProgressCard>
                                </>
                              );
                            })()}
                          </NutritionProgressGrid>
                        )}
                      </DaySummaryCard>
                      
                      {/* 개별 음식 사진들 */}
                      <HistoryCardsList>
                        {dayMeals.map(item => (
                          <HistoryCard key={item.id}>
                            <DeleteButton onClick={(e) => onDeleteItem(item.id, e)}>×</DeleteButton>
                            <CardContent onClick={() => onItemClick(item)}>
                              <HistoryImage imageUrl={item.imageUrl} />
                              <HistoryInfo>
                                <HistoryDate>
                                  {getMealTypeDisplayName(item.mealType)} - {item.date.includes('T') ? (
                                    formatFullDate(new Date(item.date))
                                  ) : (
                                    item.date
                                  )}
                                </HistoryDate>
                                <HistoryCalories>{item.totalCalories} kcal</HistoryCalories>
                                <FoodsList>
                                  {item.foods.map(food => (
                                    <FoodItemLi key={food.id}>
                                      <FoodItemInfo>
                                        <div>{food.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                          {food.quantity}
                                        </div>
                                      </FoodItemInfo>
                                      <FoodItemCalories>{food.calories}kcal</FoodItemCalories>
                                    </FoodItemLi>
                                  ))}
                                </FoodsList>
                                
                                <NutritionSummary>
                                  {(() => {
                                    const nutrients = calculateHistoryNutrients(item);
                                    return (
                                      <>
                                        <NutrientItem>
                                          <NutrientValue>{Math.round(nutrients.totalCarbs)}g</NutrientValue>
                                          <NutrientLabel>탄수화물</NutrientLabel>
                                        </NutrientItem>
                                        <NutrientItem>
                                          <NutrientValue>{Math.round(nutrients.totalProtein)}g</NutrientValue>
                                          <NutrientLabel>단백질</NutrientLabel>
                                        </NutrientItem>
                                        <NutrientItem>
                                          <NutrientValue>{Math.round(nutrients.totalFat)}g</NutrientValue>
                                          <NutrientLabel>지방</NutrientLabel>
                                        </NutrientItem>
                                      </>
                                    );
                                  })()}
                                </NutritionSummary>
                              </HistoryInfo>
                            </CardContent>
                          </HistoryCard>
                        ))}
                      </HistoryCardsList>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </HistoryContainer>
  );
};

export default HistoryList;