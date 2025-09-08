import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../services/supabaseClient';
// MigrationHelper 임포트 제거

interface SupabaseSetupProps {
  children?: React.ReactNode;
}

const SetupContainer = styled.div`
  background-color: ${props => props.theme.colors.cardBg};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  margin: ${props => props.theme.spacing.lg} 0;
  box-shadow: ${props => props.theme.shadows.medium};
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text};
  margin-top: 0;
`;

const StatusIndicator = styled.div<{ status: 'success' | 'error' | 'warning' }>`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.md} 0;
  background-color: ${props => 
    props.status === 'success' ? 'rgba(75, 181, 67, 0.1)' :
    props.status === 'error' ? 'rgba(220, 53, 69, 0.1)' :
    'rgba(255, 193, 7, 0.1)'
  };
  border-left: 4px solid ${props => 
    props.status === 'success' ? props.theme.colors.success :
    props.status === 'error' ? props.theme.colors.error :
    '#ffc107'
  };
  border-radius: ${props => props.theme.borderRadius.small};
`;

const StatusIcon = styled.span`
  font-size: 1.5rem;
  margin-right: ${props => props.theme.spacing.sm};
`;

const StatusText = styled.div`
  flex: 1;
`;

const InfoList = styled.ul`
  padding-left: 20px;
`;

const SupabaseSetup: React.FC<SupabaseSetupProps> = ({ children }) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'not_connected' | 'invalid_config'>('checking');
  const [databaseInfo, setDatabaseInfo] = useState<{
    tables: string[];
    tableCount: number;
    buckets: string[];
  } | null>(null);

  // Supabase 연결 확인
  useEffect(() => {
    const checkConnection = async () => {
      const url = process.env.REACT_APP_SUPABASE_URL;
      const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

      if (!url || !key || url === 'your-project-url' || key === 'your-anon-key') {
        setStatus('invalid_config');
        return;
      }

      try {
        // 간단한 쿼리로 연결 테스트
        const { error } = await supabase.from('food_analyses').select('count', { count: 'exact', head: true });
        
        if (error && (error as any).code === 'PGRST116') {
          // 테이블이 없는 경우 (PostgreSQL 오류 코드)
          setStatus('connected');
          await fetchDatabaseInfo();
        } else if (error) {
          console.error('Supabase 연결 오류:', error);
          setStatus('not_connected');
        } else {
          setStatus('connected');
          await fetchDatabaseInfo();
        }
      } catch (err) {
        console.error('Supabase 연결 확인 중 오류:', err);
        setStatus('not_connected');
      }
    };

    checkConnection();
  }, []);

  // 데이터베이스 정보 가져오기
  const fetchDatabaseInfo = async () => {
    try {
      // 테이블 목록 조회 (PostgreSQL 시스템 테이블 사용)
      const { data: tables, error: tableError } = await supabase
        .rpc('get_tables_info');

      // 스토리지 버킷 목록 조회
      const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();

      if (tableError) {
        console.error('테이블 정보 조회 오류:', tableError);
      }

      if (bucketError) {
        console.error('버킷 정보 조회 오류:', bucketError);
      }

      setDatabaseInfo({
        tables: tables?.map((t: any) => t.table_name) || [],
        tableCount: tables?.length || 0,
        buckets: buckets?.map(b => b.name) || [],
      });
    } catch (err) {
      console.error('데이터베이스 정보 조회 중 오류:', err);
    }
  };

  // 상태에 따른 컴포넌트 렌더링
  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <StatusIndicator status="warning">
            <StatusIcon>⌛</StatusIcon>
            <StatusText>Supabase 연결 확인 중...</StatusText>
          </StatusIndicator>
        );

      case 'connected':
        return (
          <>
            <StatusIndicator status="success">
              <StatusIcon>✅</StatusIcon>
              <StatusText>
                <strong>Supabase 연결됨!</strong>
                <p>Supabase 프로젝트에 성공적으로 연결되었습니다.</p>
              </StatusText>
            </StatusIndicator>

            {databaseInfo && (
              <div>
                <h3>데이터베이스 정보</h3>
                <InfoList>
                  <li>테이블 수: {databaseInfo.tableCount}</li>
                  <li>
                    테이블 목록: {databaseInfo.tables.length > 0 
                      ? databaseInfo.tables.join(', ') 
                      : '테이블이 없습니다 (스키마 설정 필요)'}
                  </li>
                  <li>
                    스토리지 버킷: {databaseInfo.buckets.length > 0 
                      ? databaseInfo.buckets.join(', ') 
                      : '버킷이 없습니다 (버킷 생성 필요)'}
                  </li>
                </InfoList>

                {(!databaseInfo.tables.includes('food_analyses') ||
                  !databaseInfo.tables.includes('food_items') ||
                  !databaseInfo.buckets.includes('food-images')) && (
                  <StatusIndicator status="warning">
                    <StatusIcon>⚠️</StatusIcon>
                    <StatusText>
                      <strong>추가 설정 필요</strong>
                      <p>Supabase 프로젝트에 필요한 테이블이나 버킷이 없습니다.</p>
                      <p>SQL 에디터에서 스키마 파일을 실행하고 'food-images' 버킷을 생성하세요.</p>
                    </StatusText>
                  </StatusIndicator>
                )}
              </div>
            )}

            {/* MigrationHelper 컴포넌트 제거 */}
          </>
        );

      case 'not_connected':
        return (
          <StatusIndicator status="error">
            <StatusIcon>❌</StatusIcon>
            <StatusText>
              <strong>Supabase 연결 실패</strong>
              <p>Supabase 프로젝트에 연결할 수 없습니다. URL과 API 키를 확인하세요.</p>
            </StatusText>
          </StatusIndicator>
        );

      case 'invalid_config':
        return (
          <StatusIndicator status="warning">
            <StatusIcon>⚠️</StatusIcon>
            <StatusText>
              <strong>Supabase 구성 필요</strong>
              <p>Supabase 환경 변수가 설정되지 않았습니다. 로컬 스토리지 모드로 작동합니다.</p>
              <p>.env 파일을 업데이트하여 Supabase를 구성하세요:</p>
              <pre>
                REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co<br />
                REACT_APP_SUPABASE_ANON_KEY=your-anon-key
              </pre>
            </StatusText>
          </StatusIndicator>
        );
    }
  };

  return (
    <SetupContainer>
      <Title>Supabase 설정</Title>
      {renderContent()}
      {children}
    </SetupContainer>
  );
};

export default SupabaseSetup;