import React, { useState } from 'react';
import { Heart, MessageSquare, CornerDownRight, Send, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CardFlip = ({ cv, isMyCard }) => {
  const { sendEmpathy, sendComment } = useApp();
  const [isFlipped, setIsFlipped] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [bubbles, setBubbles] = useState([]);

  const tagLabels = {
    env: { label: '환경 변수 (Wi-Fi/기기)', class: 'tag-chip-cyan' },
    prep: { label: '준비 부족', class: 'tag-chip-pink' },
    tech: { label: '기술적 오류', class: 'tag-chip' },
    student: { label: '학생 변수', class: 'tag-chip-cyan active' },
    other: { label: '기타 변수', class: 'tag-chip-pink active' }
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  // 하트 공감 및 버블 이펙트 트리거
  const handleEmpathy = (e) => {
    e.stopPropagation(); // 카드 회전 방지
    sendEmpathy(cv.cvId);

    // 하트 버블 이펙트 좌표 생성
    const id = Date.now() + Math.random();
    const newBubble = { id, left: Math.random() * 40 + 30 }; // X 좌표 무작위 분산
    setBubbles((prev) => [...prev, newBubble]);

    // 0.8초 후 메모리 누수 방지를 위해 버블 삭제
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== id));
    }, 800);
  };

  // 댓글 전송
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation(); // 카드 회전 방지
    if (!commentText.trim()) return;

    sendComment(cv.cvId, commentText.trim());
    setCommentText('');
  };

  return (
    <div 
      className={`flip-card w-full h-[460px] ${isFlipped ? 'is-flipped' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flip-card-inner w-full h-full">
        
        {/* ==========================================
            1. 카드 앞면 (이력서 요약 및 카테고리)
           ========================================== */}
        <div className="flip-card-front glass-panel p-6 flex flex-col justify-between h-full bg-slate-900/40 relative overflow-hidden">
          {/* 상단 장식 그라데이션 */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />
          
          <div>
            {/* 작성자 정보 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <User size={14} />
                <span>{cv.school}</span>
              </div>
              <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">
                {isMyCard ? '내 카드' : `${cv.authorName} 교사`}
              </span>
            </div>

            {/* 프로젝트 타이틀 */}
            <h3 className="text-lg font-extrabold text-gray-100 mb-3 line-clamp-2 leading-snug">
              {cv.part1.projectName || '수업명 미지정'}
            </h3>

            {/* 실패 스토리 요약 */}
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-6 mb-4 whitespace-pre-wrap">
              {cv.part1.story}
            </p>
          </div>

          {/* 하단 영역 (태그 및 리액션 카운트) */}
          <div>
            {/* 카테고리 태그 모음 */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {cv.part2.categories && cv.part2.categories.map(cat => {
                const tag = tagLabels[cat] || { label: cat, class: 'tag-chip' };
                return (
                  <span key={cat} className={`text-[10px] px-2 py-0.5 rounded-full ${tag.class}`}>
                    {tag.label}
                  </span>
                );
              })}
            </div>

            {/* 리액션 수 표시 및 뒤집기 유도 */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Heart size={14} className="text-pink-500 fill-pink-500/20" />
                  <strong className="text-gray-300 digital-number">{cv.empathyCount || 0}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={14} className="text-cyan-400" />
                  <strong className="text-gray-300 digital-number">{(cv.comments || []).length}</strong>
                </span>
              </div>
              <span className="text-[10px] text-cyan-400 animate-pulse font-medium">클릭 시 뒷면 (5 Whys) 보기 &raquo;</span>
            </div>
          </div>
        </div>

        {/* ==========================================
            2. 카드 뒷면 (5 Whys / 플랜 B 및 댓글 피드백)
           ========================================== */}
        <div 
          className="flip-card-back glass-panel p-6 flex flex-col justify-between h-full bg-bg-deep/95 border-cyan-500/30 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]"
          onClick={(e) => e.stopPropagation()} // 뒤 뒷면 콘텐츠 터치 시 앞면으로 뒤집히는 것 방지
        >
          <div className="overflow-y-auto pr-1 flex-1 mb-4 select-text">
            {/* 제목 */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 brand-title">사망 진단서 (5 Whys)</h4>
              <button 
                onClick={() => setIsFlipped(false)}
                className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold"
              >
                &laquo; 앞면으로
              </button>
            </div>

            {/* 표면적 원인 */}
            <div className="mb-4">
              <span className="text-[10px] text-pink-400 font-semibold">표면 원인</span>
              <p className="text-xs text-gray-200 mt-0.5 pl-2 border-l border-pink-500/30">
                {cv.part2.surfaceCause || '미입력'}
              </p>
            </div>

            {/* 5 Whys 히스토리 계단식 렌더링 */}
            {cv.part2.fiveWhys && cv.part2.fiveWhys.filter(w => w.trim()).length > 0 && (
              <div className="mb-4 flex flex-col gap-1.5 pl-1">
                {cv.part2.fiveWhys.map((why, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-1 text-[11px] text-gray-300"
                    style={{ paddingLeft: `${idx * 8}px` }}
                  >
                    <CornerDownRight size={10} className="text-cyan-500 mt-1 shrink-0" />
                    <span>
                      <strong className="text-cyan-400 mr-1">Why {idx+1}:</strong> 
                      {why}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 플랜 B 대안 */}
            <div className="border-t border-white/5 pt-3 flex flex-col gap-3">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold">배운 점 (Lesson Learned)</span>
                <p className="text-xs text-gray-300 mt-0.5 whitespace-pre-wrap">
                  {cv.part3.lesson || '배운 점 기록 없음'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-cyan-400 font-bold">아날로그 대안 (Plan B)</span>
                <p className="text-xs text-gray-300 mt-0.5 whitespace-pre-wrap">
                  {cv.part3.planB || '대안책 기록 없음'}
                </p>
              </div>
            </div>

            {/* 익명 댓글 스크롤 영역 */}
            <div className="border-t border-white/5 pt-3 mt-3">
              <span className="text-[10px] text-purple-400 font-bold block mb-1.5">
                동료 피드백 (댓글 {(cv.comments || []).length})
              </span>
              <div className="flex flex-col gap-2 max-h-[100px] overflow-y-auto mb-2 bg-black/15 p-2 rounded-lg">
                {(cv.comments || []).length === 0 ? (
                  <p className="text-[10px] text-gray-500 text-center py-2">격려의 한 줄 댓글을 남겨주세요!</p>
                ) : (
                  cv.comments.map((cmt, idx) => (
                    <div key={idx} className="text-[10px] text-gray-300 border-b border-white/5 pb-1 last:border-0">
                      <p className="whitespace-pre-wrap">{cmt.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ==========================================
              뒷면 하단 리액션 전송 폼 영역
             ========================================== */}
          <div className="relative border-t border-white/5 pt-3 mt-auto">
            {/* 공감 클릭 버블 이펙트 요소들 */}
            {bubbles.map((b) => (
              <span 
                key={b.id} 
                className="bubble-heart" 
                style={{ left: `${b.left}%`, bottom: '45px' }}
              >
                <Heart size={16} fill="currentColor" />
              </span>
            ))}

            <div className="flex items-center gap-2">
              {/* 공감(하트) 버튼 */}
              <button
                type="button"
                onClick={handleEmpathy}
                className="p-2.5 rounded-lg bg-pink-500/10 hover:bg-pink-500 text-pink-400 hover:text-white border border-pink-500/20 hover:border-pink-500 transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
              >
                <Heart size={14} className="fill-current" />
                <span>{cv.empathyCount || 0}</span>
              </button>

              {/* 댓글 등록 인풋 폼 */}
              <form onSubmit={handleCommentSubmit} className="flex-1 flex gap-1">
                <input
                  type="text"
                  maxLength={50}
                  placeholder="따뜻한 피드백 (최대 50자)"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onClick={(e) => e.stopPropagation()} // 포커스 획득 시 카드 닫힘 방지
                  className="glass-input text-[11px] py-2 px-3 w-full"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="p-2 bg-cyan-500 disabled:bg-white/5 text-bg-space disabled:text-gray-500 rounded-lg border border-cyan-400 disabled:border-white/5 hover:bg-cyan-400 transition-colors shrink-0"
                >
                  <Send size={12} />
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
