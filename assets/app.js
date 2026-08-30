(function () {
  'use strict';
  var D = window.DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);

  function days(iso) {
    var d = new Date(iso + 'T00:00:00');
    return Math.round((d - TODAY) / 86400000);
  }
  function fmt(iso) {
    var d = new Date(iso + 'T00:00:00');
    var w = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    return (d.getMonth() + 1) + '.' + d.getDate() + '(' + w + ')';
  }
  function ddText(n) {
    return n === 0 ? 'D-DAY' : n > 0 ? 'D-' + n : 'D+' + (-n);
  }

  /* ================= 대시보드 ================= */
  function renderHome() {
    var upcoming = D.keyDates.filter(function (k) { return days(k.date) >= 0; }).slice(0, 4);
    if (!upcoming.length) upcoming = D.keyDates.slice(-4);

    var minCount = D.susi.filter(function (s) { return s.hasMinimum === true; }).length;
    var partial = D.susi.filter(function (s) { return s.hasMinimum === 'partial'; }).length;
    var interviews = D.susi.filter(function (s) { return s.hasInterview; }).length;

    var h = '';

    h += '<div class="grid g4">' + upcoming.map(function (k) {
      var n = days(k.date);
      return '<div class="card dday ' + k.kind + (n < 0 ? ' past' : '') + '">' +
        '<div class="n">' + ddText(n) + '</div>' +
        '<div class="l">' + esc(k.label) + '</div>' +
        '<div class="d">' + esc(k.date.replace(/-/g, '.')) + ' ' + fmt(k.date).replace(/^[\d.]+/, '') + '</div>' +
        '</div>';
    }).join('') + '</div>';

    h += '<h2 class="sec">한눈에 보기</h2>';
    h += '<div class="grid g4">' +
      stat('수시 지원 카드', D.susi.length + '장', '학종 4 · 논술 2') +
      stat('수능최저 걸린 카드', minCount + '장', partial ? '+ 부분 적용 ' + partial + '장' : '나머지는 최저 없음') +
      stat('면접이 있는 카드', interviews + '장', '12월 초 집중') +
      stat('논술고사', '2회', '11.21(토) · 11.22(일)') +
      '</div>';

    h += '<h2 class="sec">지원 카드 요약</h2>';
    h += '<div class="card scroll-x"><table class="tbl"><thead><tr>' +
      '<th>대학</th><th>모집단위</th><th>전형</th><th>모집</th><th>수능최저</th><th>면접</th>' +
      '</tr></thead><tbody>' +
      D.susi.map(function (s) {
        var tr = trackOf(s.track);
        return '<tr>' +
          '<td><b>' + esc(s.univ.replace('학교', '')) + '</b></td>' +
          '<td>' + esc(s.dept) + ' <span class="pill ' + tr.tone + '">' + esc(tr.short) + '</span></td>' +
          '<td>' + esc(s.typeName) + '</td>' +
          '<td>' + (s.quota ? s.quota + '명' : '<span style="color:var(--text-3)">확인 필요</span>') + '</td>' +
          '<td>' + minPill(s) + '</td>' +
          '<td>' + interviewPill(s) + '</td>' +
          '</tr>';
      }).join('') +
      '</tbody></table></div>';

    h += '<h2 class="sec">전체 일정</h2>';
    h += '<div class="card" style="padding:14px 18px"><ul class="tl">' +
      D.keyDates.map(function (k) {
        var n = days(k.date);
        return '<li class="' + k.kind + (n < 0 ? ' past' : '') + '">' +
          '<span class="dt">' + esc(k.date.slice(2).replace(/-/g, '.')) + ' ' + fmt(k.date).replace(/^[\d.]+/, '') + '</span>' +
          '<span class="lb">' + esc(k.label) + '</span>' +
          '<span class="dd">' + ddText(n) + '</span>' +
          '</li>';
      }).join('') +
      '</ul></div>';

    h += '<h2 class="sec">준비 체크리스트</h2>';
    h += '<div class="card"><ul class="chk" id="chk">' +
      D.checklist.map(function (c) {
        var n = days(c.due);
        return '<li data-id="' + c.id + '">' +
          '<input type="checkbox" id="' + c.id + '">' +
          '<label class="t" for="' + c.id + '">' + esc(c.text) +
          '<span class="meta"><span class="pill grey">' + esc(c.tag) + '</span>' +
          '<span style="font-size:12px;color:var(--text-3)">' + esc(c.due.replace(/-/g, '.')) + ' · ' + ddText(n) + '</span></span>' +
          '</label></li>';
      }).join('') +
      '</ul></div>';

    $('#home').innerHTML = h;
    wireChecklist();
  }

  function stat(k, v, s) {
    return '<div class="card stat"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div><div class="s">' + esc(s) + '</div></div>';
  }
  function minPill(s) {
    if (s.hasMinimum === true) return '<span class="pill red">있음</span>';
    if (s.hasMinimum === 'partial') return '<span class="pill amber">일부</span>';
    return '<span class="pill green">없음</span>';
  }
  function interviewPill(s) {
    if (s.hasInterview === true) return '<span class="pill amber">있음</span>';
    if (s.hasInterview === 'partial') return '<span class="pill amber">일부</span>';
    return '<span class="pill grey">없음</span>';
  }
  function trackOf(k) {
    var m = {
      bio: { tone: 'blue', short: '생명', label: '생명과학 계열' },
      biz: { tone: 'amber', short: '경영', label: '인문계 전문직' },
      nurse: { tone: 'rose', short: '간호', label: '간호학' }
    };
    return m[k] || { tone: 'grey', short: '기타', label: '기타' };
  }

  function wireChecklist() {
    var KEY = 'naeun-chk';
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
    var list = document.querySelectorAll('#chk li');
    Array.prototype.forEach.call(list, function (li) {
      var id = li.dataset.id, box = li.querySelector('input');
      if (saved[id]) { box.checked = true; li.classList.add('done'); }
      box.addEventListener('change', function () {
        li.classList.toggle('done', box.checked);
        saved[id] = box.checked;
        try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { }
      });
    });
  }

  /* ================= 수시 ================= */
  function renderSusi() {
    var h = '';
    h += '<h2 class="sec">수시 지원 현황</h2>';
    h += '<p class="lead">2027학년도 수시는 최대 6회까지 지원할 수 있습니다. 아래 6장이 현재 계획이며, 각 카드의 정보는 해당 대학 수시모집요강 원문에서 그대로 가져왔습니다.</p>';

    h += '<div class="callout">' +
      '<b>지원 조합의 논리</b><br>' +
      '생기부를 <b>쓰는</b> 카드 4장(학종)과 <b>안 쓰는</b> 카드 2장(논술)으로 갈라 두었습니다. ' +
      '1·2학년 생명과학 생기부는 학종에서, 3학년에 바뀐 경영·경제 희망은 논술에서 각각 제 값을 받습니다. ' +
      '수능최저가 없는 카드(경북대·건국대·중앙대 융합형)가 3장 있어, 수능이 흔들려도 완전히 무너지지 않는 구조입니다.' +
      '</div>';

    h += '<div class="grid g2" style="margin-top:16px">' + D.susi.map(uniCard).join('') + '</div>';

    h += '<h2 class="sec">고사·면접 일정 충돌 체크</h2>';
    h += '<div class="card" style="padding:14px 18px"><ul class="tl">' +
      D.keyDates.filter(function (k) { return k.kind === 'test'; }).map(function (k) {
        var n = days(k.date);
        return '<li class="test' + (n < 0 ? ' past' : '') + '">' +
          '<span class="dt">' + esc(k.date.slice(2).replace(/-/g, '.')) + ' ' + fmt(k.date).replace(/^[\d.]+/, '') + '</span>' +
          '<span class="lb">' + esc(k.label) + '</span><span class="dd">' + ddText(n) + '</span></li>';
      }).join('') + '</ul>' +
      '<div class="note" style="padding:4px 0 2px">논술 2개는 11.21(토)·11.22(일)로 하루 차이, 면접 2개는 12.5(토)·12.6(일)로 이틀 연속입니다. 날짜는 겹치지 않지만 체력 배분과 이동 계획이 필요합니다. 경북대 면접일은 모집요강에서 확인하세요.</div>' +
      '</div>';

    h += '<h2 class="sec">모집요강 원문</h2>';
    h += '<p class="lead">각 대학 입학처에서 받아 온 2027학년도 수시모집요강 PDF입니다.</p>';
    h += '<div class="card scroll-x"><table class="tbl"><thead><tr><th>대학</th><th>문서</th><th>입학처</th></tr></thead><tbody>' +
      dedupeDocs().map(function (s) {
        return '<tr><td><b>' + esc(s.univ) + '</b></td>' +
          '<td><a href="' + esc(s.doc) + '" target="_blank" rel="noopener">2027학년도 수시모집요강 (PDF)</a></td>' +
          '<td><a href="' + esc(s.site) + '" target="_blank" rel="noopener">바로가기</a></td></tr>';
      }).join('') + '</tbody></table></div>';

    $('#susi').innerHTML = h;
  }

  function dedupeDocs() {
    var seen = {}, out = [];
    D.susi.forEach(function (s) {
      if (!seen[s.univ]) { seen[s.univ] = 1; out.push(s); }
    });
    return out;
  }

  function uniCard(s) {
    var tr = trackOf(s.track);
    var rows = '';
    rows += kv('전형방법', '<ul>' + (s.methodDetail || [s.method]).map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>');
    rows += kv('모집인원', s.quota ? '<b>' + s.quota + '명</b>' + (s.quotaNote ? '<div class="note">' + esc(s.quotaNote) + '</div>' : '')
      : '<span style="color:var(--text-3)">' + esc(s.quotaNote || '확인 필요') + '</span>');
    rows += kv('수능최저', esc(s.minimum) + (s.minimumNote ? '<div class="note">' + esc(s.minimumNote) + '</div>' : ''));
    rows += kv('원서접수', esc(s.apply));
    if (s.exam) rows += kv('논술고사', '<b>' + esc(s.exam) + '</b>');
    if (s.stage1) rows += kv('1단계 발표', esc(s.stage1));
    if (s.interview) rows += kv('면접', '<b>' + esc(s.interview) + '</b>');
    rows += kv('합격발표', esc(s.announce));
    if (s.fee) rows += kv('전형료', esc(s.fee));

    return '<div class="card uni">' +
      '<div class="head">' +
      '<div class="row1"><span class="pill ' + tr.tone + '">' + esc(tr.label) + '</span>' +
      '<span class="pill grey">' + esc(s.type) + '</span>' +
      '<span class="pill ' + (s.hasMinimum === false ? 'green' : s.hasMinimum === true ? 'red' : 'amber') + '">최저 ' +
      (s.hasMinimum === false ? '없음' : s.hasMinimum === true ? '있음' : '일부') + '</span>' +
      (s.hasInterview ? '<span class="pill amber">면접 ' + (s.hasInterview === 'partial' ? '일부' : '있음') + '</span>' : '') +
      '</div>' +
      '<div class="u">' + esc(s.univ) + '</div>' +
      '<div class="d">' + esc(s.dept) + ' · ' + esc(s.typeName) + '</div>' +
      '</div>' +
      '<div class="body"><dl class="kv">' + rows + '</dl>' +
      '<div class="why"><b>이 카드의 값</b>' + esc(s.why) + '</div>' +
      '<div class="risk"><b>주의할 점</b>' + esc(s.risk) + '</div>' +
      '</div>' +
      '<div class="foot">' +
      '<a class="btn primary" href="' + esc(s.doc) + '" target="_blank" rel="noopener">모집요강 PDF</a>' +
      '<a class="btn" href="' + esc(s.site) + '" target="_blank" rel="noopener">입학처</a>' +
      '</div></div>';
  }

  function kv(k, v) { return '<dt>' + esc(k) + '</dt><dd>' + v + '</dd>'; }

  /* ================= 정시 ================= */
  function renderJeongsi() {
    var n = days('2026-11-19');
    var h = '';
    h += '<h2 class="sec">정시</h2>';
    h += '<p class="lead">정시는 수능 성적이 나온 뒤에야 실질적인 판단이 가능합니다. 지금은 일정과 참고자료만 정리해 두고, 12월 11일 성적 통지 이후에 지원 전략을 채웁니다.</p>';

    h += '<div class="grid g4">' +
      '<div class="card dday exam"><div class="n">' + ddText(n) + '</div><div class="l">2027학년도 수능</div><div class="d">2026.11.19(목)</div></div>' +
      stat('성적 통지', '12.11', '2026년 금요일') +
      stat('원서접수', '1.4 ~ 1.7', '2027년') +
      stat('충원 마감', '2.18', '2027년') +
      '</div>';

    h += '<h2 class="sec">정시 기본 구조</h2>';
    h += '<div class="grid g3">' +
      mini('가군', '고려대 · 연세대 등 대부분의 상위권이 여기에 몰립니다.') +
      mini('나군', '서울대 · 성균관대 등. 가군과 함께 실질적인 승부처입니다.') +
      mini('다군', '모집 인원이 적어 경쟁률과 추가합격 변동이 큽니다.') +
      '</div>';
    h += '<div class="note" style="margin-top:10px">군별로 각 1회씩, 총 3회 지원할 수 있습니다. 수시에 합격하면 등록 여부와 관계없이 정시 지원이 불가능하다는 점을 기억하세요.</div>';

    h += '<h2 class="sec">수능 성적 입력 후 분석</h2>';
    h += '<div class="empty"><div class="big">아직 수능 성적이 없습니다</div>' +
      '수능 성적이 나오면 <code>assets/data.js</code>의 <code>mogi</code> 배열 마지막에 실채점 결과를 추가하세요. 표준점수·백분위가 들어오면 이 자리에 지원 가능선 분석이 표시됩니다.</div>';

    h += '<h2 class="sec">참고 자료</h2>';
    h += '<p class="lead">구글 드라이브 <code>2024혜화여고(김나은)/3학년때 자료</code> 폴더에 이미 받아 둔 자료들입니다.</p>';
    h += '<div class="card scroll-x"><table class="tbl"><thead><tr><th>자료</th><th>출처</th></tr></thead><tbody>' +
      D.jeongsiRefs.map(function (r) {
        return '<tr><td>' + esc(r.label) + '</td><td style="color:var(--text-3)">' + esc(r.note) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    $('#jeongsi').innerHTML = h;
  }

  function mini(t, d) {
    return '<div class="card stat"><div class="v" style="font-size:19px">' + esc(t) + '</div><div class="s" style="margin-top:5px">' + esc(d) + '</div></div>';
  }

  /* ================= 성적 분석 ================= */
  function renderScore() {
    var h = '';
    h += '<h2 class="sec">내신 분석</h2>';

    var sum = D.naesin.summary.filter(function (s) { return s.all != null; });
    if (sum.length) {
      h += '<div class="card" style="padding:18px">' + lineChart(sum) + '</div>';
      h += '<div class="card scroll-x" style="margin-top:14px"><table class="tbl"><thead><tr><th>학기</th><th>전 과목</th><th>국영수사과</th></tr></thead><tbody>' +
        sum.map(function (s) {
          return '<tr><td><b>' + esc(s.term) + '</b></td><td>' + s.all + '</td><td>' + (s.main == null ? '–' : s.main) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      h += '<div class="empty"><div class="big">내신 성적이 아직 비어 있습니다</div>' +
        '<a href="' + esc(D.naesin.source) + '" target="_blank" rel="noopener">어디가 성적분석</a>에서 학기별 평균 등급을 확인한 뒤, ' +
        '<code>assets/data.js</code>의 <code>naesin.summary</code>에 아래처럼 채워 넣으면 추이 그래프가 그려집니다.' +
        '<div style="margin-top:12px;text-align:left;display:inline-block"><code style="display:block;padding:10px 12px;line-height:1.8">' +
        "{ term: '1-1', all: 2.1, main: 1.9 },<br>{ term: '1-2', all: 2.0, main: 1.8 }, …" +
        '</code></div></div>';
    }

    var subs = D.naesin.subjects;
    if (subs.length) {
      h += '<h2 class="sec">3학년 1학기 이수 과목</h2>';
      h += '<p class="lead">노션 <b>3학년 1학기(전과정)</b> 페이지 기준으로 정리했습니다. 등급이 나오면 <code>rank</code> 값만 채우면 됩니다.</p>';
      h += '<div class="card scroll-x"><table class="tbl"><thead><tr><th>교과</th><th>과목</th><th>단위</th><th>석차등급</th></tr></thead><tbody>' +
        subs.map(function (s) {
          return '<tr><td><span class="pill grey">' + esc(s.area) + '</span></td><td>' + esc(s.name) + '</td>' +
            '<td>' + (s.units == null ? '<span style="color:var(--text-3)">–</span>' : s.units) + '</td>' +
            '<td>' + (s.rank == null ? '<span style="color:var(--text-3)">–</span>' : '<b>' + s.rank + '</b>') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      h += '<div class="note">생명과학Ⅱ · 지구과학Ⅱ · 고급생명과학(공동교육과정) · 과학과제연구까지 이수한 구성이라, 생명공학부 지원 3곳의 학업 준비도를 뒷받침하는 근거가 됩니다.</div>';
    }

    h += '<h2 class="sec">모의고사 추이</h2>';
    if (D.mogi.length) {
      h += mogiTable();
    } else {
      h += '<div class="empty"><div class="big">모의고사 성적이 아직 비어 있습니다</div>' +
        '시험이 끝날 때마다 <code>assets/data.js</code>의 <code>mogi</code> 배열에 한 줄씩 추가하세요. 국어·수학·영어·탐구 등급이 들어오면 ' +
        '<b>수능최저 충족 여부</b>가 지원 카드별로 자동 계산되어 표시됩니다.</div>';
    }

    h += '<h2 class="sec">수능최저 기준 요약</h2>';
    h += '<p class="lead">지원 카드 6장 중 4장에 수능최저가 걸려 있습니다. 이 표가 사실상 수능 목표치입니다.</p>';
    h += '<div class="card scroll-x"><table class="tbl"><thead><tr><th>대학 · 전형</th><th>기준</th><th>비고</th></tr></thead><tbody>' +
      D.susi.map(function (s) {
        return '<tr><td><b>' + esc(s.univ.replace('학교', '')) + '</b> ' + esc(s.typeName) + '</td>' +
          '<td>' + (s.hasMinimum === false ? '<span class="pill green">없음</span>' : esc(s.minimum)) + '</td>' +
          '<td style="color:var(--text-3);font-size:12.5px">' + esc(s.minimumNote || '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    h += '<div class="note">가장 빡빡한 기준은 <b>고려대 4개 영역 등급 합 8</b>입니다. 이 하나를 목표로 잡으면 성균관대(3개 합 6)와 중앙대 성장형인재(3개 합 6)는 자연스럽게 따라옵니다.</div>';

    $('#score').innerHTML = h;
  }

  function lineChart(rows) {
    var W = 640, H = 220, P = 38;
    var xs = rows.map(function (_, i) { return P + i * ((W - P * 2) / Math.max(1, rows.length - 1)); });
    // 등급은 낮을수록 좋으므로 y축을 뒤집는다
    var vals = rows.map(function (r) { return r.all; }).concat(rows.map(function (r) { return r.main; }).filter(function (v) { return v != null; }));
    var lo = Math.max(1, Math.floor(Math.min.apply(null, vals) - 0.5));
    var hi = Math.min(9, Math.ceil(Math.max.apply(null, vals) + 0.5));
    var y = function (v) { return P + (v - lo) / (hi - lo) * (H - P * 2); };

    function path(key) {
      return rows.map(function (r, i) {
        return (i ? 'L' : 'M') + xs[i].toFixed(1) + ' ' + y(r[key]).toFixed(1);
      }).join(' ');
    }
    var g = '';
    for (var v = lo; v <= hi; v++) {
      g += '<line x1="' + P + '" y1="' + y(v) + '" x2="' + (W - P) + '" y2="' + y(v) + '" stroke="var(--border)" stroke-width="1"/>' +
        '<text x="' + (P - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="var(--text-3)">' + v + '</text>';
    }
    var lbl = rows.map(function (r, i) {
      return '<text x="' + xs[i] + '" y="' + (H - P + 18) + '" text-anchor="middle" font-size="11" fill="var(--text-3)">' + esc(r.term) + '</text>';
    }).join('');
    var dots = function (key, color) {
      return rows.filter(function (r) { return r[key] != null; }).map(function (r) {
        var i = rows.indexOf(r);
        return '<circle cx="' + xs[i] + '" cy="' + y(r[key]) + '" r="4" fill="' + color + '"/>';
      }).join('');
    };
    var hasMain = rows.some(function (r) { return r.main != null; });

    return '<div class="scroll-x"><svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="min-width:420px;display:block" role="img" aria-label="학기별 내신 등급 추이">' +
      g + lbl +
      '<path d="' + path('all') + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>' +
      dots('all', 'var(--accent)') +
      (hasMain ? '<path d="' + path('main') + '" fill="none" stroke="var(--amber)" stroke-width="2.5" stroke-dasharray="5 4" stroke-linejoin="round"/>' + dots('main', 'var(--amber)') : '') +
      '</svg></div>' +
      '<div style="display:flex;gap:16px;font-size:12.5px;color:var(--text-2);margin-top:8px">' +
      '<span><span style="display:inline-block;width:14px;height:3px;background:var(--accent);vertical-align:middle;margin-right:5px"></span>전 과목</span>' +
      (hasMain ? '<span><span style="display:inline-block;width:14px;height:3px;background:var(--amber);vertical-align:middle;margin-right:5px"></span>국영수사과</span>' : '') +
      '</div>';
  }

  function mogiTable() {
    return '<div class="card scroll-x"><table class="tbl"><thead><tr>' +
      '<th>시험</th><th>국어</th><th>수학</th><th>영어</th><th>한국사</th><th>탐구1</th><th>탐구2</th><th>3개합</th><th>4개합</th>' +
      '</tr></thead><tbody>' +
      D.mogi.map(function (m) {
        var gr = [m.kor && m.kor.gr, m.math && m.math.gr, m.eng && m.eng.gr,
        m.tam1 && m.tam1.gr].filter(function (v) { return v != null; }).sort(function (a, b) { return a - b; });
        var s3 = gr.length >= 3 ? gr.slice(0, 3).reduce(function (a, b) { return a + b; }, 0) : null;
        var s4 = gr.length >= 4 ? gr.slice(0, 4).reduce(function (a, b) { return a + b; }, 0) : null;
        var cell = function (o) { return o && o.gr != null ? o.gr + (o.pct != null ? ' <span style="color:var(--text-3);font-size:12px">(' + o.pct + ')</span>' : '') : '–'; };
        return '<tr><td><b>' + esc(m.name) + '</b></td>' +
          '<td>' + cell(m.kor) + '</td><td>' + cell(m.math) + '</td><td>' + cell(m.eng) + '</td><td>' + cell(m.hist) + '</td>' +
          '<td>' + cell(m.tam1) + '</td><td>' + cell(m.tam2) + '</td>' +
          '<td>' + (s3 == null ? '–' : '<b class="' + (s3 <= 6 ? 'ok' : '') + '">' + s3 + '</b>') + '</td>' +
          '<td>' + (s4 == null ? '–' : '<b>' + s4 + '</b>') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ================= 진로 ================= */
  function renderJinro() {
    var h = '';
    h += '<h2 class="sec">진로 방향</h2>';
    h += '<p class="lead">지금 나은이 앞에는 세 갈래가 놓여 있습니다. 서로 다르다는 것이 문제가 아니라, <b>어느 갈래가 어느 전형에서 값을 갖는지</b>를 아는 것이 중요합니다.</p>';

    h += '<div class="grid g3">' + D.jinro.tracks.map(function (t) {
      return '<div class="card track">' +
        '<h3><span class="pill ' + t.tone + '">' + esc(t.who) + '</span></h3>' +
        '<div style="font-size:18px;font-weight:700;letter-spacing:-.02em;margin:-4px 0 0">' + esc(t.label) + '</div>' +
        '<div class="lbl">' + esc(t.when) + '</div>' +
        '<p>' + esc(t.desc) + '</p>' +
        '<div><div class="lbl" style="margin-bottom:4px">근거</div><ul class="ev">' +
        t.evidence.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>' +
        '<div><div class="lbl" style="margin-bottom:5px">연결되는 지원</div>' +
        t.fits.map(function (f) { return '<span class="pill ' + t.tone + '" style="margin:0 4px 4px 0">' + esc(f) + '</span>'; }).join('') +
        '</div></div>';
    }).join('') + '</div>';

    h += '<div class="callout" style="margin-top:18px">' + esc(D.jinro.note) + '</div>';

    h += '<h2 class="sec">진로 ↔ 전형 정합성</h2>';
    h += '<div class="card scroll-x"><table class="tbl"><thead><tr>' +
      '<th>지원</th><th>진로 갈래</th><th>생기부를 보는가</th><th>정합성</th></tr></thead><tbody>' +
      D.susi.map(function (s) {
        var tr = trackOf(s.track);
        var usesRecord = s.type !== '논술';
        var fit, tone;
        if (s.track === 'bio' && usesRecord) { fit = '높음 — 3년치 생명과학 활동이 그대로 근거'; tone = 'green'; }
        else if (s.track === 'biz' && !usesRecord) { fit = '높음 — 생기부를 보지 않아 진로 변경이 문제되지 않음'; tone = 'green'; }
        else if (s.track === 'nurse' && usesRecord) { fit = '보통 — 생명과학 생기부와 결은 맞으나 간호 특화 활동은 적음'; tone = 'amber'; }
        else { fit = '확인 필요'; tone = 'grey'; }
        return '<tr><td><b>' + esc(s.univ.replace('학교', '')) + '</b> ' + esc(s.dept) + '</td>' +
          '<td><span class="pill ' + tr.tone + '">' + esc(tr.label) + '</span></td>' +
          '<td>' + (usesRecord ? '<span class="pill blue">본다</span>' : '<span class="pill grey">안 본다</span>') + '</td>' +
          '<td><span class="pill ' + tone + '">' + esc(fit) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';

    h += '<div class="note">간호 방향이 "보통"으로 나오는 것은 약점이 아니라 <b>정보</b>입니다. 중앙대 학종 서류에서 생명과학 탐구 경험을 간호의 언어(생명 현상에 대한 이해 → 사람을 돌보는 일)로 연결해 설명하면, 이 칸은 "높음"으로 바뀝니다.</div>';

    $('#jinro').innerHTML = h;
  }

  /* ================= 탭 · 테마 ================= */
  function initTabs() {
    var tabs = document.querySelectorAll('#tabs button');
    function show(name) {
      Array.prototype.forEach.call(tabs, function (b) {
        b.setAttribute('aria-selected', b.dataset.tab === name ? 'true' : 'false');
      });
      ['home', 'susi', 'jeongsi', 'score', 'jinro'].forEach(function (id) {
        document.getElementById(id).hidden = id !== name;
      });
      if (location.hash.slice(1) !== name) history.replaceState(null, '', '#' + name);
      window.scrollTo(0, 0);
    }
    Array.prototype.forEach.call(tabs, function (b) {
      b.addEventListener('click', function () { show(b.dataset.tab); });
    });
    var start = location.hash.slice(1);
    show(['home', 'susi', 'jeongsi', 'score', 'jinro'].indexOf(start) >= 0 ? start : 'home');
  }

  function initTheme() {
    var btn = document.getElementById('themeBtn'), KEY = 'naeun-theme';
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { }
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    function label() {
      var cur = document.documentElement.getAttribute('data-theme');
      var dark = cur === 'dark' || (!cur && window.matchMedia('(prefers-color-scheme: dark)').matches);
      btn.textContent = dark ? '라이트' : '다크';
    }
    label();
    btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var dark = cur === 'dark' || (!cur && window.matchMedia('(prefers-color-scheme: dark)').matches);
      var next = dark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) { }
      label();
    });
  }

  document.getElementById('brandSub').textContent = D.student.admissionYear;
  document.getElementById('footUpdated').textContent =
    D.student.grade + ' ' + D.student.name + ' · 자료 기준일 ' + D.student.updated;

  renderHome(); renderSusi(); renderJeongsi(); renderScore(); renderJinro();
  initTabs(); initTheme();
})();
