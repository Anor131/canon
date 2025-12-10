import React, { useState } from 'react';
import { AppScreen } from './types';
import LoginScreen from './components/LoginScreen';
import EditorScreen from './components/EditorScreen';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.LOGIN);

  const navigateToEditor = () => {
    setCurrentScreen(AppScreen.EDITOR);
  };

  const navigateToLogin = () => {
    setCurrentScreen(AppScreen.LOGIN);
  };

  return (
    <div className="h-full w-full relative">
      {currentScreen === AppScreen.LOGIN && (
        <LoginScreen onEnter={navigateToEditor} />
      )}
      {currentScreen === AppScreen.EDITOR && (
        <EditorScreen onBack={navigateToLogin} />
      )}
    </div>
  );
};

export default App;