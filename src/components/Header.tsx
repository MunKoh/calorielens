import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  color: white;
  padding: ${props => props.theme.spacing.lg} 0;
  text-align: center;
  position: relative;
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
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 1;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    top: ${props => props.theme.spacing.sm};
    right: ${props => props.theme.spacing.sm};
    font-size: 1.2rem;
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