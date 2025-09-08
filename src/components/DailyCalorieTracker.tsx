import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { DailyCalorieData, processAllDailyData, formatFullDate } from '../services/dailyCalorieService';

interface DailyCalorieTrackerProps {
  dailyIntake: number;
  onGoalChange: (newGoal: number) => Promise<void>;
  historyItems: any[];
}

const TrackerContainer = styled.div`
  background-color: ${props => props.theme.colors.cardBg};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.medium};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  transition: all 0.3s ease;
`;

const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text};
  margin: 0;
  font-size: 1.5rem;
`;

const DateText = styled.p`
  color: ${props => props.theme.colors.textLight};
  margin: ${props => props.theme.spacing.xs} 0 0;
  font-size: 0.9rem;
`;

const SettingsButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: ${props => props.theme.colors.textLight};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;


const MainCalorieSection = styled.div`
  background: linear-gradient(135deg, #3F72AF 0%, #112D4E 100%);
  padding: ${props => props.theme.spacing.md};
  border-radius: 12px;
  color: white;
  margin-bottom: ${props => props.theme.spacing.md};
  box-shadow: 0 2px 12px rgba(63, 114, 175, 0.2);
  position: relative;
`;




const CalorieHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
  position: relative;
  z-index: 1;
`;

const CalorieTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: white;
  
  &::before {
    content: '🎯';
    font-size: 0.8rem;
  }
`;

const CalorieMainDisplay = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const CalorieMainValue = styled.div`
  font-size: 1.6rem;
  font-weight: 800;
  color: white;
  margin-bottom: ${props => props.theme.spacing.xs};
  
  .slash {
    font-size: 1.3rem;
    margin: 0 4px;
  }
`;

const CalorieMainLabel = styled.div`
  font-size: 0.8rem;
  color: white;
  font-weight: 500;
  opacity: 0.8;
`;

const CalorieProgressContainer = styled.div`
  position: relative;
  margin: ${props => props.theme.spacing.sm} 0;
`;

const CalorieProgressBar = styled.div`
  width: 100%;
  height: 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
`;

const CalorieProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${props => Math.min(props.$percentage, 100)}%;
  background: linear-gradient(90deg, #DBE2EF, #F9F7F7);
  border-radius: 8px;
  transition: width 0.8s ease;
  position: relative;
`;

const CalorieProgressText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.7rem;
  font-weight: 700;
  color: #112D4E;
  z-index: 2;
`;

const CalorieStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.sm};
  text-align: center;
`;

const CalorieStatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const CalorieStatLabel = styled.div`
  font-size: 0.7rem;
  color: white;
  opacity: 0.8;
  font-weight: 500;
`;

const CalorieStatValue = styled.div<{ $isGreen?: boolean }>`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${props => props.$isGreen ? '#DBE2EF' : 'white'};
`;

const CalorieInfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  opacity: 0.9;
`;

const CalorieInfoValue = styled.span<{ $isOverLimit?: boolean }>`
  font-weight: 700;
  color: ${props => props.$isOverLimit ? '#ffd93d' : 'white'};
`;

const CalorieCardUnit = styled.span`
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.7;
`;


const CircularProgress = styled.div<{ $percentage: number; $isOverLimit?: boolean }>`
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      ${props => {
        if (props.$isOverLimit) return '#ff6b6b';
        if (props.$percentage >= 80) return '#ffa726';
        return '#4ade80';
      }} 0deg,
      ${props => {
        if (props.$isOverLimit) return '#ff6b6b';
        if (props.$percentage >= 80) return '#ffa726';
        return '#4ade80';
      }} ${props => Math.min(props.$percentage * 3.6, 360)}deg,
      rgba(255, 255, 255, 0.2) ${props => Math.min(props.$percentage * 3.6, 360)}deg,
      rgba(255, 255, 255, 0.2) 360deg
    );
    border-radius: 50%;
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 76px;
    height: 76px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    z-index: 1;
  }
`;

const CircularProgressText = styled.div<{ $percentage: number; $isOverLimit?: boolean }>`
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  
  .percentage {
    font-size: 1.4rem;
    line-height: 1;
    margin-bottom: 2px;
  }
  
  .label {
    font-size: 0.6rem;
    opacity: 0.9;
    font-weight: 600;
  }
  
  .icon {
    font-size: 1rem;
    margin-bottom: 4px;
  }
`;





const SettingsModal = styled.div`
  padding: ${props => props.theme.spacing.md};
  background-color: white;
  border-radius: ${props => props.theme.borderRadius.medium};
  margin-top: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.secondaryLight};
`;

const SettingsForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const InputGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${props => props.theme.spacing.xs};
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.textLight};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primaryLight + '40'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing.sm};
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: ${props => `${props.theme.spacing.xs} ${props.theme.spacing.md}`};
  border: none;
  border-radius: ${props => props.theme.borderRadius.small};
  cursor: pointer;
  font-weight: 500;
  background-color: ${props => props.primary ? props.theme.colors.primary : '#f5f5f5'};
  color: ${props => props.primary ? 'white' : props.theme.colors.text};
  
  &:hover {
    background-color: ${props => props.primary ? props.theme.colors.primaryDark : '#e5e5e5'};
  }
`;

const QuickButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
`;

const QuickButton = styled.button`
  padding: ${props => `${props.theme.spacing.xs} ${props.theme.spacing.sm}`};
  border: 1px solid ${props => props.theme.colors.secondaryLight};
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: white;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background-color: ${props => props.theme.colors.secondaryLight};
  }
