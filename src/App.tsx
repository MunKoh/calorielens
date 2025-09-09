import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { ThemeProvider } from 'styled-components';
import { theme } from './theme';
import Header from './components/Header';
import DailyCalorieTracker from './components/DailyCalorieTracker';
import ImageUploader from './components/ImageUploader';
import ResultsDisplay, { FoodItem } from './components/ResultsDisplay';
import HistoryList, { HistoryItem } from './components/HistoryList';
import DetailPopup from './components/DetailPopup';
import Footer from './components/Footer';
import SettingsPage from './pages/SettingsPage';
import { analyzeFood } from './services/foodDetectionService';
import { saveHistoryItem, getHistoryItems, deleteHistoryItem, clearAllHistory } from './services/historyService';
import { calculateDailyIntake, saveCalorieGoal, getCalorieGoal } from './services/dailyCalorieService';
import { MealType } from './utils/mealTimeUtils';
import { initializeSupabaseSchema } from './services/supabaseSetup';
import { testStorageConnection } from './services/supabaseStorageSetup';
import { uploadImage } from './services/supabaseStorageService';
import { ErrorHandler, NotificationService } from './utils/errorHandler';
import './App.css';

const GlobalStyles = styled.div`
  font-family: ${props => props.theme.fonts.main};
  color: ${props => props.theme.colors.text};
  background-color: ${props => props.theme.colors.background};
  min-height: 100vh;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.sm};
  }
`;

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [foodResults, setFoodResults] = useState<FoodItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [dailyIntake, setDailyIntake] = useState<number>(0);
  const [resetUploader, setResetUploader] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // 컴포넌트 언마운트 시 메모리 정리
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('앱 초기화 시작...');
        
        // Supabase 환경변수 확인
        if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
          console.warn('Supabase 환경변수가 설정되지 않음. 로컬 모드로 실행됩니다.');
          return;
        }
        
        // 1. Supabase 스키마 초기화
        await initializeSupabaseSchema();
        
        // 2. Storage 연결 테스트 및 초기화
        await testStorageConnection();
        
        // 3. 히스토리 데이터 로드
        const savedHistory = await getHistoryItems();
        setHistory(savedHistory);
        const todaysIntake = calculateDailyIntake(savedHistory);
        setDailyIntake(todaysIntake);
        
        console.log('앱 초기화 완료');
      } catch (error) {
        console.error('앱 초기화 실패:', error);
        // 에러가 발생해도 앱이 크래시되지 않도록 방어
        const appError = ErrorHandler.handle(error, '앱 초기화');
        ErrorHandler.logError(appError);
        NotificationService.error(appError.message);
      }
    };
    initializeApp();
  }, []);

  const handleImageSelect = (file: File) => {
    // 이전 프리뷰 URL 정리 (메모리 누수 방지)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedImage(file);
    setError(null);
    const imageUrl = URL.createObjectURL(file);
    setPreviewUrl(imageUrl);
    handleAnalyzeImage(file);
  };

  const handleAnalyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setShowResults(true);
    setFoodResults([]);
    try {
      const results = await analyzeFood(file);
      if (results && results.length > 0) {
        setFoodResults(results);
      } else {
        setError('음식을 분석할 수 없습니다. 다른 사진을 시도해보세요.');
      }
    } catch (error) {
      const appError = ErrorHandler.handle(error, '음식 분석');
      ErrorHandler.logError(appError);
      setError(appError.message);
      NotificationService.error(appError.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveResult = async (mealType: MealType, mealDate: string) => {
    console.log('=== 결과 저장하기 버튼 클릭됨 ===');
    console.log('selectedImage:', selectedImage?.name);
    console.log('foodResults 개수:', foodResults.length);
    console.log('mealType:', mealType);
    console.log('mealDate:', mealDate);
    
    if (selectedImage && foodResults.length > 0) {
      console.log('저장 조건 통과 - 저장 시작');
      try {
        // 1. 이미지 업로드
        console.log('이미지 업로드 시작...');
        const imageUrlForStorage = await uploadImage(selectedImage);
        if (!imageUrlForStorage) {
          throw new Error('이미지 업로드 실패');
        }
        console.log('이미지 업로드 성공:', imageUrlForStorage);
        
        // 2. 히스토리 저장
        console.log('히스토리 저장 시작...');
        await saveHistoryItem(foodResults, imageUrlForStorage, mealType, mealDate);
        console.log('히스토리 저장 성공');
        
        // 3. 히스토리 새로고침 및 UI 업데이트
        const updatedHistory = await getHistoryItems();
        setHistory(updatedHistory);
        const newDailyIntake = calculateDailyIntake(updatedHistory);
        setDailyIntake(newDailyIntake);
        
        // 4. UI 새로고침 및 메모리 정리
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        
        // 분석창 완전 초기화 - 모든 상태 리셋
        setShowResults(false);
        setSelectedImage(null);
        setPreviewUrl(null);
        setFoodResults([]);
        setError(null);
        setIsAnalyzing(false);
        
        // ImageUploader 완전 초기화
        setResetUploader(prev => !prev);
        
        // 약간의 지연 후 한번 더 초기화 (확실한 UI 리셋)
        setTimeout(() => {
          setShowResults(false);
          setSelectedImage(null);
          setPreviewUrl(null);
          setFoodResults([]);
          setError(null);
        }, 100);
        
        // 성공 메시지 표시
        NotificationService.success('결과가 히스토리에 저장되었습니다.');
        
        console.log('분석창 초기화 완료');
      } catch (error: any) {
        const appError = ErrorHandler.handle(error, '결과 저장');
        ErrorHandler.logError(appError);
        NotificationService.error(`결과 저장에 실패했습니다: ${appError.message}`);
      }
    } else {
      console.log('❌ 저장 조건 실패:');
      console.log('- selectedImage 있음:', !!selectedImage);
      console.log('- foodResults 개수:', foodResults.length);
      
      if (!selectedImage) {
        NotificationService.error('저장할 이미지가 없습니다.');
      } else if (foodResults.length === 0) {
        NotificationService.error('저장할 분석 결과가 없습니다.');
      }
    }
  };

  const handleHistoryItemClick = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
  };

  const handleClosePopup = () => {
    setSelectedHistoryItem(null);
  };

  const handleGoalChange = async (newGoal: number) => {
    try {
      await saveCalorieGoal(newGoal);
    } catch (error) {
      const appError = ErrorHandler.handle(error, '목표 칼로리 저장');
      ErrorHandler.logError(appError);
      NotificationService.error(appError.message);
    }
  };

  const handleDeleteHistoryItem = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const itemToDelete = history.find(item => item.id === id);
    if (itemToDelete && window.confirm('이 항목을 삭제하시겠습니까?')) {
      try {
        await deleteHistoryItem(itemToDelete);
        const updatedHistory = await getHistoryItems();
        setHistory(updatedHistory);
        const newDailyIntake = calculateDailyIntake(updatedHistory);
        setDailyIntake(newDailyIntake);
        if (selectedHistoryItem && selectedHistoryItem.id === id) {
          setSelectedHistoryItem(null);
        }
      } catch (error) {
        const appError = ErrorHandler.handle(error, '항목 삭제');
        ErrorHandler.logError(appError);
        NotificationService.error('항목을 삭제하는 도중 오류가 발생했습니다.');
      }
    }
  };

  const handleClearAllHistory = async () => {
    if (window.confirm('모든 히스토리를 삭제하시겠습니까?')) {
      try {
        await clearAllHistory(history);
        setHistory([]);
        setDailyIntake(0);
        setShowResults(false);
        setSelectedHistoryItem(null);
        NotificationService.success('모든 히스토리가 삭제되었습니다.');
      } catch (error) {
        const appError = ErrorHandler.handle(error, '전체 히스토리 삭제');
        ErrorHandler.logError(appError);
        NotificationService.error('전체 히스토리를 삭제하는 도중 오류가 발생했습니다.');
      }
    }
  };

  const handleToggleSettings = () => {
    setShowSettings(prev => !prev);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles>
        <Header onSettingsClick={handleToggleSettings} />
        <Container>
          <DailyCalorieTracker 
            dailyIntake={dailyIntake}
            onGoalChange={handleGoalChange}
            historyItems={history}
          />
          <ImageUploader 
            onImageSelect={handleImageSelect} 
            reset={resetUploader} 
          />
          {showResults && (
            <ResultsDisplay 
              isLoading={isAnalyzing}
              results={foodResults}
              onSave={handleSaveResult}
              error={error}
            />
          )}
          <HistoryList 
            history={history}
            onItemClick={handleHistoryItemClick}
            onDeleteItem={handleDeleteHistoryItem}
            onClearAll={handleClearAllHistory}
          />
          <DetailPopup 
            item={selectedHistoryItem} 
            onClose={handleClosePopup} 
          />
        </Container>
        <Footer />
        {showSettings && (
          <SettingsPage onClose={handleCloseSettings} />
        )}
      </GlobalStyles>
    </ThemeProvider>
  );
};

export default App;