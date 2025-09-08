import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MealType, getCurrentMealTimeInfo, getAllMealTypes, getMealTypeDisplayName, formatKoreanDate } from '../utils/mealTimeUtils';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  quantity: string;
  grams: number;         // 총 무게(그램)
  confidence: number;
  carbs: number;        // 탄수화물(g)
  protein: number;      // 단백질(g)
  fat: number;          // 지방(g)
}

interface ResultsDisplayProps {
  isLoading: boolean;
  results: FoodItem[];
  onSave: (mealType: MealType, mealDate: string) => void;
  error: string | null;
}

const ResultsCard = styled.div`
  background-color: ${props => props.theme.colors.cardBg};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.medium};
  padding: ${props => props.theme.spacing.lg};
  margin: ${props => props.theme.spacing.lg} 0;
`;

const ResultsTitle = styled.h2`
  color: ${props => props.theme.colors.text};
  margin-top: 0;
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${props => props.theme.spacing.xl} 0;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid ${props => props.theme.colors.secondaryLight};
  border-top-color: ${props => props.theme.colors.primary};
  animation: spin 1s linear infinite;
  margin-bottom: ${props => props.theme.spacing.md};
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const FoodItemsContainer = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const FoodItemCard = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.secondaryLight};
  
  &:last-child {
    border-bottom: none;
  }
`;

const FoodInfo = styled.div`
  flex: 1;
`;

const FoodName = styled.h3`
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text};
`;

const FoodQuantity = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textLight};
`;

const NutritionInfo = styled.div`
  margin-top: ${props => props.theme.spacing.sm};
  display: flex;
  gap: ${props => props.theme.spacing.md};
`;

const NutrientItem = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text};
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const NutrientValue = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
`;

const NutrientLabel = styled.span`
  color: ${props => props.theme.colors.textLight};
  font-size: 0.75rem;
`;

const Confidence = styled.div<{ $confidence: number }>`
  width: 60px;
  height: 8px;
  background-color: ${props => props.theme.colors.secondaryLight};
  border-radius: ${props => props.theme.borderRadius.small};
  margin-top: ${props => props.theme.spacing.xs};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.$confidence}%;
    background-color: ${props => {
      if (props.$confidence > 75) return props.theme.colors.success;
      if (props.$confidence > 50) return props.theme.colors.secondary;
      return props.theme.colors.error;
    }};
    border-radius: ${props => props.theme.borderRadius.small};
  }
`;

const FoodCalories = styled.div`
  font-weight: 700;
  color: ${props => props.theme.colors.primaryDark};
  min-width: 80px;
  text-align: right;
`;

const TotalCalories = styled.div`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.medium};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TotalTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
`;

const TotalValue = styled.p`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
`;

const SaveButton = styled.button`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.medium};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: ${props => props.theme.spacing.md};
  width: 100%;
  pointer-events: auto;
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryDark};
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.textLight};
    cursor: not-allowed;
    pointer-events: none;
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: ${props => props.theme.colors.textLight};
  padding: ${props => props.theme.spacing.lg} 0;
`;

const ErrorMessage = styled.div`
  background-color: #fff3f3;
  border-left: 4px solid ${props => props.theme.colors.error};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.error};
  border-radius: ${props => props.theme.borderRadius.small};
  text-align: center;
`;

const MealSettingsSection = styled.div`
  background-color: ${props => props.theme.colors.secondaryLight + '20'};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.md} 0;
`;

const MealSettingsTitle = styled.h4`
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  color: ${props => props.theme.colors.text};
  font-size: 1rem;
`;

const MealInputGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const MealInputLabel = styled.label`
  color: ${props => props.theme.colors.text};
  font-size: 0.9rem;
  min-width: 60px;
`;

