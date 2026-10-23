# Science Lab Hub — 과학 인터랙티브 수업 플랫폼

중·고등학교 과학 수업에서 활용할 수 있는 개별 과학 탐구 웹 앱들을 하나로 연결하는 플랫폼입니다.  
별도의 서버 설치나 빌드 과정 없이, GitHub Pages를 통해 즉시 정적 웹사이트로 배포할 수 있도록 순수 HTML, CSS, JavaScript로 제작되었습니다.

---

## 📁 프로젝트 폴더 구조

```text
test/
├── index.html                   # 메인 로비 (수업 목록, 필터링, 검색)
├── README.md                    # 프로젝트 문서 및 확장 가이드
├── assets/                      # 플랫폼 공통 리소스
│   ├── css/
│   │   ├── variables.css        # 컬러, 폰트, 반응형 디자인 시스템 토큰
│   │   ├── navbar.css           # 모든 실험 페이지에 공통 적용되는 상단 내비게이션 스타일
│   │   ├── hub-portal.css       # 메인 로비 전용 카드 그리드 및 필터 스타일
│   │   └── lab-template.css     # 개별 실험 안내 및 템플릿용 스타일
│   └── js/
│       ├── labs-data.js         # 전체 과학 탐구 수업 데이터베이스 (새 실험 등록)
│       └── nav-component.js     # 이전/다음 수업 및 홈 버튼을 자동 렌더링하는 컴포넌트
└── labs/                        # 개별 과학 탐구 수업 폴더 (독립적 구성)
    ├── periodic-table/
    │   └── index.html           # LAB 01. 주기율표 탐구
    ├── gas-laws/
    │   └── index.html           # LAB 02. 기체 법칙 탐구
    └── wave-interference/
        └── index.html           # LAB 03. 파동의 중첩과 간섭
```

---

## 🚀 새로운 탐구 실험 추가 방법 (바이브 코딩 가이드)

새로운 실험을 추가할 때는 기존 코드를 건드릴 필요 없이 다음 **2가지 단계**만 거치면 자동으로 메인 포털과 내비게이션에 반영됩니다.

### 1단계: `labs` 폴더에 새 폴더와 `index.html` 생성
`labs/새실험ID/index.html`을 생성합니다. 기본 골격은 아래와 같습니다:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>새로운 실험 이름 — Science Lab Hub</title>
  <link rel="stylesheet" href="../../assets/css/variables.css">
  <link rel="stylesheet" href="../../assets/css/navbar.css">
  <link rel="stylesheet" href="../../assets/css/lab-template.css">
</head>
<body data-lab-id="새실험ID">
  <!-- 공통 상단 내비게이션이 자동으로 들어가는 자리 -->
  <div id="lab-hub-nav-container"></div>

  <main>
    <!-- 여기에 독립적인 시뮬레이션 및 인터랙션 코드 작성 -->
  </main>

  <!-- 공통 스크립트 연결 -->
  <script src="../../assets/js/labs-data.js"></script>
  <script src="../../assets/js/nav-component.js"></script>
</body>
</html>
```

### 2단계: `assets/js/labs-data.js`에 새 수업 등록
`LABS_DATA` 배열에 새 실험 정보를 한 줄 추가합니다:

```javascript
{
  id: "새실험ID", // body 태그의 data-lab-id와 일치해야 함
  number: "LAB 04",
  title: "빛의 굴절과 전반사",
  description: "스넬의 법칙과 임계각을 실험적으로 측정해 봅니다.",
  icon: "🌈",
  grade: "중2·고2",
  subject: "물리",
  unit: "빛과 파동",
  tags: ["굴절률", "스넬의법칙", "전반사", "광통신"],
  path: "labs/새실험ID/index.html"
}
```

등록 즉시 메인 로비에 카드와 필터링이 자동 적용되며, 이전/다음 수업 이동 링크가 순서대로 자동 계산됩니다.

---

## 🌐 로컬 실행 및 확인 방법

1. 브라우저(크롬, 엣지, 사파리 등)에서 메인 페이지인 `index.html`을 더블 클릭하여 바로 열 수 있습니다.
2. 로컬 웹 서버를 사용하려면 VS Code의 **Live Server** 확장 프로그램을 이용하거나 아래 명령어로 확인하실 수 있습니다:
   ```bash
   # npx serve 사용 시
   npx serve .
   ```
   이후 브라우저에서 `http://localhost:3000` (또는 표시되는 로컬 주소)로 접속하시면 됩니다.

---

## 📦 GitHub Pages 배포 안내
- 모든 파일 및 링크가 **상대 경로(`../../`, `./`)** 로 작성되어 있어 GitHub Pages의 서브 도메인(예: `https://아이디.github.io/저장소이름/`)에서도 경로 깨짐 없이 완벽하게 동작합니다.
