import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HelpCircle, CheckSquare, Trophy, AlertTriangle } from 'lucide-react';

export const S04_Voting = () => {
  const { cvs, votes, user, session, sendVote, isLoading } = useApp();

  // 최종 투표 여부 확인 (voterId 기반으로 이미 제출된 표가 있는지 검사)
  const isVoted = votes.some(v => v.voterId === user.voterId);

  // 투표용 모둠원 필터링 (본인의 카드를 포함해 전체 후보 목록으로 리스트업하되, 투표 시 본인 체크 불가)
  const isAllView = user.groupCode === 'admin';
  const groupCvs = isAllView 
    ? cvs 
    : cvs.filter(c => c.groupCode === user.groupCode);

  // 선택 상태 관리: { [categoryId]: cvId }
  const [selections, setSelections] = useState({});

  const categories = session?.awardCategories || [
    { id: 'award-1', name: '올해의 아름다운 폭망상', description: '가장 용감하게 도전했고, 가장 화려하게 실패했으나, 그 용기 자체를 기립니다.' },
    { id: 'award-2', name: '불사조상', description: '멘붕의 순간, 아무도 예상 못한 방법으로 수업을 수습해낸 순발력을 기립니다.' },
    { id: 'award-3', name: '인간 디버거상', description: '오류와의 처절한 사투 속에서도 끝까지 분석하고 배움을 남긴 끈기를 기립니다.' }
  ];

  const handleSelect = (categoryId, cvId) => {
    // 자기 자신 투표 방지 검증 (클라이언트 2차 방어막)
    const targetCv = cvs.find(c => c.cvId === cvId);
    if (targetCv?.cvId === 'CV-' + user.voterId) return;

    setSelections(prev => ({
      ...prev,
      [categoryId]: cvId
    }));
  };

  const handleVoteSubmit = async () => {
    // 3개 부문 모두 투표했는지 체크
    const selectedCount = Object.keys(selections).length;
    if (selectedCount < categories.length) {
      alert('모든 시상 카테고리에 대해 최소 1명씩 선택해 주셔야 투표 제출이 가능합니다.');
      return;
    }

    // 형식 변환: [{ categoryId, cvId }]
    const formatted = Object.keys(selections).map(catId => ({
      categoryId: catId,
      cvId: selections[catId]
    }));

    const success = await sendVote(formatted);
    if (success) {
      alert('투표가 안전하게 집계되었습니다! 퍼실리테이터가 결과를 공개할 때까지 대기해 주세요.');
    } else {
      alert('투표 제출에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  // 실시간 투표 집계 현황 계산 (후보 수 대비 투표자 수)
  const totalEligibleVoters = groupCvs.length;
  // 같은 모둠원(또는 전체) 중 투표한 수 계산
  const votedCount = votes.filter(v => {
    if (isAllView) return true;
    // 해당 투표자의 모둠이 본인과 같은지 매핑 (이력서 매핑하여 체크)
    const voterCv = cvs.find(c => 'CV-' + v.voterId === c.cvId);
    return voterCv?.groupCode === user.groupCode;
  }).length;

  const votePercentage = totalEligibleVoters > 0 
    ? Math.min(100, Math.round((votedCount / totalEligibleVoters) * 100))
    : 0;

  // ==========================================
  // 1. 이미 투표를 마쳤을 때 보여주는 대기 화면
  // ==========================================
  if (isVoted) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 fade-enter-active">
        <div className="glass-panel p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-6 animate-pulse">
            <Trophy size={32} />
          </div>

          <h3 className="text-xl font-bold text-gray-200 brand-title mb-2">투표 완료! 결과 대기 중</h3>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            선생님의 투표가 정상적으로 등록되었습니다.<br />
            다른 선생님들이 투표를 완료할 때까지 잠시 대기해 주세요.
          </p>

          {/* 진행 현황 프로그레스 바 */}
          <div className="w-full flex flex-col gap-2 bg-black/20 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-400">모둠 투표 진행률</span>
              <span className="text-cyan-400 digital-number">{votedCount} / {totalEligibleVoters}명 ({votePercentage}%)</span>
            </div>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${votePercentage}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">퍼실리테이터가 투표를 마감하면 시상식이 실시간 진행됩니다.</p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. 투표 용지 UI 화면
  // ==========================================
  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-12 fade-enter-active">
      <div className="text-center mb-8">
        <span className="text-[10px] uppercase font-bold tracking-widest text-pink-400 brand-title">명예의 전당</span>
        <h2 className="text-2xl font-black text-gray-100 mt-1 flex items-center justify-center gap-2">
          <Trophy className="text-pink-400" size={24} />
          <span>실패 시상식 모둠 투표</span>
        </h2>
        <p className="text-xs text-gray-400 mt-2">동료의 멋진 도전을 응원하는 최적의 한 명을 엄선해 주세요. (본인 제외)</p>
      </div>

      <div className="flex flex-col gap-8">
        {categories.map((category) => (
          <div key={category.id} className="glass-panel p-6 bg-slate-900/40 border-pink-500/10">
            {/* 카테고리 헤더 */}
            <div className="border-b border-white/5 pb-3 mb-4">
              <h3 className="text-md font-bold text-pink-400 flex items-center gap-2">
                <Trophy size={16} />
                <span>{category.name}</span>
              </h3>
              <p className="text-xs text-gray-300 mt-1 pl-6 leading-relaxed italic">
                &ldquo;{category.description}&rdquo;
              </p>
            </div>

            {/* 후보 리스트 (라디오 버튼) */}
            <div className="flex flex-col gap-2">
              {groupCvs.length === 0 ? (
                <p className="text-xs text-gray-500 py-3 text-center">후보군 이력서 카드가 존재하지 않습니다.</p>
              ) : (
                groupCvs.map((cv) => {
                  const isSelf = cv.cvId === 'CV-' + user.voterId;
                  const isChecked = selections[category.id] === cv.cvId;

                  return (
                    <div 
                      key={cv.cvId}
                      onClick={() => !isSelf && handleSelect(category.id, cv.cvId)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelf 
                          ? 'opacity-40 bg-black/10 border-white/5 cursor-not-allowed' 
                          : isChecked
                            ? 'bg-pink-500/10 border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.1)]'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex flex-col gap-1 pr-4">
                        <span className="text-xs font-bold text-gray-200">
                          {cv.part1.projectName}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {cv.school} &middot; {cv.authorName} 교사 {isSelf && '(나)'}
                        </span>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <input
                          type="radio"
                          name={category.id}
                          disabled={isSelf}
                          checked={isChecked}
                          onChange={() => handleSelect(category.id, cv.cvId)}
                          className="w-4 h-4 accent-pink-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}

        {/* 투표 완료 제출 */}
        <div className="flex flex-col items-center gap-3 mt-4">
          <button
            onClick={handleVoteSubmit}
            disabled={isLoading || Object.keys(selections).length < categories.length}
            className="neon-btn neon-btn-pink px-8 py-3 w-full sm:w-auto"
          >
            {isLoading ? (
              <span className="spinner w-4 h-4" />
            ) : (
              <>
                <CheckSquare size={16} />
                <span>투표 완료 및 최종 제출</span>
              </>
            )}
          </button>
          
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <AlertTriangle size={12} className="text-pink-500/60" />
            <span>투표를 제출하면 수정하거나 되돌릴 수 없습니다.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
