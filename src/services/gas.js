/**
 * [실패학 콘서트] Google Apps Script (GAS) API 서비스 및 로컬 데모 모드 엔진
 */

// 로컬스토리지 키
const STORAGE_KEYS = {
  GAS_URL: 'failure_cv_gas_url',
  DEMO_DB: 'failure_cv_demo_db',
  USER_INFO: 'failure_cv_user_info'
};

// 가상의 실패 사례 목록 (데모 체험용 초기 데이터)
const MOCK_TEACHERS = [
  {
    cvId: 'mock-1',
    sessionId: 'demo',
    groupCode: '101',
    authorName: '박실패',
    school: '창조중학교',
    part1: {
      projectName: '엔트리 인공지능 자율주행 수업',
      story: '카메라 인식으로 신호등을 판별하는 자율주행 차 수업을 준비했습니다. 전날 밤 교무실에서는 완벽하게 감지하던 인공지능이, 본 수업 시간 교실의 직사광선 앞에서는 적색등과 청색등을 전혀 구분하지 못해 차들이 전부 충돌하며 아수라장이 되었습니다.'
    },
    part2: {
      surfaceCause: '교실 조도(햇빛)에 따른 이미지 인식 모델의 과적합 및 오작동',
      fiveWhys: [
        '교실 창가의 직사광선이 너무 강해 카메라에 반사가 생겼다.',
        '전날 밤에 형광등 조명 아래에서만 학습 모델 사진 데이터를 촬영했다.',
        '자율주행 환경은 실외나 햇빛 아래 등 조도가 수시로 변한다는 것을 간과했다.',
        '다양한 환경 조건에서 사전 테스트를 거치지 않고 서둘러 수업을 설계했다.',
        '완벽하게 준비했다는 자만심에 환경적 변수(조도)에 대한 플랜 B가 없었다.'
      ],
      categories: ['env', 'tech', 'prep']
    },
    part3: {
      lesson: 'AI 이미지 분류는 조도 센서나 외부 빛에 매우 취약하다는 점과, 반드시 다양한 광원 조건에서 학습 데이터를 수집해야 함을 뼈저리게 배웠습니다.',
      planB: '교실 창문에 암막 커튼을 치거나, 인공지능 카메라 대신 초음파 센서와 아날로그 라인 트레이서를 이용한 우회 수업안을 미리 준비해 둡니다.'
    },
    empathyCount: 5,
    comments: [
      { text: '빛 반사는 진짜 예상하기 힘든 복병이죠ㅠㅠ', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { text: '저도 비슷한 경험 있어요! 격하게 공감합니다.', createdAt: new Date(Date.now() - 1800000).toISOString() }
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    cvId: 'mock-2',
    sessionId: 'demo',
    groupCode: '101',
    authorName: '이오류',
    school: '미래고등학교',
    part1: {
      projectName: 'Teachable Machine 활용 쓰레기 분리배출 로봇',
      story: '티쳐블 머신으로 페트병과 캔을 분류하여 서보 모터로 문이 열리는 스마트 쓰레기통을 만들었습니다. 대망의 발표 날, 교장선생님께서 시연하시는데 모터가 오작동하여 페트병을 넣자마자 캔 보관함 문이 세차게 열리며 쓰레기가 밖으로 튀었습니다.'
    },
    part2: {
      surfaceCause: '아두이노 전원 부족으로 인한 서보 모터의 지터링(떨림) 현상 및 오작동',
      fiveWhys: [
        '서보 모터 구동 시 전압이 급격히 강하해 아두이노 보드가 리셋되었다.',
        '아두이노의 5V 핀에 모터 전원을 다이렉트로 연결하여 전류 공급이 부족했다.',
        '서보 모터는 구동 시 전류 소비가 커 외장 전원 공급이 필수적이라는 기초 지식이 약했다.',
        '하드웨어 전류 설계 검토를 생략하고 시뮬레이터로만 구동하여 안심했다.'
      ],
      categories: ['tech', 'prep']
    },
    part3: {
      lesson: '모터나 하드웨어를 다룰 때는 절대로 컨트롤러 보드 전원만 쓰면 안 되고, 서보 모터용 독립 전원(배터리팩 등)을 따로 설계해야 한다는 법칙을 배웠습니다.',
      planB: '수업 시간에 미리 여분의 외장 4AA 배터리 홀더를 확보해 두거나, 하드웨어 작동 오류 시 손으로 직접 열 수 있는 수동 경첩 방식을 플랜 B로 둡니다.'
    },
    empathyCount: 3,
    comments: [
      { text: '아두이노 서보 모터 전류 강하는 국룰이죠. 힘내세요!', createdAt: new Date(Date.now() - 2400000).toISOString() }
    ],
    createdAt: new Date(Date.now() - 5400000).toISOString()
  }
];

// 초기 데모 디비 구조
const DEFAULT_DEMO_DB = {
  session: {
    sessionId: 'demo',
    title: '[데모 모드] 제1회 실패학 콘서트',
    status: 'writing', // waiting | writing | sharing | voting | closed
    groups: [
      { groupCode: '101', groupName: '1모둠 (인공지능)' },
      { groupCode: '102', groupName: '2모둠 (메이커)' }
    ],
    awardCategories: [
      { id: 'award-1', name: '올해의 아름다운 폭망상', description: '가장 용감하게 도전했고, 가장 화려하게 실패했으나, 그 용기 자체를 기립니다.' },
      { id: 'award-2', name: '불사조상', description: '멘붕의 순간, 아무도 예상 못한 방법으로 수업을 수습해낸 순발력을 기립니다.' },
      { id: 'award-3', name: '인간 디버거상', description: '오류와의 처절한 사투 속에서도 끝까지 분석하고 배움을 남긴 끈기를 기립니다.' }
    ]
  },
  cvs: [...MOCK_TEACHERS],
  votes: []
};

// 로컬 스토리지 헬퍼
export const getGasUrl = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.GAS_URL);
  if (saved === "") return ""; // 명시적으로 비워둔 경우 데모 모드로 인식
  return saved || 'https://script.google.com/macros/s/AKfycbwn5BDfJqK0Be_j5vS2vlt7XKFM7JQg_-xEsEr4qXhCTK0XPjIjtq_YfXa4oP2fcjkS/exec';
};
export const setGasUrl = (url) => {
  if (url !== null && url !== undefined) {
    localStorage.setItem(STORAGE_KEYS.GAS_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.GAS_URL);
  }
};
export const isDemoMode = () => !getGasUrl();


