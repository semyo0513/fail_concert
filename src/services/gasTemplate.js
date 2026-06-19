export const GAS_SCRIPT_TEMPLATE = `/**
 * [실패학 콘서트] 구글 스프레드시트 백엔드 데이터베이스 스크립트
 * 
 * 사용법:
 * 1. 구글 스프레드시트를 새로 생성합니다.
 * 2. 상단 메뉴에서 [확장 프로그램] > [Apps Script]를 클릭합니다.
 * 3. 기존 코드를 모두 지우고 이 스크립트를 복사하여 붙여넣습니다.
 * 4. 상단 [저장] 아이콘을 누릅니다.
 * 5. 함수 선택 드롭다운에서 'setupSheets'를 선택하고 [실행]을 클릭합니다. (최초 1회, 권한 승인 필요)
 * 6. 우측 상단 [배포] > [새 배포]를 클릭합니다.
 * 7. 유형 선택(톱니바퀴)에서 [웹앱]을 선택합니다.
 * 8. 설정 항목을 입력합니다:
 *    - 설명: 실패학 콘서트 DB v1
 *    - 웹앱을 실행할 사용자: 나 (본인 구글 계정)
 *    - 액세스할 수 있는 사용자: 모든 사용자 (Anyone)
 * 9. [배포]를 클릭한 후 생성된 "웹앱 URL"을 복사하여, 웹앱의 관리자 설정창에 붙여넣습니다.
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. sessions 시트 생성
  var sessionsSheet = ss.getSheetByName("sessions");
  if (!sessionsSheet) {
    sessionsSheet = ss.insertSheet("sessions");
    sessionsSheet.appendRow(["sessionId", "title", "status", "groups", "awardCategories", "updatedAt"]);
    sessionsSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#E2E8F0");
  }
  
  // 2. cvs 시트 생성
  var cvsSheet = ss.getSheetByName("cvs");
  if (!cvsSheet) {
    cvsSheet = ss.insertSheet("cvs");
    cvsSheet.appendRow(["cvId", "sessionId", "groupCode", "authorName", "school", "part1", "part2", "part3", "empathyCount", "comments", "createdAt"]);
    cvsSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#E2E8F0");
  }
  
  // 3. votes 시트 생성
  var votesSheet = ss.getSheetByName("votes");
  if (!votesSheet) {
    votesSheet = ss.insertSheet("votes");
    votesSheet.appendRow(["voteId", "sessionId", "voterId", "selections", "submittedAt"]);
    votesSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#E2E8F0");
  }
  
  Logger.log("실패학 콘서트 시트 셋업 완료!");
}

// CORS 대응을 위한 JSON 응답 헬퍼
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET 요청 처리 (조회)
function doGet(e) {
  var action = e.parameter.action;
  var sessionId = e.parameter.sessionId;
  
  if (!action || !sessionId) {
    return jsonResponse({ success: false, error: "Missing action or sessionId" });
  }
  
  try {
    if (action === "getSession") {
      return getSession(sessionId);
    } else if (action === "getCVs") {
      return getCVs(sessionId);
    } else if (action === "getVotes") {
      return getVotes(sessionId);
    } else if (action === "getResults") {
      return getResults(sessionId);
    }
    
    return jsonResponse({ success: false, error: "Unknown GET action: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// POST 요청 처리 (생성, 수정)
function doPost(e) {
  try {
    var postData;
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else {
      return jsonResponse({ success: false, error: "No post data found" });
    }
    
    var action = postData.action;
    var sessionId = postData.sessionId;
    
    if (!action || !sessionId) {
      return jsonResponse({ success: false, error: "Missing action or sessionId" });
    }
    
    if (action === "createSession") {
      return createSession(postData);
    } else if (action === "updateSessionStatus") {
      return updateSessionStatus(postData);
    } else if (action === "updateSessionAwards") {
      return updateSessionAwards(postData);
    } else if (action === "submitCV") {
      return submitCV(postData);
    } else if (action === "empathy") {
      return addEmpathy(postData);
    } else if (action === "comment") {
      return addComment(postData);
    } else if (action === "submitVote") {
      return submitVote(postData);
    }
    
    return jsonResponse({ success: false, error: "Unknown POST action: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ==========================================
// 비즈니스 로직 함수들
// ==========================================

function getSession(sessionId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("sessions");
  if (!sheet) return jsonResponse({ success: false, error: "sessions sheet not initialized" });
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(sessionId).trim()) {
      return jsonResponse({
        success: true,
        data: {
          sessionId: data[i][0],
          title: data[i][1],
          status: data[i][2],
          groups: JSON.parse(data[i][3] || "[]"),
          awardCategories: JSON.parse(data[i][4] || "[]"),
          updatedAt: data[i][5]
        }
      });
    }
  }
  
  return jsonResponse({ success: false, error: "Session not found" });
}

function createSession(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("sessions");
  if (!sheet) setupSheets();
  sheet = ss.getSheetByName("sessions");
  
  var sessionId = data.sessionId;
  var title = data.title || "새로운 실패학 콘서트";
  var status = "waiting";
  var groupsStr = JSON.stringify(data.groups || []);
  var categoriesStr = JSON.stringify(data.awardCategories || []);
  var now = new Date().toISOString();
  
  // 기존 세션 확인 후 덮어쓰거나 새로 추가
  var rows = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(sessionId).trim()) {
      rowIndex = i + 1; // 1-based index
      break;
    }
  }
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 2, 1, 5).setValues([[title, status, groupsStr, categoriesStr, now]]);
  } else {
    sheet.appendRow([sessionId, title, status, groupsStr, categoriesStr, now]);
  }
  
  return jsonResponse({ success: true, sessionId: sessionId });
}

function updateSessionStatus(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("sessions");
  var rows = sheet.getDataRange().getValues();
  var sessionId = data.sessionId;
  var status = data.status;
  
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(sessionId).trim()) {
      sheet.getRange(i + 1, 3).setValue(status);
      sheet.getRange(i + 1, 6).setValue(new Date().toISOString());
      return jsonResponse({ success: true, sessionId: sessionId, status: status });
    }
  }
  return jsonResponse({ success: false, error: "Session not found" });
}

function updateSessionAwards(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("sessions");
  var rows = sheet.getDataRange().getValues();
  var sessionId = data.sessionId;
  var categoriesStr = JSON.stringify(data.awardCategories || []);
  
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(sessionId).trim()) {
      sheet.getRange(i + 1, 5).setValue(categoriesStr); // Column E
      sheet.getRange(i + 1, 6).setValue(new Date().toISOString()); // Column F
      return jsonResponse({ success: true, sessionId: sessionId });
    }
  }
  return jsonResponse({ success: false, error: "Session not found" });
}

function getCVs(sessionId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("cvs");
  if (!sheet) return jsonResponse({ success: true, data: [] });
  
  var rows = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === String(sessionId).trim()) {
      var part1 = {};
      try { part1 = JSON.parse(rows[i][5] || "{}"); } catch(e) { part1 = { projectName: String(rows[i][5]), story: "" }; }
      
      var part2 = {};
      try { part2 = JSON.parse(rows[i][6] || "{}"); } catch(e) { part2 = { surfaceCause: String(rows[i][6]), fiveWhys: [], categories: [] }; }
      
      var part3 = {};
      try { part3 = JSON.parse(rows[i][7] || "{}"); } catch(e) { part3 = { lesson: String(rows[i][7]), planB: "" }; }
      
      var comments = [];
      try { comments = JSON.parse(rows[i][9] || "[]"); } catch(e) { comments = []; }

      list.push({
        cvId: rows[i][0],
        sessionId: rows[i][1],
        groupCode: rows[i][2],
        authorName: rows[i][3],
        school: rows[i][4],
        part1: part1,
        part2: part2,
        part3: part3,
        empathyCount: Number(rows[i][8] || 0),
        comments: comments,
        createdAt: rows[i][10]
      });
    }
  }
  return jsonResponse({ success: true, data: list });
}

function submitCV(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("cvs");
  if (!sheet) setupSheets();
  sheet = ss.getSheetByName("cvs");
  
  var cvId = data.cvId;
  var sessionId = data.sessionId;
  var groupCode = data.groupCode;
  var authorName = data.authorName;
  var school = data.school;
  var part1Str = JSON.stringify(data.part1 || {});
  var part2Str = JSON.stringify(data.part2 || {});
  var part3Str = JSON.stringify(data.part3 || {});
  var now = new Date().toISOString();
  
  var rows = sheet.getDataRange().getValues();
  var rowIndex = -1;
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === cvId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex > 0) {
    // 기존 정보 수정 (공감 및 댓글 보존)
    sheet.getRange(rowIndex, 2, 1, 7).setValues([[sessionId, groupCode, authorName, school, part1Str, part2Str, part3Str]]);
  } else {
    // 신규 추가 (공감 0, 댓글 빈 배열)
    sheet.appendRow([cvId, sessionId, groupCode, authorName, school, part1Str, part2Str, part3Str, 0, "[]", now]);
  }
  
  return jsonResponse({ success: true, cvId: cvId });
}

function addEmpathy(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("cvs");
  var rows = sheet.getDataRange().getValues();
  var cvId = data.cvId;
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === cvId) {
      var cell = sheet.getRange(i + 1, 9);
      var currentVal = Number(cell.getValue() || 0);
      cell.setValue(currentVal + 1);
      return jsonResponse({ success: true, cvId: cvId, empathyCount: currentVal + 1 });
    }
  }
  return jsonResponse({ success: false, error: "CV not found" });
}

function addComment(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("cvs");
  var rows = sheet.getDataRange().getValues();
  var cvId = data.cvId;
  var text = data.commentText;
  var commentObj = { text: text, createdAt: new Date().toISOString() };
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === cvId) {
      var cell = sheet.getRange(i + 1, 10);
      var comments = JSON.parse(cell.getValue() || "[]");
      comments.push(commentObj);
      cell.setValue(JSON.stringify(comments));
      return jsonResponse({ success: true, cvId: cvId, comments: comments });
    }
  }
  return jsonResponse({ success: false, error: "CV not found" });
}

function getVotes(sessionId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("votes");
  if (!sheet) return jsonResponse({ success: true, data: [] });
  
  var rows = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === String(sessionId).trim()) {
      list.push({
        voteId: rows[i][0],
        sessionId: rows[i][1],
        voterId: rows[i][2],
        selections: JSON.parse(rows[i][3] || "[]"),
        submittedAt: rows[i][4]
      });
    }
  }
  return jsonResponse({ success: true, data: list });
}

function submitVote(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("votes");
  if (!sheet) setupSheets();
  sheet = ss.getSheetByName("votes");
  
  var voteId = data.voteId || ("V-" + Utilities.getUuid());
  var sessionId = data.sessionId;
  var voterId = data.voterId;
  var selectionsStr = JSON.stringify(data.selections || []);
  var now = new Date().toISOString();
  
  var rows = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === String(sessionId).trim() && String(rows[i][2]).trim() === String(voterId).trim()) {
      rowIndex = i + 1; // 1인 1투표 중복 방지 (기존 투표 덮어쓰기)
      break;
    }
  }
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, 5).setValues([[rows[rowIndex-1][0], sessionId, voterId, selectionsStr, now]]);
  } else {
    sheet.appendRow([voteId, sessionId, voterId, selectionsStr, now]);
  }
  
  return jsonResponse({ success: true, voterId: voterId });
}

function getResults(sessionId) {
  // 모든 CV와 투표 정보를 가져와 실시간으로 결과를 집계합니다.
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sessionSheet = ss.getSheetByName("sessions");
  var sessionRows = sessionSheet ? sessionSheet.getDataRange().getValues() : [];
  var targetSession = null;
  for (var i = 1; i < sessionRows.length; i++) {
    if (String(sessionRows[i][0]).trim() === String(sessionId).trim()) {
      targetSession = {
        sessionId: sessionRows[i][0],
        awardCategories: JSON.parse(sessionRows[i][4] || "[]")
      };
      break;
    }
  }
  
  if (!targetSession) {
    return jsonResponse({ success: false, error: "Session not found" });
  }
  
  var cvsSheet = ss.getSheetByName("cvs");
  var cvRows = cvsSheet ? cvsSheet.getDataRange().getValues() : [];
  var cvMap = {};
  for (var i = 1; i < cvRows.length; i++) {
    if (String(cvRows[i][1]).trim() === String(sessionId).trim()) {
      var projName = "미정";
      try { projName = JSON.parse(cvRows[i][5] || "{}").projectName || "미정"; } catch(e) { projName = String(cvRows[i][5]); }
      
      cvMap[cvRows[i][0]] = {
        cvId: cvRows[i][0],
        authorName: cvRows[i][3],
        school: cvRows[i][4],
        projectName: projName
      };
    }
  }
  
  var votesSheet = ss.getSheetByName("votes");
  var voteRows = votesSheet ? votesSheet.getDataRange().getValues() : [];
  
  // 카테고리별 득표 집계 초기화
  var categoryVotes = {};
  targetSession.awardCategories.forEach(function(cat) {
    categoryVotes[cat.id] = {};
  });
  
  // 투표 순회하며 카운트
  for (var i = 1; i < voteRows.length; i++) {
    if (String(voteRows[i][1]).trim() === String(sessionId).trim()) {
      var selections = JSON.parse(voteRows[i][3] || "[]");
      selections.forEach(function(sel) {
        var catId = sel.categoryId;
        var cvId = sel.cvId;
        if (categoryVotes[catId]) {
          if (!categoryVotes[catId][cvId]) {
            categoryVotes[catId][cvId] = 0;
          }
          categoryVotes[catId][cvId]++;
        }
      });
    }
  }
  
  // 결과 객체 구성
  var results = targetSession.awardCategories.map(function(cat) {
    var votesForCat = categoryVotes[cat.id];
    var winnerList = [];
    var maxVotes = 0;
    
    // 최다 득표 수 찾기
    for (var cvId in votesForCat) {
      if (votesForCat[cvId] > maxVotes) {
        maxVotes = votesForCat[cvId];
      }
    }
    
    // 공동 우승자 포함하여 목록 추출 (득표가 1표 이상인 경우에만)
    if (maxVotes > 0) {
      for (var cvId in votesForCat) {
        if (votesForCat[cvId] === maxVotes && cvMap[cvId]) {
          winnerList.push({
            cvId: cvId,
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
      winners: winnerList,
      voteCount: Object.keys(votesForCat).reduce(function(acc, key) { return acc + votesForCat[key]; }, 0)
    };
  });
  
  return jsonResponse({
    success: true,
    results: results
  });
}
`;
