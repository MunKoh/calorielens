import React from 'react';
import styled from 'styled-components';
import { HistoryItem } from './HistoryList';

interface DetailPopupProps {
  item: HistoryItem | null;
  onClose: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.md};
`;

const PopupContainer = styled.div`
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.large};
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    width: 95%;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.cardBg};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  color: ${props => props.theme.colors.textLight};
  z-index: 5;
  
  &:hover {
    background-color: ${props => props.theme.colors.error};
    color: white;
  }
`;

const PopupContent = styled.div`
  display: flex;
  flex-direction: column;
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    width: 50%;
  }
`;

const FoodImage = styled.img`
  width: 100%;
  max-height: 350px;
  object-fit: contain;
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => props.theme.shadows.small};
`;

const DetailsContainer = styled.div`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    width: 50%;
  }
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text};
  margin-top: 0;
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: 1.5rem;
`;

const DateText = styled.p`
  color: ${props => props.theme.colors.textLight};
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: 1rem;
`;

const TotalCalories = styled.div`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.medium};
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const TotalTitle = styled.span`
  font-size: 1.1rem;
`;

const TotalValue = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
`;

const FoodList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const FoodItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: ${props => props.theme.spacing.sm} 0;
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
  margin-bottom: 4px;
`;

const NutritionInfo = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: 8px;
  margin-bottom: 4px;
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
  font-size: 0.85rem;
`;

const NutrientLabel = styled.span`
  color: ${props => props.theme.colors.textLight};
  font-size: 0.75rem;
`;

const ConfidenceBar = styled.div<{ confidence: number }>`
  width: 60px;
  height: 6px;
  background-color: ${props => props.theme.colors.secondaryLight};
  border-radius: ${props => props.theme.borderRadius.small};
  margin-top: 4px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.confidence}%;
    background-color: ${props => {
      if (props.confidence > 75) return props.theme.colors.success;
      if (props.confidence > 50) return props.theme.colors.secondary;
      return props.theme.colors.error;
    }};
    border-radius: ${props => props.theme.borderRadius.small};
  }
`;

const FoodCalories = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primaryDark};
  text-align: right;
`;

const DetailPopup: React.FC<DetailPopupProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <Overlay onClick={onClose}>
      <PopupContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        <PopupContent>
          <ImageContainer>
            <FoodImage src={item.imageUrl} alt="음식 이미지" />
          </ImageContainer>
          <DetailsContainer>
            <Title>음식 상세 정보</Title>
            <DateText>{item.date} 기록</DateText>
            
            <TotalCalories>
              <TotalTitle>총 칼로리</TotalTitle>
              <TotalValue>{item.totalCalories} kcal</TotalValue>
            </TotalCalories>
            
            <FoodList>
              {item.foods.map(food => (
                <FoodItem key={food.id}>
                  <FoodInfo>
                    <FoodName>{food.name}</FoodName>
                    <FoodQuantity>{food.quantity} ({food.grams}g)</FoodQuantity>
                    <NutritionInfo>
                      <NutrientItem>
                        <NutrientValue>{food.carbs}g</NutrientValue>
                        <NutrientLabel>탄수화물</NutrientLabel>
                      </NutrientItem>
                      <NutrientItem>
                        <NutrientValue>{food.protein}g</NutrientValue>
                        <NutrientLabel>단백질</NutrientLabel>
                      </NutrientItem>
                      <NutrientItem>
                        <NutrientValue>{food.fat}g</NutrientValue>
                        <NutrientLabel>지방</NutrientLabel>
                      </NutrientItem>
                    </NutritionInfo>
                    <ConfidenceBar confidence={food.confidence} />
                  </FoodInfo>
                  <FoodCalories>{food.calories} kcal</FoodCalories>
                </FoodItem>
              ))}
            </FoodList>
          </DetailsContainer>
        </PopupContent>
      </PopupContainer>
    </Overlay>
  );
};

export default DetailPopup;