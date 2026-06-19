import React from 'react';
import { LogOut, WifiOff, Award, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

// 1. 공통 헤더 컴포넌트
export const Header = () => {
  const { user, session, exitSession, isDemo } = useApp();

  const getStatusText = (status) => {
    switch (status) {
      case 'waiting': return '입장 대기 중';
      case 'writing': return '이력서 작성 중';
      case 'sharing': return '모둠 공유 중';
      case 'voting': return '시상 투표 중';
      case 'closed': return '결과 발표';
      default: return '오프라인';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'rgba(255, 255, 255, 0.4)';
      case 'writing': return 'var(--secondary-neon)';
      case 'sharing': return 'var(--primary-neon)';
      case 'voting': return 'var(--accent-pink)';
      case 'closed': return 'var(--success-emerald)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <header className="w-full max-w-6xl mx-auto px-4 py-6 flex items-center justify-between border-b border-white/5 mb-6">
      <div className="flex items-center gap-3">
        <h1 className="brand-title text-xl md:text-2xl font-black">실패학 콘서트</h1>
        {isDemo && (
          <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
            DEMO
          </span>
        )}
      </div>

      {user.authorName && session && (
        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs text-gray-400">{user.school}</span>
            <span className="text-sm font-bold text-gray-200">
              {user.authorName} <span className="text-xs font-normal text-purple-400">({user.groupCode === 'admin' ? '관리자' : `${user.groupCode.replace('10', '')}모둠`})</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: getStatusColor(session.status) }}
            />
            <span className="text-xs font-medium text-gray-300" style={{ color: getStatusColor(session.status) }}>
              {getStatusText(session.status)}
            </span>
          </div>

          <button 
            onClick={exitSession} 
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-rose-400 border border-white/5 transition-colors"
            title="세션 나가기"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
};

// 2. 단계 진행 인디케이터 (S-02 작성 시 사용)
export const StepIndicator = ({ currentStep, totalSteps = 3 }) => {
  const steps = [
    { num: 1, label: '사건 재구성' },
    { num: 2, label: '사망 진단 (5 Whys)' },
    { num: 3, label: '플랜 B 설계' }
  ];

  return (
    <div className="w-full max-w-md mx-auto mb-8 px-4">
      <div className="flex items-center justify-between relative">
        {/* 진행 배경선 */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 -translate-y-1/2 z-0" />
        
        {/* 채워지는 진행선 */}
        <div 
          className="absolute top-1/2 left-0 h-[2px] bg-cyan-400 -translate-y-1/2 z-0 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />

        {steps.map((s) => (
          <div key={s.num} className="flex flex-col items-center z-10">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border ${
                currentStep >= s.num 
                  ? 'bg-cyan-500 border-cyan-400 text-bg-space shadow-[0_0_12px_var(--secondary-neon-glow)]' 
                  : 'bg-bg-deep border-white/10 text-gray-500'
              }`}
            >
              {s.num}
            </div>
            <span className={`text-[10px] md:text-xs mt-2 font-medium ${
              currentStep >= s.num ? 'text-cyan-400 font-bold' : 'text-gray-500'
            }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. 전체 화면 로딩 오버레이
export const LoadingScreen = ({ message = '데이터 전송 중...' }) => {
  return (
    <div className="fixed inset-0 bg-bg-space/80 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
      <div className="spinner" />
      <p className="text-sm font-semibold text-cyan-400 brand-title tracking-wider animate-pulse">
        {message}
      </p>
    </div>
  );
};

// 4. 모달 프레임
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] fade-enter-active">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="font-bold text-lg text-gray-200">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-xl font-bold p-1"
          >
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
