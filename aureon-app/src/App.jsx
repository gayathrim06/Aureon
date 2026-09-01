import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppRouter } from './pages/AppRouter';
import { ThemeToggleWidget } from './components/common/ThemeToggleWidget';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemeToggleWidget />
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