const MealSelect = styled.select`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.secondaryLight};
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: white;
  color: ${props => props.theme.colors.text};
  font-size: 0.9rem;
  flex: 1;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const MealDateInput = styled.input`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.secondaryLight};
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: white;
  color: ${props => props.theme.colors.text};
  font-size: 0.9rem;
  flex: 1;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ isLoading, results, onSave, error }) => {
  // 식사 타입과 날짜 상태
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // 컴포넌트 마운트 시 기본값 설정
  useEffect(() => {
    const currentMealInfo = getCurrentMealTimeInfo();
    setSelectedMealType(currentMealInfo.type);
    setSelectedDate(currentMealInfo.date);
  }, []);
  
  // 총 칼로리 계산
  const totalCalories = results.reduce((sum, item) => sum + item.calories, 0);
  
  // 저장 핸들러
  const handleSave = () => {
    console.log('ResultsDisplay: 저장 버튼 클릭됨');
    console.log('selectedMealType:', selectedMealType);
    console.log('selectedDate:', selectedDate);
    console.log('onSave 함수 존재:', typeof onSave === 'function');
    
    onSave(selectedMealType, selectedDate);
  };

  return (
    <ResultsCard>
      <ResultsTitle>분석 결과</ResultsTitle>
      
      {isLoading ? (
        <LoadingContainer>
          <Spinner />
          <p>🤖 AI가 음식을 분석 중입니다...</p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px' }}>
            모든 음식을 구분하고 칼로리와 영양소를 계산하고 있습니다
          </p>
        </LoadingContainer>
      ) : (
        <>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          {results.length > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '16px' 
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                backgroundColor: '#e8f5e8',
                color: '#2e7d32',
                border: '1px solid #c8e6c9'
              }}>
                🤖 AI 분석 완료
              </div>
            </div>
          )}
          
          <FoodItemsContainer>
            {results.length === 0 && !error ? (
              <EmptyMessage>인식된 음식이 없습니다.</EmptyMessage>
            ) : (
              results.map(item => (
                <FoodItemCard key={item.id}>
                  <FoodInfo>
                    <FoodName>{item.name}</FoodName>
                    <FoodQuantity>{item.quantity} ({item.grams}g)</FoodQuantity>
                    <NutritionInfo>
                      <NutrientItem>
                        <NutrientValue>{item.carbs}g</NutrientValue>
                        <NutrientLabel>탄수화물</NutrientLabel>
                      </NutrientItem>
                      <NutrientItem>
                        <NutrientValue>{item.protein}g</NutrientValue>
                        <NutrientLabel>단백질</NutrientLabel>
                      </NutrientItem>
                      <NutrientItem>
                        <NutrientValue>{item.fat}g</NutrientValue>
                        <NutrientLabel>지방</NutrientLabel>
                      </NutrientItem>
                    </NutritionInfo>
                    <Confidence $confidence={item.confidence} />
                  </FoodInfo>
                  <FoodCalories>{item.calories} kcal</FoodCalories>
                </FoodItemCard>
              ))
            )}
          </FoodItemsContainer>
          
          {results.length > 0 && (
            <>
              <TotalCalories>
                <TotalTitle>총 칼로리</TotalTitle>
                <TotalValue>{totalCalories} kcal</TotalValue>
              </TotalCalories>
              
              <MealSettingsSection>
                <MealSettingsTitle>식사 정보</MealSettingsTitle>
                <MealInputGroup>
                  <MealInputLabel>식사:</MealInputLabel>
                  <MealSelect 
                    value={selectedMealType} 
                    onChange={(e) => setSelectedMealType(e.target.value as MealType)}
                  >
                    {getAllMealTypes().map(meal => (
                      <option key={meal.value} value={meal.value}>
                        {meal.label}
                      </option>
                    ))}
                  </MealSelect>
                </MealInputGroup>
                <MealInputGroup>
                  <MealInputLabel>날짜:</MealInputLabel>
                  <MealDateInput 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </MealInputGroup>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                  {formatKoreanDate(selectedDate)} {getMealTypeDisplayName(selectedMealType)}으로 저장됩니다
                </div>
              </MealSettingsSection>
              
              <SaveButton onClick={handleSave}>결과 저장하기</SaveButton>
            </>
          )}
        </>
      )}
    </ResultsCard>
  );
};

export default ResultsDisplay;