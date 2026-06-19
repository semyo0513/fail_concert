import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { gasApi, getGasUrl, setGasUrl, isDemoMode } from '../services/gas';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // 전역 상태
  const [gasUrl, setGasUrlState] = useState(getGasUrl());
  const [isDemo, setIsDemo] = useState(isDemoMode());
  const [session, setSession] = useState(null);
  const [cvs, setCvs] = useState([]);
  const [votes, setVotes] = useState([]);
  const [results, setResults] = useState([]);
  
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('failure_cv_user_info');
    if (saved) return JSON.parse(saved);
    // 최초 방문 시 익명 voterId 생성
    return {
      authorName: '',
      school: '',
      groupCode: '',
      voterId: 'U-' + Math.random().toString(36).substr(2, 9)
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 현재 활성화된 세션 ID (참가자 입장 시 또는 관리자 로드 시 보관)
  const [activeSessionId, setActiveSessionId] = useState(() => {
    return localStorage.getItem('failure_cv_active_session_id') || '';
  });

  // 폴링용 interval ref
  const pollingRef = useRef(null);

  // 로컬스토리지에 유저 정보 저장
  const saveUser = (userInfo) => {
    const updated = { ...user, ...userInfo };
    setUser(updated);
    localStorage.setItem('failure_cv_user_info', JSON.stringify(updated));
  };

  // GAS URL 체크 및 변경
  const updateGasUrl = (url) => {
    setGasUrl(url);
    setGasUrlState(url);
    setIsDemo(!url);
  };

  // 데이터 리프레시 헬퍼 (Smart Polling 및 강제 리프레시용)
  const refreshData = useCallback(async () => {
    if (!activeSessionId) return;

    try {
      // 1. 세션 메타 정보 가져오기 (세션의 현재 status 공유)
      const resSession = await gasApi.getSession(activeSessionId);
      if (resSession.success) {
        setSession(resSession.data);
        
        const currentStatus = resSession.data.status;

        // 2. 상태에 맞춰 다른 정보들 폴링
        if (currentStatus === 'writing' || currentStatus === 'sharing' || currentStatus === 'voting') {
          const resCvs = await gasApi.getCVs(activeSessionId);
          if (resCvs.success) {
            setCvs(resCvs.data);
          }
        }

        if (currentStatus === 'voting') {
          const resVotes = await gasApi.getVotes(activeSessionId);
          if (resVotes.success) {
            setVotes(resVotes.data);
          }
        }

        if (currentStatus === 'closed') {
          const resResults = await gasApi.getResults(activeSessionId);
          if (resResults.success) {
            setResults(resResults.results);
          }
        }
      } else {
        // 세션 정보 로드 실패 시 데모 모드가 아닌 경우 에러 출력
        if (!isDemo) {
          setError('세션 정보를 가져올 수 없습니다. URL 혹은 세션 ID를 확인해 주세요.');
        }
      }
    } catch (err) {
      console.error('Data polling error:', err);
    }
  }, [activeSessionId, isDemo]);

  // 스마트 폴링 엔진 (Smart Polling)
  useEffect(() => {
    // 기존 폴링 제거
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (!activeSessionId) return;

    // 초기 로드
    refreshData();

    // 세션 단계에 맞게 폴링 주기 조절
    // voting 이나 closed 상태에서는 3초 주기, 그 외(writing, sharing)는 5초 주기
    let intervalTime = 5000;
    if (session && (session.status === 'voting' || session.status === 'closed')) {
      intervalTime = 3000;
    }

    pollingRef.current = setInterval(() => {
      refreshData();
    }, intervalTime);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [activeSessionId, session?.status, refreshData]);

  // ==========================================
  // 비즈니스 로직 연동 API 함수들
  // ==========================================

  // 1. 세션 생성 / 초기화 (관리자용)
  const setupNewSession = async (sessionId, title, groups) => {
    setIsLoading(true);
    setError('');
    try {
      const formattedGroups = groups.map((g, i) => ({
        groupCode: String(101 + i),
        groupName: g.trim()
      }));
      
      const res = await gasApi.createSession(sessionId, title, formattedGroups);
      if (res.success) {
        setActiveSessionId(sessionId);
        localStorage.setItem('failure_cv_active_session_id', sessionId);
        await refreshData();
        return true;
      } else {
        setError(res.error || '세션 생성에 실패했습니다.');
        return false;
      }
    } catch (err) {
      setError('서버 연결 실패: ' + err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 세션 단계 변경 (관리자용)
  const changeSessionStatus = async (status) => {
    if (!activeSessionId) return;
    try {
      const res = await gasApi.updateSessionStatus(activeSessionId, status);
      if (res.success) {
        setSession(prev => prev ? { ...prev, status } : null);
        // 단계 변경 직후 강제 리프레시
        await refreshData();
      }
    } catch (err) {
      console.error('Failed to change session status:', err);
    }
  };

  // 3. 참가자 정보 설정 및 입장
  const enterSession = async (authorName, school, groupCode, sessionId) => {
    setIsLoading(true);
    setError('');
    try {
      // 1. 해당 세션 존재 및 상태 체크
      const res = await gasApi.getSession(sessionId);
      if (res.success) {
        // 그룹 유효성 검증
        const sessionData = res.data;
        const groupExists = sessionData.groups.some(g => g.groupCode === groupCode);
        if (!groupExists && groupCode !== 'admin') {
          setError('해당 모둠 코드가 세션에 존재하지 않습니다.');
          setIsLoading(false);
          return false;
        }

        // 유저 정보 저장 (동일 이름/학교인지 확인 후 다르면 voterId 재생성)
        let finalVoterId = user.voterId || ('U-' + Math.random().toString(36).substr(2, 9));
        if (user.authorName && (user.authorName !== authorName || user.school !== school)) {
          finalVoterId = 'U-' + Math.random().toString(36).substr(2, 9);
        }
        saveUser({ authorName, school, groupCode, voterId: finalVoterId });
        setActiveSessionId(sessionId);
        localStorage.setItem('failure_cv_active_session_id', sessionId);
        setSession(sessionData);
        setError('');
        setIsLoading(false);
        return true;
      } else {
        setError('유효하지 않은 세션 코드입니다. 다시 확인해 주세요.');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다: ' + err.message);
      setIsLoading(false);
      return false;
    }
  };

  // 4. 이력서 제출
  const submitMyCV = async (part1, part2, part3) => {
    if (!activeSessionId || !user.authorName) return false;
    setIsLoading(true);
    try {
      const cvData = {
        cvId: 'CV-' + user.voterId, // 1인 1이력서 보장 (voterId 기반 Key)
        groupCode: user.groupCode,
        authorName: user.authorName,
        school: user.school,
        part1,
        part2,
        part3
      };
      const res = await gasApi.submitCV(activeSessionId, cvData);
      if (res.success) {
        await refreshData();
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      return false;
    }
  };

  // 5. 공감(하트) 보내기
  const sendEmpathy = async (cvId) => {
    try {
      // 낙관적 업데이트 (UI 딜레이 방지)
      setCvs(prev => prev.map(c => c.cvId === cvId ? { ...c, empathyCount: (c.empathyCount || 0) + 1 } : c));
      await gasApi.addEmpathy(activeSessionId, cvId);
    } catch (err) {
      console.error('Failed to send empathy:', err);
    }
  };

  // 6. 댓글 등록
  const sendComment = async (cvId, commentText) => {
    if (!commentText.trim()) return;
    try {
      // 낙관적 업데이트
      const newComment = { text: commentText, createdAt: new Date().toISOString() };
      setCvs(prev => prev.map(c => c.cvId === cvId ? { ...c, comments: [...(c.comments || []), newComment] } : c));
      
      await gasApi.addComment(activeSessionId, cvId, commentText);
    } catch (err) {
      console.error('Failed to send comment:', err);
    }
  };

  // 7. 시상 투표 제출
  const sendVote = async (selections) => {
    if (!activeSessionId) return false;
    setIsLoading(true);
    try {
      const voteData = {
        voterId: user.voterId,
        selections // [{ categoryId, cvId }]
      };
      const res = await gasApi.submitVote(activeSessionId, voteData);
      if (res.success) {
        await refreshData();
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      return false;
    }
  };

  // 로그아웃 / 세션 나가기
  const exitSession = () => {
    setActiveSessionId('');
    localStorage.removeItem('failure_cv_active_session_id');
    setSession(null);
    setCvs([]);
    setVotes([]);
    setResults([]);
    setUser(prev => ({
      ...prev,
      authorName: '',
      school: '',
      groupCode: ''
    }));
  };

  return (
    <AppContext.Provider
      value={{
        gasUrl,
        isDemo,
        updateGasUrl,
        user,
        saveUser,
        session,
        cvs,
        votes,
        results,
        isLoading,
        error,
        activeSessionId,
        setActiveSessionId,
        enterSession,
        setupNewSession,
        changeSessionStatus,
        submitMyCV,
        sendEmpathy,
        sendComment,
        sendVote,
        refreshData,
        exitSession
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
