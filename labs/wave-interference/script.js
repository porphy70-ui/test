/**
 * 파동의 중첩과 간섭 시뮬레이터 - Canvas 물리 엔진 및 인터랙션
 * 지원 모드:
 * ① 파동의 기본 성질 (단일 파동, v = f * λ, 매질 한 점의 단진동)
 * ② 파동의 중첩 (파동 1 + 파동 2 = 합성파 y = y1 + y2, 진행 방향 선택, 위상 변화)
 * ③ 파동의 간섭 (2D 2개 점파원 수면파 간섭, 경로차 계산, 보강·상쇄 조건 판정)
 */

document.addEventListener("DOMContentLoaded", () => {
  let currentMode = "superposition"; // 'basic' | 'superposition' | 'interference'
  let isRunning = true;
  let animSpeed = 1.0; // 1.0 (정상) | 0.3 (느리게)
  let time = 0;

  // Canvas
  const canvas = document.getElementById("waveCanvas");
  const ctx = canvas.getContext("2d");

  // 파동 변수들
  // 모드 1 & 2용 파동 1
  let a1 = 25;       // 진폭 1 (px)
  let lambda1 = 120; // 파장 1 (px)
  let freq1 = 1.0;   // 진동수 1 (Hz)
  let phase1 = 0;    // 위상 1 (rad)
  let dir1 = 1;      // 진행 방향 (1: 오른쪽, -1: 왼쪽)

  // 모드 2용 파동 2
  let a2 = 25;       // 진폭 2
  let lambda2 = 120; // 파장 2
  let freq2 = 1.0;   // 진동수 2
  let phase2 = 0;    // 위상 2
  let dir2 = -1;     // 진행 방향 (-1: 반대 방향에서 마주봄, 1: 같은 방향)

  // 모드 3용 2D 점파원 간섭 변수
  let sourceDist = 140; // 두 파원 사이 간격 (px)
  let rippleWavelength = 35; // 수면파 파장 (px)
  let ripplePhaseDiff = 0;   // 두 파원의 위상차 (0: 동위상, Math.PI: 역위상)

  // 모드 3 클릭 지점 분석 데이터
  let selectedPoint = { x: 300, y: 190, active: true };

  // DOM 캐싱
  const tabButtons = document.querySelectorAll(".wave-tab-btn");
  const formulaDesc = document.getElementById("formula-desc");

  // 컨트롤러 그룹 DOM
  const basicControls = document.getElementById("controls-basic");
  const superControls = document.getElementById("controls-superposition");
  const interControls = document.getElementById("controls-interference");

  // 버튼
  const btnPlay = document.getElementById("btn-play");
  const btnSlow = document.getElementById("btn-slow");
  const btnReset = document.getElementById("btn-reset");

  // 계측기 표시 엘리먼트
  const metric1Val = document.getElementById("metric-1-val");
  const metric1Label = document.getElementById("metric-1-label");
  const metric2Val = document.getElementById("metric-2-val");
  const metric2Label = document.getElementById("metric-2-label");
  const metric3Val = document.getElementById("metric-3-val");
  const metric3Label = document.getElementById("metric-3-label");

  // 1. 모드 전환
  function setMode(mode) {
    currentMode = mode;
    tabButtons.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-mode") === mode);
    });

    basicControls.style.display = mode === "basic" ? "flex" : "none";
    superControls.style.display = mode === "superposition" ? "flex" : "none";
    interControls.style.display = mode === "interference" ? "flex" : "none";

    if (mode === "basic") {
      formulaDesc.innerHTML = "<span>속력 v = f · λ</span> | <span>주기 T = 1/f</span> (파동은 진행하지만 매질은 제자리에서 단진동합니다)";
      metric1Label.textContent = "파동 속력 (v)";
      metric2Label.textContent = "파장 (λ)";
      metric3Label.textContent = "진동수 (f)";
    } else if (mode === "superposition") {
      formulaDesc.innerHTML = "<span>중첩 원리: y = y₁ + y₂</span> (두 파동이 만나면 변위가 합쳐지고, 통과 후 본래 모습을 유지합니다)";
      metric1Label.textContent = "파동 1 진폭 (A₁)";
      metric2Label.textContent = "파동 2 진폭 (A₂)";
      metric3Label.textContent = "최대 합성 진폭";
    } else {
      formulaDesc.innerHTML = "<span>경로차 |d₁ - d₂| = m·λ (보강)</span> | <span>|d₁ - d₂| = (m + 1/2)·λ (상쇄)</span>";
      metric1Label.textContent = "파원 간격 (d)";
      metric2Label.textContent = "수면파 파장 (λ)";
      metric3Label.textContent = "파원 위상차 (Δφ)";
    }

    updateMetrics();
  }

  // 2. 수치 계측기 업데이트
  function updateMetrics() {
    if (currentMode === "basic") {
      const v = (freq1 * lambda1).toFixed(1);
      metric1Val.textContent = `${v} px/s`;
      metric2Val.textContent = `${lambda1} px`;
      metric3Val.textContent = `${freq1.toFixed(1)} Hz`;
    } else if (currentMode === "superposition") {
      metric1Val.textContent = `${a1} px`;
      metric2Val.textContent = `${a2} px`;
      metric3Val.textContent = `${a1 + a2} px`;
    } else {
      metric1Val.textContent = `${sourceDist} px`;
      metric2Val.textContent = `${rippleWavelength} px`;
      metric3Val.textContent = ripplePhaseDiff === 0 ? "0 (동위상)" : "π (반대위상)";
    }
  }

  // 3. 슬라이더 이벤트 연결
  // 모드 1
  document.getElementById("slider-basic-amp")?.addEventListener("input", (e) => {
    a1 = parseFloat(e.target.value);
    document.getElementById("val-basic-amp").textContent = `${a1} px`;
    updateMetrics();
  });
  document.getElementById("slider-basic-freq")?.addEventListener("input", (e) => {
    freq1 = parseFloat(e.target.value);
    document.getElementById("val-basic-freq").textContent = `${freq1.toFixed(1)} Hz`;
    updateMetrics();
  });
  document.getElementById("slider-basic-lambda")?.addEventListener("input", (e) => {
    lambda1 = parseFloat(e.target.value);
    document.getElementById("val-basic-lambda").textContent = `${lambda1} px`;
    updateMetrics();
  });

  // 모드 2
  document.getElementById("slider-s-amp1")?.addEventListener("input", (e) => {
    a1 = parseFloat(e.target.value);
    document.getElementById("val-s-amp1").textContent = `${a1} px`;
    updateMetrics();
  });
  document.getElementById("slider-s-amp2")?.addEventListener("input", (e) => {
    a2 = parseFloat(e.target.value);
    document.getElementById("val-s-amp2").textContent = `${a2} px`;
    updateMetrics();
  });
  document.getElementById("slider-s-phase2")?.addEventListener("input", (e) => {
    const deg = parseInt(e.target.value, 10);
    phase2 = (deg * Math.PI) / 180;
    document.getElementById("val-s-phase2").textContent = `${deg}°`;
  });
  document.getElementById("select-dir")?.addEventListener("change", (e) => {
    dir2 = parseInt(e.target.value, 10);
  });

  // 모드 3
  document.getElementById("slider-inter-dist")?.addEventListener("input", (e) => {
    sourceDist = parseFloat(e.target.value);
    document.getElementById("val-inter-dist").textContent = `${sourceDist} px`;
    updateMetrics();
    updateInterferencePointInfo();
  });
  document.getElementById("slider-inter-lambda")?.addEventListener("input", (e) => {
    rippleWavelength = parseFloat(e.target.value);
    document.getElementById("val-inter-lambda").textContent = `${rippleWavelength} px`;
    updateMetrics();
    updateInterferencePointInfo();
  });
  document.getElementById("select-inter-phase")?.addEventListener("change", (e) => {
    ripplePhaseDiff = parseFloat(e.target.value);
    updateMetrics();
    updateInterferencePointInfo();
  });

  // 캔버스 클릭 이벤트 (모드 3 경로차 분석)
  canvas.addEventListener("click", (e) => {
    if (currentMode !== "interference") return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    selectedPoint.x = (e.clientX - rect.left) * scaleX;
    selectedPoint.y = (e.clientY - rect.top) * scaleY;
    selectedPoint.active = true;
    updateInterferencePointInfo();
  });

  // 점파원 좌표 계산
  function getSourcePoints() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    return {
      s1: { x: cx - sourceDist / 2, y: cy },
      s2: { x: cx + sourceDist / 2, y: cy }
    };
  }

  // 클릭 지점 경로차 및 간섭 조건 분석
  function updateInterferencePointInfo() {
    if (!selectedPoint.active) return;
    const { s1, s2 } = getSourcePoints();

    const d1 = Math.hypot(selectedPoint.x - s1.x, selectedPoint.y - s1.y);
    const d2 = Math.hypot(selectedPoint.x - s2.x, selectedPoint.y - s2.y);
    const delta = Math.abs(d1 - d2);
    const ratio = delta / rippleWavelength;

    document.getElementById("point-d1").textContent = `${d1.toFixed(1)} px`;
    document.getElementById("point-d2").textContent = `${d2.toFixed(1)} px`;
    document.getElementById("point-delta").textContent = `${delta.toFixed(1)} px (${ratio.toFixed(2)} λ)`;

    const conditionElem = document.getElementById("point-condition");

    // 동위상(0)일 때: 정수배 = 보강, 반정수배 = 상쇄
    // 역위상(π)일 때: 정수배 = 상쇄, 반정수배 = 보강
    const remainder = Math.abs(ratio - Math.round(ratio));
    const isInteger = remainder < 0.18;
    const isHalf = Math.abs(ratio - (Math.floor(ratio) + 0.5)) < 0.18;

    if (ripplePhaseDiff === 0) {
      if (isInteger) {
        conditionElem.innerHTML = `<span style="color: #2563eb; font-weight: 800;">⚡ 보강 간섭 (마루+마루 / 골+골)</span>`;
      } else if (isHalf) {
        conditionElem.innerHTML = `<span style="color: #dc2626; font-weight: 800;">❌ 상쇄 간섭 (마루+골 상쇄)</span>`;
      } else {
        conditionElem.innerHTML = `<span style="color: #64748b;">중간 간섭 상태</span>`;
      }
    } else {
      if (isInteger) {
        conditionElem.innerHTML = `<span style="color: #dc2626; font-weight: 800;">❌ 상쇄 간섭 (역위상 파원)</span>`;
      } else if (isHalf) {
        conditionElem.innerHTML = `<span style="color: #2563eb; font-weight: 800;">⚡ 보강 간섭 (역위상 파원)</span>`;
      } else {
        conditionElem.innerHTML = `<span style="color: #64748b;">중간 간섭 상태</span>`;
      }
    }
  }

  // 4. 애니메이션 컨트롤
  btnPlay.addEventListener("click", () => {
    isRunning = !isRunning;
    btnPlay.innerHTML = isRunning ? "<span>⏸️</span> 일시 정지" : "<span>▶️</span> 재생";
  });

  btnSlow.addEventListener("click", () => {
    if (animSpeed === 1.0) {
      animSpeed = 0.25;
      btnSlow.classList.add("active");
      btnSlow.textContent = "0.25x (슬로우 모션)";
    } else {
      animSpeed = 1.0;
      btnSlow.classList.remove("active");
      btnSlow.textContent = "느리게 재생 (0.25x)";
    }
  });

  btnReset.addEventListener("click", () => {
    time = 0;
  });

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      setMode(btn.getAttribute("data-mode"));
    });
  });

  // 5. Canvas 렌더링 루프
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentMode === "basic") {
      drawBasicWave();
    } else if (currentMode === "superposition") {
      drawSuperpositionWave();
    } else if (currentMode === "interference") {
      drawInterferenceRipples();
    }

    if (isRunning) {
      time += 0.04 * animSpeed;
    }

    requestAnimationFrame(render);
  }

  // (1) 모드 1: 파동의 기본 성질
  function drawBasicWave() {
    const centerY = canvas.height / 2;
    const k = (2 * Math.PI) / lambda1;
    const omega = 2 * Math.PI * freq1;

    // 중심 기준선
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 파동 진행 곡선 (푸른색)
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = centerY - a1 * Math.sin(k * x - omega * time);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 파동 진행 방향 화살표
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("파동 진행 방향 ➔", canvas.width - 150, 40);

    // 관찰 지점(매질의 한 점: x = 240px)의 상하 단진동 시각화
    const probeX = 240;
    const probeY = centerY - a1 * Math.sin(k * probeX - omega * time);

    // 매질 진동 궤적 가이드 세로선
    ctx.strokeStyle = "rgba(244, 63, 94, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(probeX, centerY - a1 - 15);
    ctx.lineTo(probeX, centerY + a1 + 15);
    ctx.stroke();
    ctx.setLineDash([]);

    // 매질 입자 (붉은 점)
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.arc(probeX, probeY, 7, 0, Math.PI * 2);
    ctx.fill();

    // 매질 진동 설명 라벨
    ctx.fillStyle = "#fda4af";
    ctx.fillText("매질 입자 (제자리 상하 진동 ↕)", probeX - 80, probeY - 14);
  }

  // (2) 모드 2: 파동의 중첩과 합성파
  function drawSuperpositionWave() {
    const centerY = canvas.height / 2;
    const k1 = (2 * Math.PI) / lambda1;
    const omega1 = 2 * Math.PI * freq1;

    const k2 = (2 * Math.PI) / lambda2;
    const omega2 = 2 * Math.PI * freq2;

    // 중심선
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    // 파동 1 (푸른색 점선/가는선)
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = centerY - a1 * Math.sin(k1 * x - dir1 * omega1 * time);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 파동 2 (보라색 가는선)
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = centerY - a2 * Math.sin(k2 * x - dir2 * omega2 * time + phase2);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 합성파 (두 파동의 변위 합 y = y1 + y2, 흰색 굵은 실선)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y1 = a1 * Math.sin(k1 * x - dir1 * omega1 * time);
      const y2 = a2 * Math.sin(k2 * x - dir2 * omega2 * time + phase2);
      const yTotal = centerY - (y1 + y2);
      if (x === 0) ctx.moveTo(x, yTotal);
      else ctx.lineTo(x, yTotal);
    }
    ctx.stroke();

    // 중앙 관찰 지점(x = 340)에서 변위 막대 시각화
    const obsX = 340;
    const val1 = a1 * Math.sin(k1 * obsX - dir1 * omega1 * time);
    const val2 = a2 * Math.sin(k2 * obsX - dir2 * omega2 * time + phase2);
    const totalVal = val1 + val2;

    // 합성파 현재 지점 점
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(obsX, centerY - totalVal, 5, 0, Math.PI * 2);
    ctx.fill();

    // 실시간 간섭 상태 라벨
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.fillText(`중심 지점 합성 변위: ${(totalVal).toFixed(1)} px`, 20, 30);
  }

  // (3) 모드 3: 2D 수면파 간섭 시뮬레이션
  function drawInterferenceRipples() {
    const { s1, s2 } = getSourcePoints();
    const k = (2 * Math.PI) / rippleWavelength;
    const omega = 2 * Math.PI * 1.2;

    // ImageData 픽셀 직접 조작으로 고속 2D 수면파 렌더링
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    // 성능을 위해 3픽셀 간격 샘플링 렌더링
    const step = 2;
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const d1 = Math.hypot(x - s1.x, y - s1.y);
        const d2 = Math.hypot(x - s2.x, y - s2.y);

        // 파원 1 파동: sin(k*d1 - omega*t)
        // 파원 2 파동: sin(k*d2 - omega*t + ripplePhaseDiff)
        const wave1 = Math.sin(k * d1 - omega * time);
        const wave2 = Math.sin(k * d2 - omega * time + ripplePhaseDiff);
        const sum = wave1 + wave2; // -2.0 ~ +2.0

        // 색상 맵핑: 보강 간섭(마루: 밝은 하늘색, 골: 진한 파랑), 상쇄 간섭(평탄: 짙은 남색)
        let r = 15, g = 23, b = 42; // 기본 배경 (#0f172a)

        if (sum > 0) {
          // 마루 보강 (밝은 청백색)
          const intensity = sum / 2; // 0 ~ 1
          r = Math.floor(15 + intensity * 60);
          g = Math.floor(23 + intensity * 170);
          b = Math.floor(42 + intensity * 210);
        } else {
          // 골 보강 (보라/어두운 톤)
          const intensity = Math.abs(sum) / 2;
          r = Math.floor(15 + intensity * 40);
          g = Math.floor(23 + intensity * 50);
          b = Math.floor(42 + intensity * 130);
        }

        // 블록 채우기
        for (let dy = 0; dy < step; dy++) {
          for (let dx = 0; dx < step; dx++) {
            if (x + dx < canvas.width && y + dy < canvas.height) {
              const idx = ((y + dy) * canvas.width + (x + dx)) * 4;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = 255;
            }
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 파원 S1, S2 표시
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.arc(s1.x, s1.y, 6, 0, Math.PI * 2);
    ctx.arc(s2.x, s2.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("파원 S₁", s1.x - 20, s1.y - 12);
    ctx.fillText("파원 S₂", s2.x - 20, s2.y - 12);

    // 선택된 측정 지점 표시 및 거리 선
    if (selectedPoint.active) {
      // S1 -> 점
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(selectedPoint.x, selectedPoint.y);
      ctx.stroke();

      // S2 -> 점
      ctx.strokeStyle = "#c084fc";
      ctx.beginPath();
      ctx.moveTo(s2.x, s2.y);
      ctx.lineTo(selectedPoint.x, selectedPoint.y);
      ctx.stroke();

      // 측정 지점 십자선 마커
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(selectedPoint.x, selectedPoint.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fbbf24";
      ctx.fillText("측정점 P (클릭하여 이동)", selectedPoint.x + 10, selectedPoint.y - 10);
    }
  }

  // 초기화
  setMode("superposition");
  updateInterferencePointInfo();
  requestAnimationFrame(render);
});
