import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { StepIndicator, LoadingScreen } from '../components/Common';
import { AlertTriangle, Plus, Trash2, ArrowLeft, ArrowRight, Sparkles, HelpCircle, Save } from 'lucide-react';

export const S02_WriteCV = () => {
  const { submitMyCV, isLoading, user } = useApp();
  
  // 현재 작성 단계 (1, 2, 3)
  const [step, setStep] = useState(1);
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // 1단계 상태: 사건 재구성
  const [projectName, setProjectName] = useState('');
  const [story, setStory] = useState('');

  // 2단계 상태: 5 Whys & 카테고리
  const [surfaceCause, setSurfaceCause] = useState('');
  const [fiveWhys, setFiveWhys] = useState(['']); // 최소 1개 입력 필드로 시작
  const [categories, setCategories] = useState([]); // ['env', 'prep', 'tech', 'student', 'other']

  // 3단계 상태: 회고 및 대안
  const [lesson, setLesson] = useState('');
  const [planB, setPlanB] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // 로컬 스토리지 키
  const TEMP_STORAGE_KEY = `temp_cv_data_${user.voterId}`;

  // 컴포넌트 로드 시 임시저장 내용 로드
  useEffect(() => {
    const saved = localStorage.getItem(TEMP_STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.projectName) setProjectName(data.projectName);
        if (data.story) setStory(data.story);
        if (data.surfaceCause) setSurfaceCause(data.surfaceCause);
        if (data.fiveWhys) setFiveWhys(data.fiveWhys);
        if (data.categories) setCategories(data.categories);
        if (data.lesson) setLesson(data.lesson);
        if (data.planB) setPlanB(data.planB);
      } catch (e) {
        console.error('Error loading temporary CV data', e);
      }
    }
  }, [TEMP_STORAGE_KEY]);

  // 자동 임시저장 (입력값 변경 시 디바운스 처리하여 저장하거나 간단히 10초마다 자동저장)
  useEffect(() => {
    const dataToSave = {
      projectName, story, surfaceCause, fiveWhys, categories, lesson, planB
    };
    
    const timer = setTimeout(() => {
      if (projectName || story || surfaceCause || lesson || planB) {
        localStorage.setItem(TEMP_STORAGE_KEY, JSON.stringify(dataToSave));
        setIsSavedAlert(true);
        setTimeout(() => setIsSavedAlert(false), 2000); // 2초간 임시저장 표시 알림
      }
    }, 5000); // 5초간 입력 멈추면 임시저장

    return () => clearTimeout(timer);
  }, [projectName, story, surfaceCause, fiveWhys, categories, lesson, planB, TEMP_STORAGE_KEY]);

  // 수동 저장 함수
  const handleManualSave = () => {
    const dataToSave = {
      projectName, story, surfaceCause, fiveWhys, categories, lesson, planB
    };
    localStorage.setItem(TEMP_STORAGE_KEY, JSON.stringify(dataToSave));
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2000);
  };

  // 5 Whys 필드 제어
  const handleWhyChange = (index, value) => {
    const updated = [...fiveWhys];
    updated[index] = value;
    setFiveWhys(updated);
  };

  const addWhyField = () => {
    if (fiveWhys.length < 5) {
      setFiveWhys([...fiveWhys, '']);
    }
  };

  const removeWhyField = (index) => {
    if (fiveWhys.length > 1) {
      const updated = fiveWhys.filter((_, i) => i !== index);
      setFiveWhys(updated);
    }
  };

  // 카테고리 체크 제어
  const toggleCategory = (catId) => {
    if (categories.includes(catId)) {
      setCategories(categories.filter(c => c !== catId));
    } else {
      setCategories([...categories, catId]);
    }
  };

  // 로컬 AI 템플릿 피드백 생성 엔진
  const handleGenerateAiFeedback = () => {
    if (!projectName.trim() || categories.length === 0) return;
    setIsGeneratingAi(true);

    setTimeout(() => {
      // 카테고리별 아날로그 플랜 B 데이터베이스
      const tipsDb = {
        env: [
          '학생들의 기기 테더링 및 오프라인 모드: 네트워크 차단 시 즉시 활용할 수 있도록, 인터넷 연결이 필요 없는 로컬 실행형 에디터나 다운로드 가능한 교재를 사전에 준비하세요.',
          '교사 핫스팟 및 백업 라우터 구비: 학교망 보안 정책으로 외부 사이트가 막히거나 트래픽 초과 시 사용할 교사 전용 무선 에그/모바일 핫스팟 환경을 이중화합니다.',
          '수업용 로컬 미디어 패키지: 유튜브 동영상이나 실시간 클라우드 에셋을 쓰는 대신, 영상 및 필수 리소스를 미리 USB에 다운로드해 교실에 지참하세요.'
        ],
        prep: [
          '프로그램 버전 사전 체크 및 동기화: 학생들이 사용하는 소프트웨어와 교사의 가이드용 버전이 일치하는지, 당일 배포된 업데이트 패치 내용을 사전 확인하세요.',
          '롤플레잉 리허설 및 10분 체크리스트: 수업 15분 전, 가상 학생 기기로 실제 학생 계정과 동일한 권한을 부여해 마지막 시연을 거칩니다.',
          '도우미 학생 사전 트레이닝: IT 기기 작동이 빠르고 숙련된 모둠별 학생 리더(AI 도우미)를 1명씩 선정하여 사전 오리엔테이션을 진행하세요.'
        ],
        tech: [
          '시뮬레이터/대체용 에뮬레이터 확보: 하드웨어 피지컬 컴퓨팅(아두이노, 마이크로비트 등) 고장 시, 브라우저에서 동작하는 온라인 가상 시뮬레이터(Tinkercad 등)를 대체로 활용합니다.',
          '에러 로그 분석 가이드 카드 배포: 자주 발생하는 에러 목록과 그에 따른 1차 자가 조치 매뉴얼(디버그 체크 시트)을 인쇄하여 모둠별로 배포하세요.',
          '여유 부품/기기 15% 룰: 센서, 케이블, 배터리 등 하드웨어는 무조건 15%의 여유분을 항상 교실 뒤편에 상시 대기시켜 즉시 교체해 줍니다.'
        ],
        student: [
          '비주얼 타임 바커 및 규칙 명시: 디바이스 활용 수업 중 학생들이 딴짓을 하거나 게임을 할 경우에 대비해 기기 덮개를 덮는 "Screen Down" 신호 체계와 보상 제도를 명문화합니다.',
          '역할 분담 협동 카드 배포: 개발자, 기록자, 프레젠터 등 1인 1역할을 엄격히 지정하여 한 학생이 코딩을 독점하거나 소외되지 않도록 역할을 구조화합니다.',
          '난이도 다원화 스크립트: 코딩 진도가 빠른 학생을 위해 "도전 과제 카드"를 따로 준비하고, 느린 학생을 위해 "스켈레톤 코드(빈칸 채우기)"를 보조 자료로 배포합니다.'
        ],
        other: [
          '비기기 아날로그 디자인 수업: 시스템 마비 시, 기기를 모두 끄고 화이트보드와 스티커를 활용한 알고리즘 순서도 그리기 또는 언플러그드 보드게임을 진행합니다.',
          '포스트잇 디버깅 월: 문제 상황과 해결 방안을 칠판 포스트잇에 공유하여 모둠 간 집단 지성으로 해결하게 만드는 아날로그 협업 시간을 가집니다.',
          '수업 일지 및 실패 리포팅 일상화: 학생들이 작성한 삽질 기록(에러 기록)을 칠판에 붙이게 하여 "가장 특이한 에러"를 찾아낸 모둠에게 스티커를 주며 격려합니다.'
        ]
      };

      // 선택된 카테고리들에서 예시 팁 추출 및 조립
      let selectedTips = [];
      categories.forEach(cat => {
        if (tipsDb[cat]) {
          selectedTips = [...selectedTips, ...tipsDb[cat]];
        }
      });

      // 무작위로 3가지 팁 셔플 및 선택
      selectedTips = selectedTips.sort(() => 0.5 - Math.random()).slice(0, 3);

      setAiFeedback({
        projectName: projectName,
        solutions: selectedTips
      });
      setIsGeneratingAi(false);
    }, 1200); // 1.2초의 생각하는 척(AI 딜레이) 연출
  };

  // 최종 제출 처리
  const handleFinalSubmit = async () => {
    // 필수 유효성 검증
    if (!projectName.trim() || !story.trim() || !surfaceCause.trim() || !lesson.trim() || !planB.trim()) {
      alert('모든 필수 항목을 입력하셔야 최종 제출이 가능합니다.');
      return;
    }

    const success = await submitMyCV(
      { projectName, story },
      { surfaceCause, fiveWhys, categories },
      { lesson, planB }
    );

    if (success) {
      // 제출 성공 시 임시저장소 비우기
      localStorage.removeItem(TEMP_STORAGE_KEY);
      alert('명예로운 실패 이력서가 등록되었습니다! 모둠 보드 공유 단계를 기다려 주세요.');
    } else {
      alert('이력서 제출에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-12 fade-enter-active">
      {/* 고정 상단 자동저장 바 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-200 brand-title">실패 이력서 작성</h2>
        <div className="flex items-center gap-2 text-xs">
          {isSavedAlert ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <Save size={12} className="animate-pulse" /> 임시저장 완료
            </span>
          ) : (
            <button 
              onClick={handleManualSave}
              className="text-gray-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <Save size={12} /> 임시저장
            </button>
          )}
        </div>
      </div>

      <StepIndicator currentStep={step} />

      <div className="glass-panel p-6 md:p-8 bg-slate-900/30">
        
        {/* ==========================================
            Step 1: 사건 재구성
           ========================================== */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h3 className="text-md font-bold text-cyan-400 flex items-center gap-2">
              <span>01. 수업 및 사건 재구성</span>
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400">수업 / 프로젝트명 *</label>
              <input
                type="text"
                placeholder="예: 마이크로비트 활용 스마트 홈 IoT 제작 수업"
                maxLength={50}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="glass-input"
              />
              <span className="text-[10px] text-right text-gray-500">{projectName.length}/50자</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400">
                사건 재구성 (어떻게 실패하셨나요?) *
              </label>
              <textarea
                placeholder="어떤 수업을 설계하였고, 본 수업 현장에서 어떤 예상치 못한 돌발 오작동이나 난관이 발생했는지 자유롭고 솔직하게 기술해 주세요. (50자 이상 권장)"
                rows={8}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="glass-input resize-none leading-relaxed"
              />
              <div className="flex justify-between text-[10px]">
                <span className={story.length < 50 ? 'text-pink-400' : 'text-emerald-400'}>
                  {story.length < 50 ? '최소 50자 작성을 권장합니다.' : '작성 분량 만족!'}
                </span>
                <span className="text-gray-500">{story.length}자</span>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                disabled={!projectName.trim() || !story.trim()}
                onClick={() => setStep(2)}
                className="neon-btn neon-btn-cyan"
              >
                <span>다음 단계로</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            Step 2: 사망 진단 (5 Whys) & 카테고리
           ========================================== */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h3 className="text-md font-bold text-cyan-400">
              02. 사망 진단서 (5 Whys 원인 탐색)
            </h3>

            {/* 표면적 원인 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400">표면적 원인 *</label>
              <input
                type="text"
                placeholder="예: 센서 납땜 접촉 불량으로 전원 공급 차단"
                maxLength={80}
                value={surfaceCause}
                onChange={(e) => setSurfaceCause(e.target.value)}
                className="glass-input"
              />
            </div>

            {/* 5 Whys 점진적 추가 필드 */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 flex items-center gap-1">
                  <span>5 Whys 파고들기</span>
                  <span className="text-[10px] font-normal text-gray-500">(꼬리물기 질문을 통해 진 진짜 원인 탐구)</span>
                </label>
                {fiveWhys.length < 5 && (
                  <button
                    type="button"
                    onClick={addWhyField}
                    className="p-1 rounded bg-white/5 border border-white/10 text-cyan-400 hover:bg-white/10 transition-colors text-[10px] flex items-center gap-1 font-bold"
                  >
                    <Plus size={10} /> 왜?(Why) 추가
                  </button>
                )}
              </div>

              {fiveWhys.map((why, idx) => (
                <div key={idx} className="flex gap-2 items-center five-why-row">
                  <span className="text-xs font-bold text-cyan-400 w-16 shrink-0 text-right">
                    Why {idx + 1} &raquo;
                  </span>
                  <input
                    type="text"
                    placeholder={
                      idx === 0 ? "왜 표면 원인이 발생했나요?" : 
                      idx === 1 ? "왜 그 사건이 유발되었나요?" : "점진적으로 근본적 원인을 캐내어 보세요."
                    }
                    value={why}
                    onChange={(e) => handleWhyChange(idx, e.target.value)}
                    className="glass-input flex-1 py-2 px-3 text-xs"
                  />
                  {fiveWhys.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWhyField(idx)}
                      className="p-2 text-gray-500 hover:text-rose-400 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 원인 카테고리 다중선택 */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-bold text-gray-400">원인 카테고리 태그 (중복 가능) *</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleCategory('env')}
                  className={`tag-chip tag-chip-cyan cursor-pointer ${categories.includes('env') ? 'active' : ''}`}
                >
                  환경 변수 (Wi-Fi/교실조도)
                </button>
                <button
                  type="button"
                  onClick={() => toggleCategory('prep')}
                  className={`tag-chip tag-chip-pink cursor-pointer ${categories.includes('prep') ? 'active' : ''}`}
                >
                  수업 준비 부족
                </button>
                <button
                  type="button"
                  onClick={() => toggleCategory('tech')}
                  className={`tag-chip cursor-pointer ${categories.includes('tech') ? 'active' : ''}`}
                >
                  기술적 오류 (S/W, H/W 버그)
                </button>
                <button
                  type="button"
                  onClick={() => toggleCategory('student')}
                  className={`tag-chip tag-chip-cyan cursor-pointer ${categories.includes('student') ? 'active' : ''}`}
                >
                  예측 불가 학생 변수
                </button>
                <button
                  type="button"
                  onClick={() => toggleCategory('other')}
                  className={`tag-chip tag-chip-pink cursor-pointer ${categories.includes('other') ? 'active' : ''}`}
                >
                  기타 (기타 하드웨어 고장 등)
                </button>
              </div>
            </div>

            {/* 이전/다음 버튼 */}
            <div className="flex justify-between mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="neon-btn neon-btn-secondary"
              >
                <ArrowLeft size={16} />
                <span>이전 단계로</span>
              </button>
              <button
                type="button"
                disabled={!surfaceCause.trim() || categories.length === 0}
                onClick={() => setStep(3)}
                className="neon-btn neon-btn-cyan"
              >
                <span>다음 단계로</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            Step 3: 플랜 B 설계 (회고 및 AI 피드백)
           ========================================== */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h3 className="text-md font-bold text-cyan-400">
              03. 플랜 B 설계 및 극복 방안
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400">이번 실패를 통해 배운 점 *</label>
              <textarea
                placeholder="이 실패를 겪으면서 깨닫거나 새로 알게 된 사실, 동료 교사들에게 나누고 싶은 기술 노하우를 써주세요."
                rows={3}
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                className="glass-input resize-none text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400">아날로그 대안 / 플랜 B 설계 *</label>
                <button
                  type="button"
                  onClick={handleGenerateAiFeedback}
                  disabled={isGeneratingAi || categories.length === 0}
                  className="p-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all text-[10px] flex items-center gap-1.5 font-bold"
                >
                  <Sparkles size={11} className={isGeneratingAi ? 'animate-spin' : ''} />
                  다른 선생님들의 플랜 B 보기
                </button>
              </div>
              <textarea
                placeholder="시스템 오작동 등 최악의 상황 시 바로 가동할 수 있는 아날로그 우회 경로(예: 스크린 다운 규칙, 모둠 보드 협업 등)나 복구 대안을 적어주세요."
                rows={3}
                value={planB}
                onChange={(e) => setPlanB(e.target.value)}
                className="glass-input resize-none text-xs"
              />
            </div>

            {/* AI 대안 피드백 뷰 */}
            {isGeneratingAi && (
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center gap-3">
                <div className="spinner w-4 h-4" />
                <span className="text-xs text-purple-300 brand-title tracking-wider animate-pulse">동료 교사들의 실패 극복 꿀팁을 로드하고 있습니다...</span>
              </div>
            )}

            {aiFeedback && !isGeneratingAi && (
              <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 fade-enter-active text-xs flex flex-col gap-2">
                <h4 className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="fill-purple-300/20" />
                  <span>실패학 AI 집단지성 제안 (실제 교사들의 Plan B)</span>
                </h4>
                <p className="text-[11px] text-gray-400 mb-2">선생님의 실패 카테고리와 유사한 극복 꿀팁입니다:</p>
                <ul className="flex flex-col gap-2 pl-3 list-disc text-gray-300 text-[11px]">
                  {aiFeedback.solutions.map((sol, index) => (
                    <li key={index} className="leading-relaxed">
                      {sol}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    // AI가 제시해준 대안을 마음에 들면 본인 플랜 B에 붙여넣기
                    const added = aiFeedback.solutions.map((s, i) => `${i+1}. ${s.split(': ')[1] || s}`).join('\n');
                    setPlanB(prev => prev ? `${prev}\n\n[추천 대안책]\n${added}` : `[추천 대안책]\n${added}`);
                    setAiFeedback(null);
                  }}
                  className="mt-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-[10px] font-bold border-none cursor-pointer text-center"
                >
                  이 대안을 내 이력서 플랜 B에 추가하기
                </button>
              </div>
            )}

            {/* 이전/제출 버튼 */}
            <div className="flex justify-between mt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="neon-btn neon-btn-secondary"
              >
                <ArrowLeft size={16} />
                <span>이전 단계로</span>
              </button>
              
              <button
                type="button"
                disabled={isLoading || !lesson.trim() || !planB.trim()}
                onClick={handleFinalSubmit}
                className="neon-btn neon-btn-pink"
              >
                {isLoading ? (
                  <span className="spinner w-4 h-4" />
                ) : (
                  <>
                    <span>이력서 최종 제출하기</span>
                    <Sparkles size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
