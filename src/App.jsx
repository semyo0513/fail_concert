import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header, LoadingScreen } from './components/Common';
import { S01_Entry } from './screens/S01_Entry';
import { S02_WriteCV } from './screens/S02_WriteCV';
import { S03_GroupBoard } from './screens/S03_GroupBoard';
import { S04_Voting } from './screens/S04_Voting';
import { S05_Results } from './screens/S05_Results';
import { AdminDashboard } from './screens/AdminDashboard';
import { Clock, AlertTriangle } from 'lucide-react';

// 세션 대기 화면
const SessionWaitingScreen = () => {
  const { session } = useApp();
  return (
    <div className="w-full max-w-md mx-auto px-4 py-12 text-center fade-enter-active">
      <div className="glass-panel p-8 flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 animate-bounce">
          <Clock size={28} />
        </div>
        <h3 className="text-xl font-bold text-gray-200 brand-title mb-2">연수 대기실 입장 완료</h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-6">
          [{session?.title || '실패학 콘서트'}] 세션에 정상 연결되었습니다.<br />
          퍼실리테이터가 연수를 시작하여 실패 이력서 작성 단계를 열 때까지 잠시 대기해 주세요.
        </p>
        <span className="text-[10px] text-purple-400 animate-pulse font-medium bg-purple-500/5 px-2.5 py-1 rounded-full border border-purple-500/10">
          화면이 자동으로 실시간 전환됩니다. (새로고침 불필요)
        </span>
      </div>
    </div>
  );
};

// 메인 렌더러 컴포넌트 (AppContext 데이터 사용을 위해 Provider의 자식으로 배치)
const MainContent = () => {
  const { user, session } = useApp();
  const [isAdminView, setIsAdminView] = useState(false);

  // 1. 관리자 화면 진입 시
  if (isAdminView) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4">
          <AdminDashboard onNavigateToEntry={() => setIsAdminView(false)} />
        </main>
      </div>
    );
  }

  // 2. 로그인 전 또는 세션 연결 전
  if (!user.authorName || !session) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12">
        <main className="w-full">
          <S01_Entry onNavigateToAdmin={() => setIsAdminView(true)} />
        </main>
      </div>
    );
  }

  // 3. 로그인 후 세션 상태에 따른 동적 분기
  const renderScreenByStatus = () => {
    const status = session.status;
    
    if (status === 'waiting') {
      return <SessionWaitingScreen />;
    }
    if (status === 'writing') {
      return <S02_WriteCV />;
    }
    if (status === 'sharing') {
      return <S03_GroupBoard />;
    }
    if (status === 'voting') {
      return <S04_Voting />;
    }
    if (status.startsWith('closed')) {
      return <S05_Results />;
    }

    // 예외 오류 화면
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 text-center">
        <div className="glass-panel p-8">
          <AlertTriangle className="text-rose-400 mb-3 mx-auto" size={32} />
          <h4 className="font-bold text-gray-200">정의되지 않은 세션 단계</h4>
          <p className="text-xs text-gray-500 mt-2">세션의 진행 상태 값이 유효하지 않습니다. 관리자에게 문의해 주세요.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4">
        {renderScreenByStatus()}
      </main>
    </div>
  );
};

// Root App Component
function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
