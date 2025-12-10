import React from 'react';

interface LoginScreenProps {
  onEnter: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onEnter }) => {
  return (
    <div className="relative flex h-full w-full flex-col bg-background-light dark:bg-background-dark text-white/90 overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 right-0 p-6 sm:p-8 w-full z-10">
        <div className="flex justify-start">
          <p className="text-white/70 text-base font-normal leading-normal text-right">
            لتفعيل التطبيق الاتصال بالرقم
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center p-4 relative z-0">
        <div className="flex flex-col items-center justify-center text-center max-w-2xl w-full animate-fade-in-up">
          <h1 className="text-white tracking-widest text-4xl md:text-5xl font-bold leading-tight pb-6 font-grotesk">
            ANOR - MATRX
          </h1>
          <h2 className="text-primary text-3xl md:text-5xl font-bold leading-tight tracking-[0.015em] pb-2 font-grotesk">
            07882993377
          </h2>
          <p className="text-white/80 text-lg font-normal leading-normal pt-4">
            التفعيل المجاني لمدة 14 يوم
          </p>
        </div>
      </main>

      {/* Footer / Action */}
      <footer className="absolute bottom-0 left-0 p-6 sm:p-8 w-full z-10">
        <div className="flex justify-end">
          <button 
            onClick={onEnter}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-8 bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 text-background-dark text-lg font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/20"
          >
            <span className="truncate">الدخول للتطبيق</span>
            <span className="material-symbols-outlined mr-2 rtl:ml-2 rtl:mr-0 text-xl">login</span>
          </button>
        </div>
      </footer>

      {/* Background decoration (Subtle gradient) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default LoginScreen;