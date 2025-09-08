import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import styled from 'styled-components';

interface SettingsPageProps {
  onClose: () => void;
}

const SettingsContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.md};
`;

const SettingsPanel = styled.div`
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.large};
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: ${props => props.theme.spacing.md};
`;

const Title = styled.h1`
  margin: 0;
  color: ${props => props.theme.colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme.colors.textLight};
  transition: all 0.2s;
  
  &:hover {
    color: ${props => props.theme.colors.text};
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Tab = styled.button<{ active: boolean }>`
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border: none;
  background: none;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.text};
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  transition: all 0.2s;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const TabContent = styled.div`
  padding: ${props => props.theme.spacing.md} 0;
`;

const AboutContainer = styled.div`
  background-color: ${props => props.theme.colors.cardBg};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.md} 0;
`;

const StatusIndicator = styled.div<{ status: 'connected' | 'disconnected' }>`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
  background-color: ${props => 
    props.status === 'connected' ? 'rgba(75, 181, 67, 0.1)' : 'rgba(220, 53, 69, 0.1)'
  };
  border-left: 4px solid ${props => 
    props.status === 'connected' ? props.theme.colors.success : props.theme.colors.error
  };
  border-radius: ${props => props.theme.borderRadius.small};
`;

const StatusIcon = styled.span`
  font-size: 1.5rem;
  margin-right: ${props => props.theme.spacing.sm};
`;

const StatusText = styled.div`
  flex: 1;

  h4 {
    margin: 0 0 ${props => props.theme.spacing.xs} 0;
  }

  p {
    margin: 0;
  }
`;

const AppInfo = styled.div`
  margin: ${props => props.theme.spacing.md} 0;
  
  h3 {
    margin-top: 0;
    color: ${props => props.theme.colors.primary};
  }
  
  p {
    margin: ${props => props.theme.spacing.sm} 0;
    line-height: 1.5;
  }
`;

const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'database' | 'about'>('database');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  useEffect(() => {
    // Supabase 연결 상태 확인
    const checkConnection = async () => {
      try {
        // 간단한 쿼리로 연결 테스트
        const { error } = await supabase.from('food_analyses').select('count', { count: 'exact', head: true });
        
        if (error) {
          console.error('Supabase 연결 오류:', error);
          setConnectionStatus('disconnected');
        } else {
          setConnectionStatus('connected');
        }
      } catch (err) {
        console.error('Supabase 연결 확인 중 오류:', err);
        setConnectionStatus('disconnected');
      }
    };
    
    checkConnection();
  }, []);

  const handleTabChange = (tab: 'database' | 'about') => {
    setActiveTab(tab);
  };

  return (
    <SettingsContainer>
      <SettingsPanel>
        <Header>
          <Title>CalorieLens 설정</Title>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </Header>
        
        <TabContainer>
          <Tab 
            active={activeTab === 'database'} 
            onClick={() => handleTabChange('database')}
          >
            데이터베이스 연결
          </Tab>
          <Tab 
            active={activeTab === 'about'} 
            onClick={() => handleTabChange('about')}
          >
            앱 정보
          </Tab>
        </TabContainer>
        
        <TabContent>
          {activeTab === 'database' && (
            <AboutContainer>
              <StatusIndicator status={connectionStatus}>
                <StatusIcon>
                  {connectionStatus === 'connected' ? '✅' : '❌'}
                </StatusIcon>
                <StatusText>
                  <h4>
                    {connectionStatus === 'connected' 
                      ? 'Supabase 데이터베이스 모드가 활성화되어 있습니다' 
                      : '로컬 스토리지 모드가 활성화되어 있습니다'}
                  </h4>
                  <p>
                    {connectionStatus === 'connected'
                      ? '모든 데이터는 Supabase 클라우드 데이터베이스에 저장됩니다. 다른 기기에서도 데이터를 불러올 수 있습니다.'
                      : 'Supabase 데이터베이스 연결에 실패했습니다. 로컬 스토리지에 데이터를 저장합니다.'}
                  </p>
                </StatusText>
              </StatusIndicator>
              <AppInfo>
                <h3>데이터베이스 설정</h3>
                <p>
                  <strong>현재 모드:</strong> {connectionStatus === 'connected' ? 'Supabase 클라우드 저장소' : '로컬 브라우저 저장소'}
                </p>
                <p>
                  <strong>데이터 위치:</strong> {connectionStatus === 'connected' ? '클라우드 (Supabase)' : '로컬 (브라우저)'}
                </p>
                <p>
                  <strong>데이터베이스 URL:</strong> {connectionStatus === 'connected' ? 'https://mldpmrydkdxldctwefrx.supabase.co' : '연결 없음'}
                </p>
              </AppInfo>
            </AboutContainer>
          )}
          
          {activeTab === 'about' && (
            <AboutContainer>
              <AppInfo>
                <h3>CalorieLens</h3>
                <p>버전: 1.0.0</p>
                <p>음식 사진을 분석하여 칼로리를 계산해주는 웹 애플리케이션입니다.</p>
              </AppInfo>
              
              <AppInfo>
                <h3>기술 스택</h3>
                <ul>
                  <li>React + TypeScript</li>
                  <li>Styled Components</li>
                  <li>Supabase (데이터베이스 및 스토리지)</li>
                  <li>LocalStorage (백업 데이터 저장)</li>
                </ul>
              </AppInfo>
              
              <AppInfo>
                <h3>데이터 저장 모드</h3>
                <p>
                  <strong>Supabase 모드</strong>: 현재 활성화된 모드로, 데이터가 클라우드 데이터베이스에 저장됩니다.
                  다른 기기에서도 동일한 데이터에 접근할 수 있습니다.
                </p>
                <p>
                  <strong>로컬 스토리지 모드</strong>: Supabase 연결이 불가능한 경우 사용되는 모드로,
                  브라우저의 로컬 스토리지에 데이터를 저장합니다.
                </p>
              </AppInfo>
            </AboutContainer>
          )}
        </TabContent>
      </SettingsPanel>
    </SettingsContainer>
  );
};

export default SettingsPage;