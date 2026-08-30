# 나은이 입시 (2027학년도)

혜화여자고등학교 3학년 김나은의 2027학년도 대입 수시·정시 관리 웹앱입니다.

**https://knuekim91.github.io/naeun/**

## 구성

| 탭 | 내용 |
|---|---|
| 대시보드 | D-day, 지원 카드 요약, 전체 일정, 준비 체크리스트 |
| 수시 | 6개 지원 카드(전형방법·수능최저·일정·모집요강), 고사일 충돌 체크 |
| 정시 | 수능 이후 일정, 군별 구조, 참고자료 |
| 성적 분석 | 내신 추이 그래프, 3학년 1학기 이수과목, 모의고사 추이, 수능최저 목표표 |
| 진로 | 세 갈래 진로와 전형 정합성 |

## 성적 입력 방법

`assets/data.js` 한 파일만 고치면 됩니다.

### 내신

[어디가 성적분석](https://www.adiga.kr/sco/sca/schScoAnlsView.do?menuId=PCSCOSCA1000)에서 학기별 평균 등급을 확인한 뒤 `naesin.summary`에 채웁니다.

```js
summary: [
  { term: '1-1', all: 2.4, main: 2.1 },   // all = 전 과목, main = 국영수사과
  { term: '1-2', all: 2.2, main: 2.0 },
]
```

과목별 등급은 `naesin.subjects`의 `units`(단위수)와 `rank`(석차등급)를 채우면 됩니다.

### 모의고사

시험이 끝날 때마다 `mogi` 배열에 한 줄씩 추가합니다. 등급을 넣으면 3개합·4개합이 자동 계산되어 수능최저 충족 여부를 바로 볼 수 있습니다.

```js
mogi: [
  {
    name: '2026 9월 모평', date: '2026-09-02',
    kor:  { std: 130, pct: 91, gr: 2 },
    math: { std: 128, pct: 88, gr: 2 },
    eng:  { gr: 1 },
    hist: { gr: 2 },
    tam1: { name: '생명과학Ⅰ', std: 65, pct: 93, gr: 2 },
    tam2: { name: '지구과학Ⅰ', std: 61, pct: 85, gr: 3 }
  }
]
```

## 모집요강 원문

`susi/docs/` 에 각 대학 입학처에서 받은 2027학년도 수시모집요강 PDF가 들어 있습니다.

| 파일 | 대학 | 출처 |
|---|---|---|
| `korea_2027_susi.pdf` | 고려대학교 | [입학처](https://oku.korea.ac.kr/) |
| `skku_2027_susi.pdf` | 성균관대학교 | [입학처](https://admission.skku.edu/) |
| `knu_2027_susi.pdf` | 경북대학교 | [입학처](https://ipsi1.knu.ac.kr/) |
| `konkuk_2027_susi.pdf` | 건국대학교 | [입학처](https://enter.konkuk.ac.kr/) |
| `cau_2027_susi.pdf` | 중앙대학교 | [입학처](https://admission.cau.ac.kr/) |

> 요강은 대교협 심의 등으로 변경될 수 있습니다. 원서접수 전 각 대학 입학처 공지사항을 반드시 확인하세요.

## 로컬에서 보기

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000` 을 엽니다.
