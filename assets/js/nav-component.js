/**
 * Science Lab Hub - 공통 내비게이션 렌더러
 * 각 실험 페이지에서 호출하여 상단 내비게이션을 자동으로 주입합니다.
 */
function initLabNavigation(currentLabId) {
  const container = document.getElementById("lab-hub-nav-container");
  if (!container || !window.LABS_DATA) return;

  const labs = window.LABS_DATA;
  const currentIndex = labs.findIndex(lab => lab.id === currentLabId);
  const currentLab = labs[currentIndex];

  const prevLab = currentIndex > 0 ? labs[currentIndex - 1] : null;
  const nextLab = currentIndex < labs.length - 1 ? labs[currentIndex + 1] : null;

  // labs 폴더 내부에서 루트(index.html)로 가는 상대 경로: ../../index.html
  const homePath = "../../index.html";

  // 이전/다음 수업 상대 경로 계산
  const prevPath = prevLab ? `../${prevLab.id}/index.html` : "#";
  const nextPath = nextLab ? `../${nextLab.id}/index.html` : "#";

  const navHtml = `
    <header class="lab-hub-nav">
      <div class="lab-hub-nav-left">
        <a href="${homePath}" class="lab-hub-logo" title="Science Lab Hub 메인으로">
          <div class="lab-hub-logo-icon">🔬</div>
          <span class="lab-hub-logo-text">Science Lab Hub</span>
        </a>
        <a href="${homePath}" class="lab-hub-back-btn">
          <span>←</span> 전체 수업 목록
        </a>
      </div>

      <div class="lab-hub-nav-center">
        ${currentLab ? `
          <span class="lab-hub-nav-badge">${currentLab.number}</span>
          <span class="lab-hub-nav-title">${currentLab.title}</span>
        ` : ''}
      </div>

      <div class="lab-hub-nav-right">
        <a href="${prevPath}" class="lab-hub-nav-link ${!prevLab ? 'disabled' : ''}" title="${prevLab ? prevLab.title : '이전 수업 없음'}">
          <span>←</span> 이전 수업
        </a>
        <a href="${nextPath}" class="lab-hub-nav-link ${!nextLab ? 'disabled' : ''}" title="${nextLab ? nextLab.title : '다음 수업 없음'}">
          다음 수업 <span>→</span>
        </a>
      </div>
    </header>
  `;

  container.innerHTML = navHtml;
}

// 문서 로드 완료 시 자동 실행 대기
document.addEventListener("DOMContentLoaded", () => {
  // body 태그의 data-lab-id 속성값을 읽어서 자동 렌더링
  const labId = document.body.getAttribute("data-lab-id");
  if (labId) {
    initLabNavigation(labId);
  }
});
