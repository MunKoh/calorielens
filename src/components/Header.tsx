import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.primaryLight});
  color: white;
  padding: ${props => props.theme.spacing.xl} 0;
  text-align: center;
  position: relative;
  box-shadow: ${props => props.theme.shadows.medium};
  backdrop-filter: blur(10px);
`;

const Logo = styled.h1`
  font-size: 2.5rem;
  margin: 0;
  margin-bottom: ${props => props.theme.spacing.sm};
  font-weight: 700;
`;

const Tagline = styled.p`
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.9;
`;

const SettingsButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.lg};
  right: ${props => props.theme.spacing.lg};
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    top: ${props => props.theme.spacing.md};
    right: ${props => props.theme.spacing.md};
    font-size: 1.2rem;
    width: 36px;
    height: 36px;
  }
`;

interface HeaderProps {
  onSettingsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  return (
    <HeaderContainer>
      <Logo>CalorieLens</Logo>
      <Tagline>사진 한 장으로 칼로리 확인하세요</Tagline>
      
      {onSettingsClick && (
        <SettingsButton onClick={onSettingsClick} aria-label="설정">
          ⚙️
        </SettingsButton>
      )}
    </HeaderContainer>
  );
};

export default Header;