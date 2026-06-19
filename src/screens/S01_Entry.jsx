import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';


export const S01_Entry = ({ onNavigateToAdmin }) => {
  const { enterSession, user, error, isLoading, isDemo } = useApp();
  const [authorName, setAuthorName] = useState(user.authorName || '');
  const [school, setSchool] = useState(user.school || '');
  const [groupCode, setGroupCode] = useState(user.groupCode || '');
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('failure_cv_active_session_id') || 'demo';
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authorName.trim() || !school.trim() || !groupCode.trim() || !sessionId.trim()) return;
    
    // 입장 API 호출
    const success = await enterSession(
      authorName.trim(), 
      school.trim(), 
      groupCode.trim(), 
      sessionId.trim()
    );
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 fade-enter-active">
      <div className="glass-panel p-8 flex flex-col items-center">
        {/* 브랜딩 로고 */}
        <div className="text-center mb-6">
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 brand-title">
            우당탕탕 AI 융합교육 생존기
          </span>
          <h2 className="brand-title text-3xl font-black mt-1">실패학 콘서트</h2>
          <p className="text-xs text-gray-400 mt-2">화려한 삽질을 동료와 공유하고, 명예로운 상을 투표하세요!</p>
        </div>

        {/* 데모 모드 인포 박스 */}
        {isDemo && (
          <div className="w-full mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs flex gap-2">
            <HelpCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">체험용 데모 모드 실행 중</strong>
              구글 시트 백엔드가 연동되지 않아 가상의 로컬 데이터베이스 모드로 작동합니다.
              세션 코드에 <strong>demo</strong>를 입력하고, 모둠 코드에 <strong>101</strong>을 입력해 바로 체험해 보세요!
            </div>
          </div>
        )}

        {/* 에러 피드백 */}
        {error && (
          <div className="w-full mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 입장 폼 */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400">교사명 (또는 닉네임)</label>
            <input
              type="text"
              required
              placeholder="예: 김실패 또는 닉네임"
              maxLength={15}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="glass-input"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400">소속 학교</label>
            <input
              type="text"
              required
              placeholder="예: 삼현여자중학교"
              maxLength={20}
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="glass-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400">세션 코드</label>
              <input
                type="text"
                required
                placeholder="예: demo"
                maxLength={20}
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="glass-input text-center font-bold"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400">모둠 코드</label>
              <input
                type="text"
                required
                placeholder="예: 101"
                maxLength={10}
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                className="glass-input text-center font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !authorName.trim() || !school.trim() || !groupCode.trim() || !sessionId.trim()}
            className="neon-btn neon-btn-cyan w-full mt-2"
          >
            {isLoading ? (
              <span className="spinner w-4 h-4" />
            ) : (
              <>
                <span>실패학 콘서트 입장하기</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* 퍼실리테이터(관리자) 바로가기 */}
        <div className="mt-8 text-center">
          <button
            onClick={onNavigateToAdmin}
            className="text-xs text-gray-500 hover:text-cyan-400 transition-colors underline underline-offset-4"
          >
            퍼실리테이터(관리자) 대시보드로 이동 &raquo;
          </button>
        </div>
      </div>
    </div>
  );
};
