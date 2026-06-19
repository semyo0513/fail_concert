import React from 'react';
import { useApp } from '../context/AppContext';
import { CardFlip } from '../components/CardFlip';
import { HelpCircle, RefreshCw, BarChart2, Users } from 'lucide-react';

export const S03_GroupBoard = () => {
  const { cvs, user, session, refreshData, isLoading } = useApp();

  // 현재 참가자와 동일한 모둠의 이력서 필터링 (관리자는 전체 보기 가능)
  const isAllView = user.groupCode === 'admin';
  const groupCvs = isAllView 
    ? cvs 
    : cvs.filter(c => c.groupCode === user.groupCode);

  const groupName = isAllView
    ? '전체 모둠'
    : session?.groups?.find(g => g.groupCode === user.groupCode)?.groupName || `${user.groupCode.replace('10', '')}모둠`;

  // 1. 원인 카테고리 통계 분석 계산
  const categoryStats = {
    env: { label: '환경 변수', count: 0, color: 'var(--secondary-neon)' },
    prep: { label: '준비 부족', count: 0, color: 'var(--accent-pink)' },
    tech: { label: '기술적 오류', count: 0, color: 'var(--primary-neon)' },
    student: { label: '학생 변수', count: 0, color: '#38bdf8' },
    other: { label: '기타 변수', count: 0, color: '#a855f7' }
  };

  let totalCount = 0;
  groupCvs.forEach(cv => {
    if (cv.part2 && cv.part2.categories) {
      cv.part2.categories.forEach(cat => {
        if (categoryStats[cat]) {
          categoryStats[cat].count++;
          totalCount++;
        }
      });
    }
  });

  const sortedStats = Object.keys(categoryStats).map(key => ({
    key,
    ...categoryStats[key],
    percentage: totalCount > 0 ? Math.round((categoryStats[key].count / totalCount) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-12 fade-enter-active">
      {/* 공유 보드 인디케이터 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 brand-title">공유 및 토론 단계</span>
          <h2 className="text-2xl font-black text-gray-100 flex items-center gap-2 mt-1">
            <Users className="text-cyan-400" size={24} />
            <span>{groupName} 실패 공유 보드</span>
            <span className="text-xs font-normal text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
              총 {groupCvs.length}장
            </span>
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            실시간 자동 업데이트 중 (5초)
          </span>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ==========================================
            좌측 패널: 모둠 원인 분석 차트
           ========================================== */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 bg-slate-900/40">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-purple-400" />
              <span>실패 원인 스펙트럼</span>
            </h3>

            {totalCount === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">모둠원들이 작성한 원인 카운트가 집계되면 통계 차트가 나타납니다.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {sortedStats.map((stat) => (
                  <div key={stat.key} className="flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-300">{stat.label}</span>
                      <span className="text-gray-400 digital-number">
                        {stat.count}건 ({stat.percentage}%)
                      </span>
                    </div>
                    {/* 커스텀 수평 바 차트 */}
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${stat.percentage}%`,
                          backgroundColor: stat.color,
                          boxShadow: `0 0 8px ${stat.color}80`
                        }}
                      />
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 leading-relaxed flex gap-1.5">
                  <HelpCircle size={14} className="shrink-0 mt-0.5" />
                  <span>이 통계는 모둠의 취약 요소를 대변합니다. 어떤 원인이 가장 큰 병목이었는지 동료들과 이야기를 나누어 보세요.</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="glass-panel p-6 bg-bg-deep/40 text-xs text-gray-400 leading-relaxed flex flex-col gap-2">
            <h4 className="font-bold text-cyan-400">💡 토론 및 공유 팁</h4>
            <ul className="list-disc pl-4 flex flex-col gap-1.5">
              <li>카드를 클릭하면 <strong>3D 회전</strong>을 하며 상세한 5 Whys 진단과 회고 대책을 보여줍니다.</li>
              <li>상대의 솔직한 극복기에 감명을 받으셨다면 하트(공감)를 눌러 적극적으로 지지해 주세요.</li>
              <li>하트 우측의 피드백 입력창을 열어 한 줄 격려나 유사 해결 팁을 남길 수 있습니다.</li>
            </ul>
          </div>
        </div>

        {/* ==========================================
            우측 패널: 이력서 카드 그리드 목록
           ========================================== */}
        <div className="lg:col-span-2">
          {groupCvs.length === 0 ? (
            <div className="glass-panel p-12 text-center bg-slate-900/10 flex flex-col items-center justify-center gap-3">
              <Users size={32} className="text-gray-600" />
              <p className="text-sm font-semibold text-gray-400">모둠 내 등록된 실패 이력서가 아직 없습니다.</p>
              <p className="text-xs text-gray-500">다른 동료 교사들의 등록 현황을 기다리거나, 새로고침을 눌러보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupCvs.map((cv) => (
                <CardFlip 
                  key={cv.cvId} 
                  cv={cv} 
                  isMyCard={cv.cvId === 'CV-' + user.voterId} 
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
