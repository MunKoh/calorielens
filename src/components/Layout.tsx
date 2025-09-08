import React from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from '../theme';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.sm};
  }
`;

const Main = styled.main`
  padding: ${props => props.theme.spacing.lg} 0;
`;

const Footer = styled.footer`
  margin-top: ${props => props.theme.spacing.xxl};
  padding: ${props => props.theme.spacing.lg} 0;
  text-align: center;
  color: ${props => props.theme.colors.textLight};
  font-size: 0.9rem;
  border-top: 1px solid ${props => props.theme.colors.secondaryLight};
`;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <Header />
      <Container>
        <Main>
          {children}
        </Main>
        <Footer>
          <p>&copy; 2025 CalorieLens. All rights reserved.</p>
        </Footer>
      </Container>
    </ThemeProvider>
  );
};

export default Layout;