// 데모용 DB 가져오기
const getDemoDb = () => {
  const data = localStorage.getItem(STORAGE_KEYS.DEMO_DB);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.DEMO_DB, JSON.stringify(DEFAULT_DEMO_DB));
    return DEFAULT_DEMO_DB;
  }
  return JSON.parse(data);
};

// 데모용 DB 저장하기
const saveDemoDb = (db) => {
  localStorage.setItem(STORAGE_KEYS.DEMO_DB, JSON.stringify(db));
};

// ==========================================
// API 요청 처리기
// ==========================================

// HTTP GET 요청 (GAS Web App)
async function fetchGet(url, action, sessionId) {
  const queryUrl = `${url}?action=${action}&sessionId=${encodeURIComponent(sessionId)}&_t=${Date.now()}`;
  const response = await fetch(queryUrl, {
    method: 'GET',
    mode: 'cors',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  return await response.json();
}

// HTTP POST 요청 (GAS Web App)
// CORS preflight OPTIONS 요청을 방지하기 위해 Content-Type을 text/plain으로 보내는 중요 팁 적용
async function fetchPost(url, action, sessionId, data = {}) {
  const payload = { action, sessionId, ...data };
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'text/plain' // CORS preflight 회피
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  return await response.json();
}

// 통합 API 인터페이스 (데모 모드 및 GAS 모드 하이브리드 지원)
export const gasApi = {
  // 1. 세션 정보 조회
  async getSession(sessionId) {
    if (isDemoMode()) {
      const db = getDemoDb();
      if (db.session.sessionId === sessionId) {
        return { success: true, data: db.session };
      }
      return { success: false, error: '세션을 찾을 수 없습니다.' };
    }
    return await fetchGet(getGasUrl(), 'getSession', sessionId);
  },

  // 2. 세션 생성
  async createSession(sessionId, title, groups, awardCategories) {
    if (isDemoMode()) {
      const db = getDemoDb();
      db.session = {
        sessionId,
        title,
        status: 'waiting',
        groups: groups || [],
        awardCategories: awardCategories || DEFAULT_DEMO_DB.session.awardCategories
      };
      db.cvs = [...MOCK_TEACHERS]; // 데모 세션 생성 시 기본 사례 초기화
      db.votes = [];
      saveDemoDb(db);
      return { success: true, sessionId };
    }
    return await fetchPost(getGasUrl(), 'createSession', sessionId, { title, groups, awardCategories });
  },

  // 3. 세션 상태 업데이트
  async updateSessionStatus(sessionId, status) {
    if (isDemoMode()) {
      const db = getDemoDb();
      if (db.session.sessionId === sessionId) {
        db.session.status = status;
        saveDemoDb(db);
        
        // 데모 모드일 때 투표 단계 진입 시, 가상의 모둠원들이 자동으로 투표에 참여하게 만드는 시뮬레이터 실행
        if (status === 'voting' && db.votes.length === 0) {
          simulateDemoVotes(db, sessionId);
        }
        return { success: true, sessionId, status };
      }
      return { success: false, error: '세션을 찾을 수 없습니다.' };
    }
    return await fetchPost(getGasUrl(), 'updateSessionStatus', sessionId, { status });
  },

  // 3-2. 시상명 업데이트
  async updateSessionAwards(sessionId, awardCategories) {
    if (isDemoMode()) {
      const db = getDemoDb();
      if (db.session.sessionId === sessionId) {
        db.session.awardCategories = awardCategories;
        saveDemoDb(db);
        return { success: true };
      }
      return { success: false, error: '세션을 찾을 수 없습니다.' };
    }
    return await fetchPost(getGasUrl(), 'updateSessionAwards', sessionId, { awardCategories });
  },

  // 4. 이력서 목록 조회
  async getCVs(sessionId) {
    if (isDemoMode()) {
      const db = getDemoDb();
      // 데모 모드에서는 세션 아이디가 demo가 아니더라도 데모용 데이터를 줌
      return { success: true, data: db.cvs };
    }
    return await fetchGet(getGasUrl(), 'getCVs', sessionId);
  },

  // 5. 이력서 제출
  async submitCV(sessionId, cvData) {
    if (isDemoMode()) {
      const db = getDemoDb();
      const idx = db.cvs.findIndex(c => c.cvId === cvData.cvId);
      const newCv = {
        ...cvData,
        sessionId,
        empathyCount: idx >= 0 ? db.cvs[idx].empathyCount : 0,
        comments: idx >= 0 ? db.cvs[idx].comments : [],
        createdAt: idx >= 0 ? db.cvs[idx].createdAt : new Date().toISOString()
      };
      if (idx >= 0) {
        db.cvs[idx] = newCv;
      } else {
        db.cvs.push(newCv);
      }
      saveDemoDb(db);
      return { success: true, cvId: cvData.cvId };
    }
    return await fetchPost(getGasUrl(), 'submitCV', sessionId, cvData);
  },

  // 6. 공감 추가
  async addEmpathy(sessionId, cvId) {
    if (isDemoMode()) {
      const db = getDemoDb();
      const cv = db.cvs.find(c => c.cvId === cvId);
      if (cv) {
        cv.empathyCount = (cv.empathyCount || 0) + 1;
        saveDemoDb(db);
        return { success: true, cvId, empathyCount: cv.empathyCount };
      }
      return { success: false, error: '이력서를 찾을 수 없습니다.' };
    }
    return await fetchPost(getGasUrl(), 'empathy', sessionId, { cvId });
  },

  // 7. 댓글 추가
  async addComment(sessionId, cvId, commentText) {
    if (isDemoMode()) {
      const db = getDemoDb();
      const cv = db.cvs.find(c => c.cvId === cvId);
      if (cv) {
        if (!cv.comments) cv.comments = [];
        const comment = { text: commentText, createdAt: new Date().toISOString() };
        cv.comments.push(comment);
        saveDemoDb(db);
        return { success: true, cvId, comments: cv.comments };
      }
      return { success: false, error: '이력서를 찾을 수 없습니다.' };
    }
    return await fetchPost(getGasUrl(), 'comment', sessionId, { cvId, commentText });
  },

  // 8. 투표 전체 정보 조회 (관리자용)
  async getVotes(sessionId) {
    if (isDemoMode()) {
      const db = getDemoDb();
      return { success: true, data: db.votes };
    }
    return await fetchGet(getGasUrl(), 'getVotes', sessionId);
  },

  // 9. 투표 제출
  async submitVote(sessionId, voteData) {
    if (isDemoMode()) {
      const db = getDemoDb();
      const voterId = voteData.voterId;
      const idx = db.votes.findIndex(v => v.voterId === voterId && v.sessionId === sessionId);
      const voteObj = {
        voteId: idx >= 0 ? db.votes[idx].voteId : 'V-' + Math.random().toString(36).substr(2, 9),
        sessionId,
        voterId,
        selections: voteData.selections,
        submittedAt: new Date().toISOString()
      };
      if (idx >= 0) {
        db.votes[idx] = voteObj;
      } else {
        db.votes.push(voteObj);
      }
      saveDemoDb(db);
      return { success: true, voterId };
    }
    return await fetchPost(getGasUrl(), 'submitVote', sessionId, voteData);
  },

  // 10. 최종 시상 집계 결과 조회
  async getResults(sessionId) {
    if (isDemoMode()) {
      const db = getDemoDb();
      
      // 데모 모드에서의 실시간 시상 결과 직접 연산
      const cvMap = {};
      db.cvs.forEach(c => {
        cvMap[c.cvId] = {
          cvId: c.cvId,
          authorName: c.authorName,
          school: c.school,
          projectName: c.part1.projectName
        };
      });

      const categoryVotes = {};
      db.session.awardCategories.forEach(cat => {
        categoryVotes[cat.id] = {};
      });

      db.votes.forEach(vote => {
        if (vote.sessionId === sessionId) {
          vote.selections.forEach(sel => {
            const catId = sel.categoryId;
            const cvId = sel.cvId;
            if (categoryVotes[catId]) {
              categoryVotes[catId][cvId] = (categoryVotes[catId][cvId] || 0) + 1;
            }
          });
        }
      });

      const results = db.session.awardCategories.map(cat => {
        const votesForCat = categoryVotes[cat.id] || {};
        let maxVotes = 0;
        for (const cvId in votesForCat) {
          if (votesForCat[cvId] > maxVotes) {
            maxVotes = votesForCat[cvId];
          }
        }

        const winners = [];
        if (maxVotes > 0) {
          for (const cvId in votesForCat) {
            if (votesForCat[cvId] === maxVotes && cvMap[cvId]) {
              winners.push({
                cvId,
                authorName: cvMap[cvId].authorName,
                school: cvMap[cvId].school,
                projectName: cvMap[cvId].projectName,
                votes: maxVotes
              });
            }
          }
        }

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          winners,
          voteCount: Object.values(votesForCat).reduce((a, b) => a + b, 0)
        };
      });

      return { success: true, results };
    }
    return await fetchGet(getGasUrl(), 'getResults', sessionId);
  }
};

// 데모 모드용 가상 투표 시뮬레이터
function simulateDemoVotes(db, sessionId) {
  // 모둠 참가자는 박실패(mock-1), 이오류(mock-2), 그리고 본인(보통 로컬스토리지에 저장됨) 등
  // 데모 시나리오를 위해 3명의 가상 투표 데이터를 인위적으로 삽입
  const awardIds = db.session.awardCategories.map(c => c.id);
  const cvIds = db.cvs.map(c => c.cvId);
  
  if (cvIds.length === 0) return;

  // 가상 교사 1 (박실패)의 투표
  db.votes.push({
    voteId: 'V-sim-1',
    sessionId,
    voterId: 'mock-voter-1',
    selections: [
      { categoryId: awardIds[0], cvId: 'mock-2' }, // 이오류 선택
      { categoryId: awardIds[1], cvId: 'mock-2' },
      { categoryId: awardIds[2], cvId: 'mock-2' }
    ],
    submittedAt: new Date().toISOString()
  });

  // 가상 교사 2 (이오류)의 투표
  db.votes.push({
    voteId: 'V-sim-2',
    sessionId,
    voterId: 'mock-voter-2',
    selections: [
      { categoryId: awardIds[0], cvId: 'mock-1' }, // 박실패 선택
      { categoryId: awardIds[1], cvId: 'mock-1' },
      { categoryId: awardIds[2], cvId: 'mock-1' }
    ],
    submittedAt: new Date().toISOString()
  });
  
  saveDemoDb(db);
}
