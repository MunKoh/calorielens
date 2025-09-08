import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  margin-top: ${props => props.theme.spacing.xxl};
  padding: ${props => props.theme.spacing.lg} 0;
  text-align: center;
  color: ${props => props.theme.colors.textLight};
  font-size: 0.9rem;
  border-top: 1px solid ${props => props.theme.colors.secondaryLight};
`;

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <p>&copy; 2025 CalorieLens. All rights reserved.</p>
    </FooterContainer>
  );
};

export default Footer;