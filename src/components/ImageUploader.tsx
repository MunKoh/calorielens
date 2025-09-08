import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  reset?: boolean; // 초기화 트리거 prop 추가
}

const UploadCard = styled.div`
  background-color: ${props => props.theme.colors.cardBg};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.medium};
  padding: ${props => props.theme.spacing.lg};
  margin: ${props => props.theme.spacing.lg} 0;
  transition: all 0.3s ease;
`;

const DropArea = styled.div<{ isDragActive: boolean }>`
  border: 2px dashed ${props => props.isDragActive 
    ? props.theme.colors.primary 
    : props.theme.colors.textLight};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${props => props.isDragActive 
    ? props.theme.colors.secondaryLight 
    : 'transparent'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.secondaryLight};
  }
`;

const DropText = styled.p`
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text};
`;

const Button = styled.button`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.medium};
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: ${props => props.theme.spacing.md};
  width: 160px;
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryDark};
  }
`;

const FileInfo = styled.p`
  color: ${props => props.theme.colors.textLight};
  font-size: 0.8rem;
  margin-top: ${props => props.theme.spacing.md};
`;

const PreviewContainer = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => props.theme.shadows.small};
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: center;
  margin-top: ${props => props.theme.spacing.md};
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: ${props => props.theme.colors.textLight};
  border: 1px solid ${props => props.theme.colors.textLight};
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: ${props => props.theme.colors.text};
  }
`;

const AnalyzeButton = styled(Button)``;

const HiddenInput = styled.input`
  display: none;
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: ${props => props.theme.spacing.md} 0;
  width: 80%;
  
  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid ${props => props.theme.colors.textLight};
  }
  
  span {
    margin: 0 10px;
    color: ${props => props.theme.colors.textLight};
    font-size: 0.9rem;
  }
`;

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, reset }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProcessingFile = useRef<boolean>(false);

  const processFile = useCallback((file: File) => {
    // 이미 처리 중이면 중단
    if (isProcessingFile.current) return;
    
    console.log('파일 처리 시작:', file.name);
    // 처리 시작
    isProcessingFile.current = true;
    
    setSelectedFile(file);
    
    // 파일 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      console.log('파일 처리 완료:', file.name);
      // 처리 완료
      isProcessingFile.current = false;
    };
    reader.onerror = () => {
      console.error('파일 읽기 오류 발생');
      // 에러 발생 시에도 플래그 초기화
      isProcessingFile.current = false;
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const firstFile = acceptedFiles[0];
      if (firstFile) {
        console.log('파일 드롭됨:', firstFile.name);
        processFile(firstFile);
      }
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
    },
    maxSize: 10485760, // 10MB
    multiple: false,
    noClick: true, // 클릭 이벤트 비활성화
    noDragEventsBubbling: true
  });
  
  // 파일 선택 버튼 클릭 핸들러
  const handleSelectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (fileInputRef.current) {
      console.log('파일 선택 버튼 클릭');
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        console.log('파일 선택됨:', selectedFile.name);
        processFile(selectedFile);
        e.target.value = '';
      }
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      onImageSelect(selectedFile);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
  };
  
  // reset prop 변경 시 초기화
  React.useEffect(() => {
    if (reset) {
      console.log('이미지 업로드 컴포넌트 초기화');
      setPreview(null);
      setSelectedFile(null);
    }
  }, [reset]);

  return (
    <UploadCard>
      {!preview ? (
        <DropArea {...getRootProps()} isDragActive={isDragActive}>
          <HiddenInput {...getInputProps()} />
          <DropText>사진을 여기에 드래그하세요</DropText>
          <OrDivider>
            <span>또는</span>
          </OrDivider>
          <Button onClick={handleSelectClick}>사진 선택하기</Button>
          <HiddenInput 
            ref={fileInputRef}
            type="file" 
            accept="image/jpeg, image/png"
            onChange={handleFileInputChange}
          />
          <FileInfo>JPG, PNG 파일 (최대 10MB)</FileInfo>
        </DropArea>
      ) : (
        <PreviewContainer>
          <PreviewImage src={preview} alt="미리보기" />
          <ButtonContainer>
            <AnalyzeButton onClick={handleAnalyze}>분석하기</AnalyzeButton>
            <CancelButton onClick={handleCancel}>취소</CancelButton>
          </ButtonContainer>
        </PreviewContainer>
      )}
    </UploadCard>
  );
};

export default ImageUploader;