`;

const HistorySection = styled.div`
  margin-top: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.secondaryLight};
  padding-top: ${props => props.theme.spacing.md};
`;

const HistoryTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const HistoryToggleButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    text-decoration: underline;
  }
`;

const MonthHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.xs} 0;
  background-color: ${props => props.theme.colors.secondaryLight + '30'};
  border-radius: ${props => props.theme.borderRadius.small};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.colors.secondaryLight + '50'};
  }
`;

const MonthLabel = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.primary};
`;

const MonthToggle = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textLight};
`;

const HistoryList = styled.div`
  margin-top: ${props => props.theme.spacing.sm};
  padding-left: ${props => props.theme.spacing.md};
`;

const HistoryItem = styled.div`
  background: ${props => props.theme.colors.cardBg};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
  box-shadow: ${props => props.theme.shadows.small};
  border: 1px solid ${props => props.theme.colors.secondaryLight + '30'};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.medium};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const HistoryItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const HistoryDate = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &::before {
    content: '📅';
    font-size: 0.9rem;
  }
`;

const HistoryCalories = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const HistoryMainInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const NutritionSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const NutritionItem = styled.div<{ type: 'carbs' | 'protein' | 'fat' }>`
  background: ${props => {
    switch(props.type) {
      case 'carbs': return 'linear-gradient(45deg, #93DA97, #5E936C)';
      case 'protein': return 'linear-gradient(45deg, #E8FFD7, #93DA97)';
      case 'fat': return 'linear-gradient(45deg, #5E936C, #3E5F44)';
    }
  }};
  color: ${props => props.type === 'protein' ? props.theme.colors.text : 'white'};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.small};
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  
  .value {
    display: block;
    font-size: 0.9rem;
    margin-bottom: 2px;
  }
  
  .label {
    opacity: 0.9;
    font-size: 0.7rem;
  }
`;

const GoalBadgeSmall = styled.div<{ achieved: boolean }>`
  background: ${props => props.achieved 
    ? 'linear-gradient(45deg, #93DA97, #5E936C)' 
    : 'linear-gradient(45deg, #ffa726, #ff9800)'};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: 15px;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &::before {
    content: ${props => props.achieved ? '"✅"' : '"⚡"'};
    font-size: 0.8rem;
  }
`;

const NutrientInfo = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textLight};
  margin: ${props => props.theme.spacing.xs} 0;
  display: flex;
  gap: ${props => props.theme.spacing.xs};
`;

const CalorieValue = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-right: ${props => props.theme.spacing.xs};
`;

const ProgressIndicator = styled.div<{ percentage: number }>`
  width: 60px;
  height: 8px;
  background-color: ${props => props.theme.colors.secondaryLight};
  border-radius: 4px;
  overflow: hidden;
  margin-left: ${props => props.theme.spacing.sm};
  
  &::before {
    content: '';
    display: block;
    height: 100%;
    width: ${props => Math.min(props.percentage, 100)}%;
    background-color: ${props => 
      props.percentage > 100 
        ? props.theme.colors.error 
        : props.theme.colors.primary};
    border-radius: 4px;
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: ${props => props.theme.colors.textLight};
  padding: ${props => props.theme.spacing.md} 0;
`;

// 종합 히스토리 섹션
const ComprehensiveHistorySection = styled.div`
  background: ${props => props.theme.colors.cardBg};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.medium};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const HistoryItemCard = styled.div`
  background: linear-gradient(135deg, #E8FFD7 0%, #FFFFFF 100%);
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.secondaryLight + '40'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    border-color: ${props => props.theme.colors.secondary};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const HistoryCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  padding-bottom: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.secondaryLight + '50'};
`;

const HistoryDateBadge = styled.div`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &::before {
    content: '📅';
    font-size: 0.8rem;
  }
`;

const CaloriesBadge = styled.div<{ percentage: number }>`
  background: ${props => {
    if (props.percentage > 110) return 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
    if (props.percentage >= 80) return 'linear-gradient(45deg, #93DA97, #5E936C)';
    return 'linear-gradient(45deg, #ffa726, #ff9800)';
  }};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &::before {
    content: ${props => {
      if (props.percentage > 110) return '"⚠️"';
      if (props.percentage >= 80) return '"✅"';
      return '"⚡"';
    }};
    font-size: 0.8rem;
  }
`;

const HistoryContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.md};
  }
`;

const FoodImageSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const FoodImage = styled.div`
  width: 100%;
  height: 120px;
  background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
  border-radius: ${props => props.theme.borderRadius.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: ${props => props.theme.colors.textLight};
  border: 2px dashed ${props => props.theme.colors.secondaryLight};
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '🍽️';
    position: absolute;
  }
`;

const FoodLabel = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textLight};
  font-weight: 500;
`;

const NutritionDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const CaloriesSummary = styled.div`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.medium};
  text-align: center;
  
  .main-calories {
    font-size: 1.8rem;
    font-weight: 800;
    margin-bottom: ${props => props.theme.spacing.xs};
  }
  
  .calories-label {
    font-size: 0.9rem;
    opacity: 0.9;
  }
`;

const MacronutrientGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.sm};
`;

const MacroCard = styled.div<{ type: 'carbs' | 'protein' | 'fat' }>`
  background: ${props => {
    switch(props.type) {
      case 'carbs': return 'linear-gradient(135deg, #93DA97, #5E936C)';
      case 'protein': return 'linear-gradient(135deg, #E8FFD7, #93DA97)';
      case 'fat': return 'linear-gradient(135deg, #5E936C, #3E5F44)';
    }
  }};
  color: ${props => props.type === 'protein' ? props.theme.colors.text : 'white'};
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.small};
  text-align: center;
  
  .macro-icon {
    font-size: 1.2rem;
    margin-bottom: 4px;
  }
  
  .macro-value {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 2px;
  }
  
  .macro-label {
    font-size: 0.7rem;
    opacity: 0.9;
  }
`;

// 영양소 현황 섹션
const NutritionSectionWrapper = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const NutritionSectionTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 ${props => props.theme.spacing.md} 0;
`;

const NutritionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  position: relative;
  z-index: 1;
`;

const NutritionTitle = styled.h3`
  color: white;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  &::before {
    content: '🥗';
    font-size: 1.5rem;
  }
`;

const NutritionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.md};
  }
`;

const NutritionCard = styled.div<{ type: 'carbs' | 'protein' | 'fat' }>`
  background: #F9F7F7;
  border: 1px solid #DBE2EF;
  border-radius: 12px;
  padding: ${props => props.theme.spacing.md};
  box-shadow: 0 2px 8px rgba(63, 114, 175, 0.08);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(63, 114, 175, 0.12);
    transform: translateY(-1px);
  }
`;

const NutritionProgress = styled.div<{ percentage: number; $isOver?: boolean }>`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-top: ${props => props.theme.spacing.xs};
  overflow: hidden;
  
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

const NutritionTarget = styled.div`
  font-size: 0.7rem;
  opacity: 0.9;
  margin-top: ${props => props.theme.spacing.xs};
`;

const ProfileButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: 0.8rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.primaryDark};
    transform: translateY(-1px);
  }
`;

const NutritionCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const NutritionCardTitle = styled.h4<{ type: 'carbs' | 'protein' | 'fat' }>`
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
  color: #112D4E;
`;

const NutritionCardValue = styled.div`
  font-size: 0.8rem;
  color: #3F72AF;
  font-weight: 500;
`;

const NutritionCurrentValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.xs};
  position: relative;
  z-index: 1;
`;

const NutritionTargetValue = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: ${props => props.theme.spacing.sm};
  position: relative;
  z-index: 1;
`;

const NutritionLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
`;

const NutritionProgressContainer = styled.div`
  position: relative;
  margin: ${props => props.theme.spacing.xs} 0;
`;

const NutritionProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: #DBE2EF;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
`;

const NutritionProgressFill = styled.div<{ $percentage: number; $isOver?: boolean; $type: 'carbs' | 'protein' | 'fat' }>`
  height: 100%;
  width: ${props => Math.min(props.$percentage, 100)}%;
  background: ${props => {
    if (props.$isOver) return 'linear-gradient(90deg, #ef4444, #dc2626)';
    return 'linear-gradient(90deg, #3F72AF, #112D4E)';
  }};
  border-radius: 6px;
  transition: width 0.6s ease;
  position: relative;
`;

const NutritionProgressText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
  z-index: 2;
`;

const NutritionStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  text-align: center;
`;

const NutritionStatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const NutritionStatLabel = styled.div`
  font-size: 0.65rem;
  color: #3F72AF;
  font-weight: 500;
`;

const NutritionStatValue = styled.div<{ $isGreen?: boolean }>`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${props => props.$isGreen ? '#3F72AF' : '#112D4E'};
`;

// 종합 기록 섹션
const ComprehensiveRecordWrapper = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ComprehensiveRecordTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #112D4E;
  margin: 0 0 ${props => props.theme.spacing.md} 0;
`;

const ComprehensiveRecordCard = styled.div`
  background: #F9F7F7;
  border: 1px solid #DBE2EF;
  border-radius: 12px;
  padding: ${props => props.theme.spacing.md};
  box-shadow: 0 2px 8px rgba(63, 114, 175, 0.08);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(63, 114, 175, 0.12);
    transform: translateY(-1px);
  }
`;

const RecordHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const RecordDate = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #112D4E;
`;

const RecordCalories = styled.div`
  font-size: 0.8rem;
  color: #3F72AF;
  font-weight: 500;
`;

const RecordProgressContainer = styled.div`
  position: relative;
  margin: ${props => props.theme.spacing.xs} 0;
`;

const RecordProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: #DBE2EF;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
`;

const RecordProgressFill = styled.div<{ $percentage: number }>`
  height: 100%;
  width: ${props => Math.min(props.$percentage, 100)}%;
  background: linear-gradient(90deg, #3F72AF, #112D4E);
  border-radius: 6px;
  transition: width 0.6s ease;
`;

const RecordProgressText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
  z-index: 2;
`;

const FoodPhotosContainer = styled.div`
  margin-top: ${props => props.theme.spacing.md};
  padding-top: ${props => props.theme.spacing.sm};
  border-top: 1px solid #DBE2EF;
`;

const FoodPhotosTitle = styled.div`
  font-size: 0.8rem;
  color: #3F72AF;
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const FoodPhotosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: ${props => props.theme.spacing.xs};
  max-height: 80px;
  overflow: hidden;
`;

const FoodPhotoItem = styled.div`
  width: 60px;
  height: 60px;
  background: #DBE2EF;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  border: 1px solid #3F72AF;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
    transform: scale(1.05);
    transition: all 0.2s ease;
  }
`;

const AIAdviceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  position: relative;
  z-index: 1;
`;

const AIIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.theme.colors.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  box-shadow: 0 4px 12px rgba(62, 95, 68, 0.3);
`;

const AITitle = styled.h3`
  color: ${props => props.theme.colors.text};
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const AIAdviceText = styled.p`
  color: ${props => props.theme.colors.text};
  line-height: 1.6;
  margin: 0;
  font-size: 1rem;
  position: relative;
  z-index: 1;
  font-weight: 500;
`;

// 목표 선택 섹션
const GoalSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  position: relative;
  z-index: 1;
`;

const GoalLabel = styled.span`
  color: ${props => props.theme.colors.text};
  font-weight: 600;
  font-size: 0.9rem;
`;

const GoalBadge = styled.div<{ active?: boolean }>`
  background: ${props => props.active 
    ? props.theme.colors.primary 
    : 'rgba(255, 255, 255, 0.8)'};
  color: ${props => props.active ? 'white' : props.theme.colors.text};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid ${props => props.active 
    ? props.theme.colors.primary 
    : 'rgba(62, 95, 68, 0.3)'};
  
  &:hover {
    background: ${props => props.active 
      ? props.theme.colors.primaryDark 
      : 'rgba(255, 255, 255, 1)'};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`;

const GoalButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  flex-wrap: wrap;
`;

// 팝업 오버레이
const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.md};
`;

const PopupContent = styled.div`
  background: white;
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme.colors.textLight};
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:hover {
    background: ${props => props.theme.colors.secondaryLight};
    color: ${props => props.theme.colors.text};
  }
`;


type NutritionGoal = 'muscle' | 'diet' | 'health';
type Gender = 'male' | 'female';

interface UserProfile {
  weight: number;
  height: number;
  gender: Gender;
  age: number;
}

const DailyCalorieTracker: React.FC<DailyCalorieTrackerProps> = ({ dailyIntake, onGoalChange, historyItems }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [goalCalories, setGoalCalories] = useState(2000);
  const [tempGoal, setTempGoal] = useState(goalCalories);
  const [today, setToday] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [dailyData, setDailyData] = useState<DailyCalorieData[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal>('health');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    weight: 70,
    height: 170,
    gender: 'male',
    age: 30
  });
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // 현재 날짜 설정 및 전체 날짜별 데이터 로드
  useEffect(() => {
    const now = new Date();
    setToday(formatFullDate(now));
    
    const loadDailyData = async () => {
      try {
        const allData = await processAllDailyData(historyItems);
        setDailyData(allData);
      } catch (error) {
        console.error('날짜별 데이터 로드 오류:', error);
      }
    };
    
    loadDailyData();
  }, [historyItems]);

  // 로컬 스토리지에서 목표 칼로리 로드
  useEffect(() => {
    const savedGoal = localStorage.getItem('calorielens_goal');
    if (savedGoal) {
      const parsedGoal = parseInt(savedGoal, 10);
      setGoalCalories(parsedGoal);
      setTempGoal(parsedGoal);
      onGoalChange(parsedGoal);
    }
  }, [onGoalChange]);

  // 데이터를 월별로 그룹화 (useMemo로 성능 최적화)
  const groupedData = useMemo(() => {
    const grouped: Record<string, DailyCalorieData[]> = {};
    dailyData.forEach(item => {
      // ISO 8601 날짜 (YYYY-MM-DD)를 기준으로 그룹화합니다.
      const monthKey = `${item.date.substring(0, 4)}년 ${item.date.substring(5, 7)}월`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey]!.push(item);
    });
    return grouped;
  }, [dailyData]);

  // 그룹화된 데이터가 변경될 때 확장 상태 초기화
  useEffect(() => {
    if (Object.keys(groupedData).length > 0) {
      const initialState: Record<string, boolean> = {};
      const currentMonthKey = `${new Date().getFullYear()}년 ${String(new Date().getMonth() + 1).padStart(2, '0')}월`;
      Object.keys(groupedData).forEach(month => {
        initialState[month] = month === currentMonthKey; // 현재 월만 펼침
      });
      setExpandedMonths(initialState);
    }
  }, [groupedData]);

  const handleSaveGoal = async () => {
    if (tempGoal >= 500 && tempGoal <= 10000) {
      try {
        setGoalCalories(tempGoal);
        localStorage.setItem('calorielens_goal', tempGoal.toString());
        await onGoalChange(tempGoal);
        setShowSettings(false);
      } catch (error) {
        console.error('목표 칼로리 저장 오류:', error);
        alert('목표 저장 중 오류가 발생했습니다.');
      }
    } else {
      alert('목표 칼로리는 500에서 10,000 사이여야 합니다.');
    }
  };

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  const percentage = Math.round((dailyIntake / goalCalories) * 100);
  const isOverLimit = percentage > 100;
  const quickGoals = [1500, 1800, 2000, 2200, 2500, 3000];
  const monthKeys = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));
  
  // 오늘의 영양소 데이터
  const todayData = dailyData.find(d => {
    const today = new Date().toISOString().split('T')[0];
    return d.date === today;
  });

  // 기초대사율 계산 (Harris-Benedict 공식)
  const calculateBMR = (profile: UserProfile): number => {
    const { weight, height, age, gender } = profile;
    if (gender === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
  };

  // 목표별 권장 칼로리 계산
  const calculateRecommendedCalories = (profile: UserProfile, goal: NutritionGoal): number => {
    const bmr = calculateBMR(profile);
    let activityMultiplier: number;
    
    switch(goal) {
      case 'muscle':
        // 근육 증가: BMR * 1.6-1.8 (활동적 + 근육 합성 에너지)
        activityMultiplier = 1.7;
        return Math.round(bmr * activityMultiplier + 300); // 추가 300kcal for 근육 합성
      case 'diet':
        // 다이어트: BMR * 1.3-1.5 (칼로리 적자)
        activityMultiplier = 1.4;
        return Math.round(bmr * activityMultiplier - 200); // 200kcal 적자
      case 'health':
      default:
        // 건강식단: BMR * 1.4-1.6 (보통 활동)
        activityMultiplier = 1.5;
        return Math.round(bmr * activityMultiplier);
    }
  };

  // 목표별 영양소 목표량 계산 (그램 기준)
  const getNutritionTargets = (goal: NutritionGoal, calories: number, profile: UserProfile) => {
    const proteinPerKg = goal === 'muscle' ? 2.2 : goal === 'diet' ? 1.8 : 1.2;
    const targetProtein = Math.round(profile.weight * proteinPerKg);
    
    const proteinCalories = targetProtein * 4;
    const remainingCalories = calories - proteinCalories;
    
    let carbRatio, fatRatio;
    switch(goal) {
      case 'muscle':
        carbRatio = 0.45; fatRatio = 0.55; // 근육 증가: 적당한 탄수화물, 건강한 지방
        break;
      case 'diet':
        carbRatio = 0.30; fatRatio = 0.70; // 다이어트: 저탄수화물, 고지방
        break;
      case 'health':
        carbRatio = 0.55; fatRatio = 0.45; // 건강식단: 균형잡힌
        break;
    }
    
    const targetCarbs = Math.round((remainingCalories * carbRatio) / 4);
    const targetFat = Math.round((remainingCalories * fatRatio) / 9);
    
    return { 
      protein: targetProtein, 
      carbs: targetCarbs, 
      fat: targetFat 
    };
  };

  // AI 조언 생성 함수 (개선됨) - 친근하고 따뜻한 말투
  const generateAIAdvice = () => {
    const carbs = todayData?.carbs || 0;
    const protein = todayData?.protein || 0;
    const fat = todayData?.fat || 0;
    
    const targets = getNutritionTargets(nutritionGoal, goalCalories, userProfile);
    const bmr = calculateBMR(userProfile);
    
    let advice = "";
    const encouragements = ["👍 화이팅!", "💪 잘하고 있어요!", "🌟 멋져요!", "😊 응원해요!", "🔥 완전 좋네요!"];
    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    
    if (dailyIntake === 0) {
      const goalEmoji = nutritionGoal === 'muscle' ? '💪' : nutritionGoal === 'diet' ? '🔥' : '🌿';
      const goalText = nutritionGoal === 'muscle' ? '멋진 몸매 만들기' : nutritionGoal === 'diet' ? '건강한 다이어트' : '균형잡힌 건강 식단';
      const genderText = userProfile.gender === 'male' ? '멋진 남성분' : '아름다운 여성분';
      
      advice = `안녕하세요! ${goalEmoji} ${goalText} 목표를 세우셨군요~ ${genderText}이시네요! 💫 
      ${userProfile.age}세 기준 기초대사율이 ${Math.round(bmr)}kcal 정도인데, 오늘은 특히 단백질 ${targets.protein}g 챙겨 드시면 좋을 것 같아요! 
      작은 시작이 큰 변화를 만든답니다 ✨`;
    } else {
      const proteinProgress = Math.round((protein / targets.protein) * 100);
      const carbsProgress = Math.round((carbs / targets.carbs) * 100);
      const fatProgress = Math.round((fat / targets.fat) * 100);
      
      // 목표별 개인화된 따뜻한 조언
      if (nutritionGoal === 'muscle') {
        if (proteinProgress < 80) {
          advice = `어머! 💪 근육 키우기 위해 노력하시는 모습이 정말 멋있어요~ 다만 단백질이 조금 더 필요할 것 같네요! 
          현재 ${protein}g 드셨는데 ${targets.protein}g까지 ${targets.protein - protein}g만 더 드시면 완벽해요! 
          달걀, 닭가슴살, 두부 같은 걸로 맛있게 채워보시는 건 어떨까요? 🥚🍗`;
        } else {
          advice = `와~ ${randomEncouragement} 단백질 ${proteinProgress}% 달성이라니 정말 대단해요! 
          이 정도면 근육님들이 완전 기뻐할 거예요 💪✨ 
          운동 후 30분 골든타임도 잊지 마시고, 꿀잠도 푹 주무셔야 근육이 쑥쑥 자라요~ 😴`;
        }
      } else if (nutritionGoal === 'diet') {
        if (carbsProgress > 120) {
          advice = `아이구~ 😅 다이어트 화이팅하시는 중인데 탄수화물이 살짝 많았네요! 
          현재 ${carbs}g (${carbsProgress}%)인데, 내일은 ${targets.carbs}g 정도로 조절해보시면 어떨까요? 
          대신 단백질이랑 좋은 지방으로 배 채우시면 포만감도 오래가고 더 건강해질 거예요! 🥗💚`;
        } else {
          advice = `${randomEncouragement} 다이어트 식단 정말 잘 지키고 계시네요! 탄수화물 ${carbsProgress}% 완벽해요~ 
          이런 식으로 꾸준히 하시면 분명 좋은 결과 있을 거예요! 
          브로콜리, 시금치 같은 초록 채소들로 더 든든하게 드세요 🥬🌿`;
        }
      } else {
        advice = `정말 균형잡힌 식사를 하고 계시네요! ${randomEncouragement} 
        단백질 ${proteinProgress}%, 탄수화물 ${carbsProgress}%, 지방 ${fatProgress}% 모두 훌륭해요~ 
        여기에 무지개 채소들(빨강, 노랑, 초록, 보라..)까지 더하시면 영양만점 완벽한 한 끼가 될 거예요! 🌈🥗`;
      }
      
      // 전체적인 칼로리에 대한 친근한 조언
      if (percentage > 110) {
        advice += ` 
        칼로리는 ${percentage}%로 조금 많이 드셨네요~ 괜찮아요! 내일 산책이나 계단 오르기로 균형 맞춰보시면 돼요! 🚶‍♀️💃`;
      } else if (percentage < 70) {
        advice += ` 
        어? 칼로리가 ${percentage}%로 좀 부족한 것 같아요! 너무 적게 드시면 오히려 몸이 힘들어해요~ 
        견과류나 과일로 맛있게 채워보세요! 🥜🍎`;
      } else {
        advice += ` 칼로리도 ${percentage}%로 딱 좋네요! 😊`;
      }
    }
    
    return advice;
  };


  // 사용자 프로필 저장 함수
  const handleProfileSave = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('calorielens_user_profile', JSON.stringify(newProfile));
    setShowProfileSettings(false);
    
    // 영양 목표별 권장 칼로리 계산
    const recommendedCalories = calculateRecommendedCalories(newProfile, nutritionGoal);
    if (goalCalories === 2000) { // 기본값이면 자동 설정
      setGoalCalories(recommendedCalories);
      setTempGoal(recommendedCalories);
      onGoalChange(recommendedCalories);
    }
  };

  // 영양 목표 변경 시 권장 칼로리 업데이트
  const handleGoalChangeWithRecommendation = (goal: NutritionGoal) => {
    setNutritionGoal(goal);
    localStorage.setItem('calorielens_nutrition_goal', goal);
    
    // 새로운 목표에 따른 권장 칼로리 계산
    const recommendedCalories = calculateRecommendedCalories(userProfile, goal);
    setTempGoal(recommendedCalories); // 설정 팝업에서 보여줄 임시 목표도 업데이트
  };

  // 데이터 불러오기
  useEffect(() => {
    const savedGoal = localStorage.getItem('calorielens_nutrition_goal') as NutritionGoal;
    if (savedGoal && ['muscle', 'diet', 'health'].includes(savedGoal)) {
      setNutritionGoal(savedGoal);
    }
    
    const savedProfile = localStorage.getItem('calorielens_user_profile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setUserProfile(profile);
      } catch (error) {
        console.error('프로필 로드 오류:', error);
      }
    }
  }, []);

  return (
    <TrackerContainer>
      <TitleContainer>
        <TitleGroup>
          <Title>오늘의 기록</Title>
          <DateText>{today}</DateText>
        </TitleGroup>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ProfileButton onClick={() => setShowProfileSettings(true)}>
            신체 정보 등록
          </ProfileButton>
          <ProfileButton onClick={() => setShowSettings(true)}>
            목표 칼로리 설정
          </ProfileButton>
        </div>
      </TitleContainer>

      {/* 개선된 칼로리 섹션 */}
      <MainCalorieSection>
        <CalorieHeader>
          <CalorieTitle>오늘의 칼로리</CalorieTitle>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#1f2937',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            ↗
          </button>
        </CalorieHeader>
        
        <CalorieMainDisplay>
          <CalorieMainValue>
            {dailyIntake.toLocaleString()}
            <span className="slash">/</span>
            {goalCalories.toLocaleString()}
          </CalorieMainValue>
          <CalorieMainLabel>칼로리</CalorieMainLabel>
        </CalorieMainDisplay>
        
        <CalorieProgressContainer>
          <CalorieProgressBar>
            <CalorieProgressFill $percentage={percentage} />
            <CalorieProgressText>{percentage}%</CalorieProgressText>
          </CalorieProgressBar>
        </CalorieProgressContainer>
        
        <CalorieStatsGrid>
          <CalorieStatItem>
            <CalorieStatLabel>섭취</CalorieStatLabel>
            <CalorieStatValue>{dailyIntake.toLocaleString()}</CalorieStatValue>
          </CalorieStatItem>
          
          <CalorieStatItem>
            <CalorieStatLabel>목표</CalorieStatLabel>
            <CalorieStatValue>{goalCalories.toLocaleString()}</CalorieStatValue>
          </CalorieStatItem>
          
          <CalorieStatItem>
            <CalorieStatLabel>남은량</CalorieStatLabel>
            <CalorieStatValue $isGreen={!isOverLimit}>
              {isOverLimit 
                ? `+${(dailyIntake - goalCalories).toLocaleString()}` 
                : `${(goalCalories - dailyIntake).toLocaleString()}`}
            </CalorieStatValue>
          </CalorieStatItem>
        </CalorieStatsGrid>
      </MainCalorieSection>

      {/* 영양소 현황 */}
      <NutritionSectionWrapper>
        <NutritionSectionTitle>영양소 현황</NutritionSectionTitle>
        
        <NutritionGrid>
          {(() => {
            const targets = getNutritionTargets(nutritionGoal, goalCalories, userProfile);
            const carbs = todayData?.carbs || 0;
            const protein = todayData?.protein || 0;
            const fat = todayData?.fat || 0;
            
            const carbsPercentage = Math.round((carbs / targets.carbs) * 100);
            const proteinPercentage = Math.round((protein / targets.protein) * 100);
            const fatPercentage = Math.round((fat / targets.fat) * 100);
            
            const carbsRemaining = Math.max(0, targets.carbs - carbs);
            const proteinRemaining = Math.max(0, targets.protein - protein);
            const fatRemaining = Math.max(0, targets.fat - fat);
            
            return (
              <>
                <NutritionCard type="carbs">
                  <NutritionCardHeader>
                    <NutritionCardTitle type="carbs">탄수화물</NutritionCardTitle>
                    <NutritionCardValue>{carbs}/{targets.carbs}g</NutritionCardValue>
                  </NutritionCardHeader>
                  
                  <NutritionProgressContainer>
                    <NutritionProgressBar>
                      <NutritionProgressFill 
                        $percentage={carbsPercentage} 
                        $isOver={carbs > targets.carbs}
                        $type="carbs"
                      />
                      <NutritionProgressText>{carbsPercentage}%</NutritionProgressText>
                    </NutritionProgressBar>
                  </NutritionProgressContainer>
                  
                  <NutritionStatsGrid>
                    <NutritionStatItem>
                      <NutritionStatLabel>섭취</NutritionStatLabel>
                      <NutritionStatValue>{carbs}g</NutritionStatValue>
                    </NutritionStatItem>
                    
                    <NutritionStatItem>
                      <NutritionStatLabel>목표</NutritionStatLabel>
                      <NutritionStatValue>{targets.carbs}g</NutritionStatValue>
                    </NutritionStatItem>
                    
                    <NutritionStatItem>
                      <NutritionStatLabel>남은량</NutritionStatLabel>
                      <NutritionStatValue $isGreen={carbsRemaining > 0}>
                        {carbsRemaining > 0 ? `${carbsRemaining}g` : '0g'}
                      </NutritionStatValue>
                    </NutritionStatItem>
                  </NutritionStatsGrid>
                </NutritionCard>
                
                <NutritionCard type="protein">
                  <NutritionCardHeader>
                    <NutritionCardTitle type="protein">단백질</NutritionCardTitle>
                    <NutritionCardValue>{protein}/{targets.protein}g</NutritionCardValue>
                  </NutritionCardHeader>
                  
                  <NutritionProgressContainer>
                    <NutritionProgressBar>
                      <NutritionProgressFill 
                        $percentage={proteinPercentage} 
                        $isOver={protein > targets.protein}
                        $type="protein"
                      />
                      <NutritionProgressText>{proteinPercentage}%</NutritionProgressText>
                    </NutritionProgressBar>
                  </NutritionProgressContainer>
                  
                  <NutritionStatsGrid>
                    <NutritionStatItem>
                      <NutritionStatLabel>섭취</NutritionStatLabel>
                      <NutritionStatValue>{protein}g</NutritionStatValue>
                    </NutritionStatItem>
                    
                    <NutritionStatItem>
                      <NutritionStatLabel>목표</NutritionStatLabel>
                      <NutritionStatValue>{targets.protein}g</NutritionStatValue>
                    </NutritionStatItem>
                    
                    <NutritionStatItem>
                      <NutritionStatLabel>남은량</NutritionStatLabel>
                      <NutritionStatValue $isGreen={proteinRemaining > 0}>
                        {proteinRemaining > 0 ? `${proteinRemaining}g` : '0g'}
                      </NutritionStatValue>
                    </NutritionStatItem>
                  </NutritionStatsGrid>
                </NutritionCard>
                
                <NutritionCard type="fat">
                  <NutritionCardHeader>
                    <NutritionCardTitle type="fat">지방</NutritionCardTitle>
                    <NutritionCardValue>{fat}/{targets.fat}g</NutritionCardValue>
                  </NutritionCardHeader>
                  
                  <NutritionProgressContainer>
                    <NutritionProgressBar>
                      <NutritionProgressFill 
                        $percentage={fatPercentage} 
                        $isOver={fat > targets.fat}
                        $type="fat"
                      />
                      <NutritionProgressText>{fatPercentage}%</NutritionProgressText>
                    </NutritionProgressBar>
                  </NutritionProgressContainer>
                  
                  <NutritionStatsGrid>
                    <NutritionStatItem>
                      <NutritionStatLabel>섭취</NutritionStatLabel>
                      <NutritionStatValue>{fat}g</NutritionStatValue>
                    </NutritionStatItem>
                    
                    <NutritionStatItem>
                      <NutritionStatLabel>목표</NutritionStatLabel>
                      <NutritionStatValue>{targets.fat}g</NutritionStatValue>
                    </NutritionStatItem>
                    
                    <NutritionStatItem>
                      <NutritionStatLabel>남은량</NutritionStatLabel>
                      <NutritionStatValue $isGreen={fatRemaining > 0}>
                        {fatRemaining > 0 ? `${fatRemaining}g` : '0g'}
                      </NutritionStatValue>
                    </NutritionStatItem>
                  </NutritionStatsGrid>
                </NutritionCard>
              </>
            );
          })()}
        </NutritionGrid>
      </NutritionSectionWrapper>


      {/* AI 조언 섹션 */}
      <div style={{ 
        background: 'linear-gradient(135deg, #DBE2EF 0%, #F9F7F7 100%)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        border: '1px solid #3F72AF'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          marginBottom: '12px' 
        }}>
          <div style={{ 
            background: '#3F72AF', 
            color: 'white', 
            borderRadius: '50%', 
            width: '32px', 
            height: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1rem'
          }}>🤖</div>
          <h4 style={{ 
            margin: '0', 
            color: '#112D4E', 
            fontSize: '1rem', 
            fontWeight: '600' 
          }}>AI 영양 코치</h4>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#3F72AF', fontWeight: '500' }}>목표:</span>
          {['muscle', 'diet', 'health'].map((goal) => (
            <button
              key={goal}
              onClick={() => handleGoalChangeWithRecommendation(goal as any)}
              style={{
                background: nutritionGoal === goal ? '#3F72AF' : 'white',
                color: nutritionGoal === goal ? 'white' : '#112D4E',
                border: `1px solid #3F72AF`,
                borderRadius: '16px',
                padding: '4px 12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {goal === 'muscle' ? '💪 근육증가' : goal === 'diet' ? '🔥 다이어트' : '🌿 건강식단'}
            </button>
          ))}
        </div>
        
        <p style={{ 
          margin: '0', 
          color: '#112D4E', 
          fontSize: '0.9rem', 
          lineHeight: '1.5' 
        }}>
          {generateAIAdvice()}
        </p>
      </div>


      

      {showSettings && (
        <PopupOverlay onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
          <PopupContent>
            <CloseButton onClick={() => setShowSettings(false)}>×</CloseButton>
            <SettingsForm onSubmit={(e) => { e.preventDefault(); handleSaveGoal(); }}>
              <h3 style={{margin: '0 0 24px 0', color: '#3E5F44', textAlign: 'center'}}>🎯 목표 칼로리 설정</h3>
              
              <InputGroup>
                <Label htmlFor="goal-calories">일일 목표 칼로리</Label>
                <Input 
                  id="goal-calories"
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(parseInt(e.target.value) || 0)}
                  placeholder="목표 칼로리 입력"
                  min="500"
                  max="10000"
                />
                <QuickButtons>
                  {quickGoals.map(goal => (
                    <QuickButton key={goal} type="button" onClick={() => setTempGoal(goal)}>
                      {goal} kcal
                    </QuickButton>
                  ))}
                </QuickButtons>
              </InputGroup>
              
              <div style={{
                background: 'linear-gradient(135deg, #E8FFD7, #93DA97)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.9rem',
                color: '#3E5F44'
              }}>
                {(() => {
                  const recommendedCalories = calculateRecommendedCalories(userProfile, nutritionGoal);
                  const bmr = Math.round(calculateBMR(userProfile));
                  const goalText = nutritionGoal === 'muscle' ? '근육 증가' : nutritionGoal === 'diet' ? '다이어트' : '건강식단';
                  
                  return (
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        🎯 <strong>{goalText} 목표 맞춤 추천</strong>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        📊 기초대사율: {bmr}kcal
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        ⭐ 권장 칼로리: <strong>{recommendedCalories}kcal</strong>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setTempGoal(recommendedCalories)}
                        style={{
                          background: '#3E5F44',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        추천 칼로리 적용하기
                      </button>
                    </div>
                  );
                })()}
              </div>
              
              <ButtonGroup>
                <Button type="button" onClick={() => setShowSettings(false)}>취소</Button>
                <Button primary type="submit">저장</Button>
              </ButtonGroup>
            </SettingsForm>
          </PopupContent>
        </PopupOverlay>
      )}

      {showProfileSettings && (
        <PopupOverlay onClick={(e) => e.target === e.currentTarget && setShowProfileSettings(false)}>
          <PopupContent>
            <CloseButton onClick={() => setShowProfileSettings(false)}>×</CloseButton>
            <SettingsForm onSubmit={(e) => { 
              e.preventDefault(); 
              const formData = new FormData(e.target as HTMLFormElement);
              const newProfile: UserProfile = {
                weight: parseFloat(formData.get('weight') as string) || userProfile.weight,
                height: parseFloat(formData.get('height') as string) || userProfile.height,
                age: parseInt(formData.get('age') as string) || userProfile.age,
                gender: (formData.get('gender') as Gender) || userProfile.gender
              };
              handleProfileSave(newProfile);
            }}>
              <h3 style={{margin: '0 0 24px 0', color: '#3E5F44', textAlign: 'center'}}>👤 내 정보 설정</h3>
              
              <InputGroup>
                <Label htmlFor="weight">몸무게 (kg)</Label>
                <Input 
                  id="weight"
                  name="weight"
                  type="number"
                  defaultValue={userProfile.weight}
                  placeholder="몸무게 입력"
                  min="30"
                  max="200"
                  step="0.1"
                />
              </InputGroup>
              
              <InputGroup>
                <Label htmlFor="height">키 (cm)</Label>
                <Input 
                  id="height"
                  name="height"
                  type="number"
                  defaultValue={userProfile.height}
                  placeholder="키 입력"
                  min="100"
                  max="250"
                />
              </InputGroup>
              
              <InputGroup>
                <Label htmlFor="age">나이</Label>
                <Input 
                  id="age"
                  name="age"
                  type="number"
                  defaultValue={userProfile.age}
                  placeholder="나이 입력"
                  min="10"
                  max="100"
                />
              </InputGroup>
              
              <InputGroup>
                <Label htmlFor="gender">성별</Label>
                <select 
                  id="gender"
                  name="gender"
                  defaultValue={userProfile.gender}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #666',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </InputGroup>
              
              <ButtonGroup>
                <Button type="button" onClick={() => setShowProfileSettings(false)}>취소</Button>
                <Button primary type="submit">저장</Button>
              </ButtonGroup>
            </SettingsForm>
          </PopupContent>
        </PopupOverlay>
      )}
    </TrackerContainer>
  );
};

export default DailyCalorieTracker;
