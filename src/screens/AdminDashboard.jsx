import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { GAS_SCRIPT_TEMPLATE } from '../services/gasTemplate';
import { Play, Clipboard, Check, RefreshCw, BarChart2, Shield, Settings, Server, Copy, Trophy } from 'lucide-react';

export const AdminDashboard = ({ onNavigateToEntry }) => {
  const {
    gasUrl,
    updateGasUrl,
    session,
    cvs,
    votes,
    results,
    setupNewSession,
    changeSessionStatus,
    modifySessionAwards,
    refreshData,
    isLoading,
    activeSessionId
  } = useApp();

  // 세션 설정 폼 상태
  const [newSessionId, setNewSessionId] = useState(activeSessionId || 'demo');
  const [sessionTitle, setSessionTitle] = useState(session?.title || '삼현 AI 융합 생존 콘서트');
  const [groupInput, setGroupInput] = useState('1모둠 (AI 교과), 2모둠 (메이커 교과), 3모둠 (융합 프로젝트)');
  
  // 신규 세션 생성용 시상명 상태
  const [award1Name, setAward1Name] = useState('올해의 아름다운 폭망상');
  const [award1Desc, setAward1Desc] = useState('가장 용감하게 도전했고, 가장 화려하게 실패했으나, 그 용기 자체를 기립니다.');
  const [award2Name, setAward2Name] = useState('불사조상');
  const [award2Desc, setAward2Desc] = useState('멘붕의 순간, 아무도 예상 못한 방법으로 수업을 수습해낸 순발력을 기립니다.');
  const [award3Name, setAward3Name] = useState('인간 디버거상');
  const [award3Desc, setAward3Desc] = useState('오류와의 처절한 사투 속에서도 끝까지 분석하고 배움을 남긴 끈기를 기립니다.');

  // 현재 세션 시상명 실시간 수정용 상태
  const [editAward1Name, setEditAward1Name] = useState('');
  const [editAward1Desc, setEditAward1Desc] = useState('');
  const [editAward2Name, setEditAward2Name] = useState('');
  const [editAward2Desc, setEditAward2Desc] = useState('');
  const [editAward3Name, setEditAward3Name] = useState('');
  const [editAward3Desc, setEditAward3Desc] = useState('');

  // active session 정보 로드 시 실시간 수정 필드 채우기
  useEffect(() => {
    const updateAwards = () => {
      if (session?.awardCategories && session.awardCategories.length >= 3) {
        setEditAward1Name(session.awardCategories[0]?.name || '');
        setEditAward1Desc(session.awardCategories[0]?.desc || session.awardCategories[0]?.description || '');
        setEditAward2Name(session.awardCategories[1]?.name || '');
        setEditAward2Desc(session.awardCategories[1]?.desc || session.awardCategories[1]?.description || '');
        setEditAward3Name(session.awardCategories[2]?.name || '');
        setEditAward3Desc(session.awardCategories[2]?.desc || session.awardCategories[2]?.description || '');
      } else {
        setEditAward1Name('올해의 아름다운 폭망상');
        setEditAward1Desc('가장 용감하게 도전했고, 가장 화려하게 실패했으나, 그 용기 자체를 기립니다.');
        setEditAward2Name('불사조상');
        setEditAward2Desc('멘붕의 순간, 아무도 예상 못한 방법으로 수업을 수습해낸 순발력을 기립니다.');
        setEditAward3Name('인간 디버거상');
        setEditAward3Desc('오류와의 처절한 사투 속에서도 끝까지 분석하고 배움을 남긴 끈기를 기립니다.');
      }
    };

    const timer = setTimeout(updateAwards, 0);
    return () => clearTimeout(timer);
  }, [session?.awardCategories]);

  // GAS URL 입력 필드 상태
  const [gasUrlInput, setGasUrlInput] = useState(gasUrl);
  const [isCopied, setIsCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // 1. 구글 Apps Script 웹앱 URL 저장
  const handleSaveGasUrl = () => {
    updateGasUrl(gasUrlInput);
    setSaveStatus('설정이 로컬 저장소에 반영되었습니다!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  // 2. 신규 세션 생성 및 초기화
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionId.trim() || !sessionTitle.trim()) {
      alert('세션 ID와 타이틀을 모두 입력해 주세요.');
      return;
    }
    const groupsArray = groupInput.split(',').map(g => g.trim()).filter(Boolean);
    const awardCategories = [
      { id: 'award-1', name: award1Name.trim() || '올해의 아름다운 폭망상', desc: award1Desc.trim() || '', description: award1Desc.trim() || '' },
      { id: 'award-2', name: award2Name.trim() || '불사조상', desc: award2Desc.trim() || '', description: award2Desc.trim() || '' },
      { id: 'award-3', name: award3Name.trim() || '인간 디버거상', desc: award3Desc.trim() || '', description: award3Desc.trim() || '' }
    ];
    const success = await setupNewSession(newSessionId.trim(), sessionTitle.trim(), groupsArray, awardCategories);
    if (success) {
      alert(`[${newSessionId}] 세션이 구글 시트에 성공적으로 초기화되었습니다!`);
    }
  };

  // 2-2. 시상명 즉시 업데이트 및 반영
  const handleUpdateAwards = async () => {
    if (!session) return;
    const cats = [
      { id: 'award-1', name: editAward1Name.trim() || '올해의 아름다운 폭망상', desc: editAward1Desc.trim() || '', description: editAward1Desc.trim() || '' },
      { id: 'award-2', name: editAward2Name.trim() || '불사조상', desc: editAward2Desc.trim() || '', description: editAward2Desc.trim() || '' },
      { id: 'award-3', name: editAward3Name.trim() || '인간 디버거상', desc: editAward3Desc.trim() || '', description: editAward3Desc.trim() || '' }
    ];
    const success = await modifySessionAwards(cats);
    if (success) {
      alert('🏆 시상명이 즉시 변경 및 연수 환경에 반영되었습니다!');
    } else {
      alert('시상명 실시간 반영에 실패했습니다.');
    }
  };

  // 3. GAS 스크립트 클립보드 복사
  const handleCopyScript = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_TEMPLATE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 실시간 작성률 및 투표율 현황 계산
  const totalCvsCount = cvs.length;
  const totalVotesCount = votes.length;
  const activeStatus = session?.status || 'waiting';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-12 fade-enter-active">
      
      {/* 관리자 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-white/5">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 brand-title">FACS CONTROL ROOM</span>
          <h2 className="text-2xl font-black text-gray-100 flex items-center gap-2 mt-1">
            <Shield className="text-cyan-400" size={24} />
            <span>퍼실리테이터 통제 대시보드</span>
          </h2>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="neon-btn neon-btn-secondary px-4 py-2 text-xs"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>수동 동기화</span>
          </button>
          <button
            onClick={onNavigateToEntry}
            className="neon-btn neon-btn-cyan px-4 py-2 text-xs"
          >
            <span>교사용 입장 화면 &raquo;</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ==========================================
            1. 세션 제어판 (좌측 4열)
           ========================================== */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* 단계 진행 제어판 */}
          <div className="glass-panel p-6 bg-slate-900/40 border-cyan-500/10">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Play size={14} />
              <span>단계 진행 제어판</span>
            </h3>

            {!session ? (
              <p className="text-xs text-gray-500 text-center py-4">동작 가능한 세션이 로드되지 않았습니다. 아래 세션 생성기를 통해 세션을 생성해 주세요.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(() => {
                  const cats = (session?.awardCategories && session.awardCategories.length > 0)
                    ? session.awardCategories
                    : [
                        { id: 'award-1', name: '올해의 아름다운 폭망상', desc: '가장 용감하게 도전했고, 가장 화려하게 실패했으나, 그 용기 자체를 기립니다.' },
                        { id: 'award-2', name: '불사조상', desc: '멘붕의 순간, 아무도 예상 못한 방법으로 수업을 수습해낸 순발력을 기립니다.' },
                        { id: 'award-3', name: '인간 디버거상', desc: '오류와의 처절한 사투 속에서도 끝까지 분석하고 배움을 남긴 끈기를 기립니다.' }
                      ];
                  
                  return [
                    { id: 'waiting', label: '1단계: 입장 대기', desc: '참가자 입장 화면 노출' },
                    { id: 'writing', label: '2단계: 이력서 작성', desc: '이력서 입력 폼 (스텝 1~3) 오픈' },
                    { id: 'sharing', label: '3단계: 모둠 보드 공유', desc: '모둠원 이력서 카드 및 댓글 보드 오픈' },
                    { id: 'voting', label: '4단계: 시상 투표 오픈', desc: '투표 용지 오픈 (중복 투표 불가)' },
                    { id: 'closed_0', label: `5-1단계: ${cats[0]?.name || '폭망상'} 발표`, desc: cats[0]?.desc || cats[0]?.description || '' },
                    { id: 'closed_1', label: `5-2단계: ${cats[1]?.name || '불사조상'} 발표`, desc: cats[1]?.desc || cats[1]?.description || '' },
                    { id: 'closed_2', label: `5-3단계: ${cats[2]?.name || '디버거상'} 발표`, desc: cats[2]?.desc || cats[2]?.description || '' },
                    { id: 'closed_all', label: '결과 전체 공개', desc: '모든 시상 결과 공개' }
                  ].map((stage) => {
                    const isActive = activeStatus === stage.id;
                    return (
                      <button
                        key={stage.id}
                        onClick={() => changeSessionStatus(stage.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col ${
                          isActive 
                            ? 'bg-cyan-500 border-cyan-400 text-bg-space shadow-[0_0_12px_var(--secondary-neon-glow)] font-bold' 
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                        }`}
                      >
                        <span className="text-xs">{stage.label}</span>
                        <span className={`text-[9px] mt-0.5 font-normal ${isActive ? 'text-bg-space/80' : 'text-gray-400'}`}>
                          {stage.desc}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* 구글 시트 백엔드 설정 */}
          <div className="glass-panel p-6 bg-slate-900/40">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings size={14} />
              <span>백엔드 구글 시트 주소</span>
            </h3>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/..."
                  value={gasUrlInput}
                  onChange={(e) => setGasUrlInput(e.target.value)}
                  className="glass-input text-[11px] py-2 px-3"
                />
                <span className="text-[9px] text-gray-500 mt-1">
                  * 공란으로 저장 시 브라우저 내부 <strong>체험용 데모 모드</strong>로 작동합니다.
                </span>
              </div>
              
              <button
                onClick={handleSaveGasUrl}
                className="neon-btn neon-btn-pink w-full py-2 text-xs"
              >
                설정 주소 저장하기
              </button>
              {saveStatus && <p className="text-[10px] text-center text-emerald-400 font-bold">{saveStatus}</p>}
            </div>
          </div>

          {/* 현재 세션 시상명 실시간 수정 */}
          {session && (
            <div className="glass-panel p-6 bg-slate-900/40 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                <Trophy size={14} />
                <span>🏆 현재 세션 시상명 실시간 수정</span>
              </h3>
              
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-pink-400">시상 부문 1 (award-1)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="시상명"
                      value={editAward1Name}
                      onChange={(e) => setEditAward1Name(e.target.value)}
                      className="glass-input text-[10px] py-1.5 px-3 flex-1"
                    />
                    <input
                      type="text"
                      placeholder="상세 설명"
                      value={editAward1Desc}
                      onChange={(e) => setEditAward1Desc(e.target.value)}
                      className="glass-input text-[10px] py-1.5 px-3 flex-[2]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-pink-400">시상 부문 2 (award-2)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="시상명"
                      value={editAward2Name}
                      onChange={(e) => setEditAward2Name(e.target.value)}
                      className="glass-input text-[10px] py-1.5 px-3 flex-1"
                    />
                    <input
                      type="text"
                      placeholder="상세 설명"
                      value={editAward2Desc}
                      onChange={(e) => setEditAward2Desc(e.target.value)}
                      className="glass-input text-[10px] py-1.5 px-3 flex-[2]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-pink-400">시상 부문 3 (award-3)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="시상명"
                      value={editAward3Name}
                      onChange={(e) => setEditAward3Name(e.target.value)}
                      className="glass-input text-[10px] py-1.5 px-3 flex-1"
                    />
                    <input
                      type="text"
                      placeholder="상세 설명"
                      value={editAward3Desc}
                      onChange={(e) => setEditAward3Desc(e.target.value)}
                      className="glass-input text-[10px] py-1.5 px-3 flex-[2]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleUpdateAwards}
                  className="neon-btn neon-btn-pink w-full py-2 text-xs mt-1"
                >
                  시상명 즉시 변경 및 반영
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==========================================
            2. 실시간 모니터링 현황판 (중앙 4열)
           ========================================== */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 bg-slate-900/40 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 size={16} className="text-cyan-400" />
              <span>실시간 연수 집계 보드</span>
            </h3>

            {/* 기본 수치 현황 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-gray-400 block mb-1">제출 이력서</span>
                <strong className="text-2xl font-black digital-number text-cyan-400">{totalCvsCount}</strong>
                <span className="text-[9px] text-gray-500 block mt-1">개별 실패 이력</span>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-gray-400 block mb-1">제출 투표 수</span>
                <strong className="text-2xl font-black digital-number text-pink-400">{totalVotesCount}</strong>
                <span className="text-[9px] text-gray-500 block mt-1">1인 1표 집계</span>
              </div>
            </div>

            {/* 실시간 득표 분포 현황 (마감 전 미리보기) */}
            <div className="border-t border-white/5 pt-4">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>실시간 최다 득표 현황</span>
                <span className="text-[9px] text-gray-500 font-normal">(관리자 전용 미리보기)</span>
              </h4>

              {totalVotesCount === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">투표가 진행되면 실시간 순위 그래프가 활성화됩니다.</p>
              ) : (
                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {/* 각 어워드별 득표 순위 계산 */}
                  {results && results.map((res) => (
                    <div key={res.categoryId} className="bg-black/10 p-3 rounded-lg border border-white/5">
                      <span className="text-[10px] text-purple-400 font-bold block mb-1.5">{res.categoryName}</span>
                      {res.winners && res.winners.length > 0 ? (
                        <div className="flex flex-col gap-1 text-[10px]">
                          {res.winners.map((win, idx) => (
                            <div key={idx} className="flex justify-between items-center text-gray-300">
                              <span>{win.school} &middot; {win.authorName} ({win.projectName})</span>
                              <strong className="text-cyan-400 font-bold digital-number">{win.votes}표</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[9px] text-gray-500 italic">아직 유효 득표 없음</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* 신규 세션 생성기 */}
          <form onSubmit={handleCreateSession} className="glass-panel p-6 bg-slate-900/40 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Server size={14} className="text-emerald-400" />
              <span>신규 연수 세션 생성기</span>
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400">세션 ID *</label>
              <input
                type="text"
                required
                placeholder="영문/숫자 코드 (예: 2026-camp)"
                value={newSessionId}
                onChange={(e) => setNewSessionId(e.target.value)}
                className="glass-input text-xs py-2 px-3"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400">세션 타이틀 (연수명) *</label>
              <input
                type="text"
                required
                placeholder="예: 중등 정보교사 AI 연수"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="glass-input text-xs py-2 px-3"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400">모둠 구분 (쉼표로 구분) *</label>
              <input
                type="text"
                required
                placeholder="1모둠, 2모둠, 3모둠"
                value={groupInput}
                onChange={(e) => setGroupInput(e.target.value)}
                className="glass-input text-xs py-2 px-3"
              />
            </div>

            <div className="border-t border-white/5 pt-3 flex flex-col gap-3">
              <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">🏆 신규 세션 시상명 커스터마이징</h4>
              
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500">시상 부문 1 (award-1)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="시상명"
                    value={award1Name}
                    onChange={(e) => setAward1Name(e.target.value)}
                    className="glass-input text-[10px] py-1.5 px-3 flex-1"
                  />
                  <input
                    type="text"
                    placeholder="상세 설명"
                    value={award1Desc}
                    onChange={(e) => setAward1Desc(e.target.value)}
                    className="glass-input text-[10px] py-1.5 px-3 flex-[2]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500">시상 부문 2 (award-2)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="시상명"
                    value={award2Name}
                    onChange={(e) => setAward2Name(e.target.value)}
                    className="glass-input text-[10px] py-1.5 px-3 flex-1"
                  />
                  <input
                    type="text"
                    placeholder="상세 설명"
                    value={award2Desc}
                    onChange={(e) => setAward2Desc(e.target.value)}
                    className="glass-input text-[10px] py-1.5 px-3 flex-[2]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-gray-500">시상 부문 3 (award-3)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="시상명"
                    value={award3Name}
                    onChange={(e) => setAward3Name(e.target.value)}
                    className="glass-input text-[10px] py-1.5 px-3 flex-1"
                  />
                  <input
                    type="text"
                    placeholder="상세 설명"
                    value={award3Desc}
                    onChange={(e) => setAward3Desc(e.target.value)}
                    className="glass-input text-[10px] py-1.5 px-3 flex-[2]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !newSessionId.trim() || !sessionTitle.trim()}
              className="neon-btn neon-btn-cyan w-full text-xs py-2 mt-1"
            >
              신규 세션 구글 시트 등록
            </button>
          </form>
        </div>

        {/* ==========================================
            3. 구글 Apps Script 셋업 가이드 (우측 4열)
           ========================================== */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 bg-slate-900/40 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Clipboard size={14} />
              <span>구글 시트 백엔드 소스코드</span>
            </h3>
            
            <p className="text-[10px] text-gray-400 leading-relaxed">
              구글 스프레드시트 <code>확장 프로그램 &gt; Apps Script</code>를 열고 붙여넣을 전용 백엔드 코드입니다.
            </p>

            <div className="relative">
              <textarea
                readOnly
                rows={12}
                value={GAS_SCRIPT_TEMPLATE}
                className="glass-input w-full font-mono text-[9px] bg-black/30 text-gray-400 resize-none p-3 select-all"
              />
              <button
                type="button"
                onClick={handleCopyScript}
                className="absolute top-2 right-2 p-1.5 rounded bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/30 transition-colors"
                title="코드 복사"
              >
                {isCopied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>

            <div className="text-[9px] text-gray-500 flex flex-col gap-2 list-decimal pl-4">
              <div>1. 위 코드를 복사해 구글 시트 스크립트 에디터에 붙여넣습니다.</div>
              <div>2. 함수 선택에서 <code>setupSheets</code>를 선택해 1회 실행합니다. (권한 승인 허용)</div>
              <div>3. [배포] &gt; [새 배포]에서 [웹앱]으로 세팅하여 배포를 완료합니다. (액세스 대상: Anyone)</div>
              <div>4. 발급된 최종 배포 웹앱 URL을 복사하여 좌측 주소창에 저장해 주세요!</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
