import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Award, Gift, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const S05_Results = () => {
  const { results, session, cvs, user } = useApp();
  const [revealedCatIndex, setRevealedCatIndex] = useState(-1);

  // 세션의 status 파싱: closed_0, closed_1, closed_2, closed_all
  const currentStatus = session?.status || 'closed';
  
  useEffect(() => {
    let index = -1;
    if (currentStatus === 'closed_0') index = 0;
    else if (currentStatus === 'closed_1') index = 1;
    else if (currentStatus === 'closed_2') index = 2;
    else if (currentStatus === 'closed_all') index = 99; // 전체 공개
    
    setRevealedCatIndex(index);
  }, [currentStatus]);

  // 새로운 수상 부문이 공개될 때마다 꽃가루(Confetti) 이펙트 발사
  useEffect(() => {
    if (revealedCatIndex >= 0) {
      // 0.2초 후 폭죽 효과
      const timer = setTimeout(() => {
        // 좌측 폭죽
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        // 우측 폭죽
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [revealedCatIndex]);

  const triggerManualConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  if (!results || results.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 text-center fade-enter-active">
        <div className="glass-panel p-8">
          <AlertCircle className="text-gray-500 mb-4 mx-auto" size={36} />
          <p className="text-sm text-gray-400">집계된 시상 결과 데이터가 아직 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-12 fade-enter-active select-none">
      {/* 타이틀 헤더 */}
      <div className="text-center mb-10">
        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 brand-title">축하합니다!</span>
        <h2 className="text-3xl font-black text-gray-100 mt-1 flex items-center justify-center gap-2">
          <Sparkles className="text-emerald-400 animate-spin" size={24} style={{ animationDuration: '6s' }} />
          <span>최종 명예의 시상식 결과</span>
        </h2>
        <p className="text-xs text-gray-400 mt-2">
          투표가 마감되어 퍼실리테이터가 수상자를 공개하고 있습니다.
        </p>
      </div>

      {/* 시상 리스트 순차 공개 렌더링 */}
      <div className="flex flex-col gap-8">
        {results.map((res, catIdx) => {
          // 공개 조건 체크 (closed_all 이거나 현재 인덱스가 공개 인덱스보다 작거나 같은 경우)
          const isRevealed = revealedCatIndex === 99 || catIdx <= revealedCatIndex;

          if (!isRevealed) {
            return (
              <div 
                key={res.categoryId} 
                className="glass-panel p-8 text-center bg-black/35 border-dashed border-white/5 opacity-50 flex flex-col items-center justify-center min-h-[160px]"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-2">
                  <Trophy size={18} />
                </div>
                <h3 className="text-sm font-bold text-gray-500">{res.categoryName}</h3>
                <p className="text-[10px] text-gray-600 mt-1">퍼실리테이터가 발표하기 위해 시상 봉투를 개봉 중입니다...</p>
              </div>
            );
          }

          const hasWinners = res.winners && res.winners.length > 0;

          return (
            <div 
              key={res.categoryId} 
              className="glass-panel p-6 md:p-8 bg-slate-900/40 border-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.05)] fade-enter-active"
            >
              {/* 시상 헤더 */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-emerald-400 brand-title">{res.categoryName}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">총 {res.voteCount}표 득표</p>
                  </div>
                </div>
                
                {catIdx === revealedCatIndex && (
                  <button
                    onClick={triggerManualConfetti}
                    className="p-1 px-2.5 rounded bg-emerald-500 text-bg-space text-[10px] font-bold hover:bg-emerald-400 transition-colors"
                  >
                    축하 폭죽 🎉
                  </button>
                )}
              </div>

              {/* 수상자 정보 표시 */}
              {!hasWinners ? (
                <div className="text-center py-6 text-xs text-gray-500">
                  아쉽게도 해당 부문은 득표한 후보가 없어 수상자가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {res.winners.map((winner, winIdx) => {
                    // 해당 이력서 원본 정보 찾기 (상세 실패스토리 및 플랜 B 빔 프로젝션 노출용)
                    const fullCv = cvs.find(c => c.cvId === winner.cvId);

                    return (
                      <div 
                        key={winner.cvId + '-' + winIdx}
                        className="glass-panel p-5 bg-emerald-500/[0.02] border-emerald-500/30 flex flex-col justify-between min-h-[220px] shadow-[inset_0_0_15px_rgba(16,185,129,0.02)]"
                      >
                        <div>
                          {/* 수상 명패 */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                              🏆 WINNER ({winner.votes}표)
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {winner.school}
                            </span>
                          </div>

                          {/* 수상자 교사명 */}
                          <h4 className="text-md font-bold text-gray-100 flex items-baseline gap-1">
                            <span className="text-lg text-emerald-300 font-black">{winner.authorName}</span> 교사
                          </h4>

                          {/* 대상 수업 프로젝트 */}
                          <p className="text-xs text-cyan-400 font-semibold mt-2.5 leading-snug">
                            수업: {winner.projectName}
                          </p>

                          {/* 실패 스토리 하이라이트 */}
                          {fullCv && (
                            <p className="text-[11px] text-gray-300 mt-3 line-clamp-4 leading-relaxed border-t border-white/5 pt-2 italic">
                              &ldquo;{fullCv.part1.story}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* 플랜 B 극복 교훈 */}
                        {fullCv && (
                          <div className="mt-4 pt-3 border-t border-white/5 bg-black/10 p-2.5 rounded-lg text-[10px]">
                            <span className="font-bold text-emerald-400 block mb-0.5">💡 극복 교훈 및 Plan B</span>
                            <p className="text-gray-300 leading-relaxed line-clamp-3">
                              {fullCv.part3.lesson} / {fullCv.part3.planB}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
