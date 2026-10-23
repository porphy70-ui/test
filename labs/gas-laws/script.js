/**
 * 기체 법칙 가상 실험실 - 물리 시뮬레이션 및 상호작용 로직
 * 지원 법칙: 보일 법칙 (P-V), 샤를 법칙 (V-T), 보일·샤를 법칙 (PV/T = 일정)
 */

document.addEventListener("DOMContentLoaded", () => {
  // 모드 상태: 'boyle' | 'charles' | 'combined'
  let currentLaw = "boyle";

  // 기본 상태 변수
  // 기준점: P0 = 1.0 atm, T0 = 300 K (27℃), V0 = 10.0 L
  let pressure = 1.0;   // atm (0.5 ~ 3.0)
  let tempC = 27;       // ℃ (-50 ~ 200)
  let volume = 10.0;    // L (계산값)

  // Canvas 관련
  const canvas = document.getElementById("gasCanvas");
  const ctx = canvas.getContext("2d");

  // 입자(기체 분자) 시스템: 45개의 이상 기체 분자
  const PARTICLE_COUNT = 45;
  const particles = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: 100 + Math.random() * 200,
      y: 120 + Math.random() * 150,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: 4.5,
      color: i % 2 === 0 ? "#38bdf8" : "#f43f5e"
    });
  }

  // DOM 엘리먼트 캐싱
  const tabButtons = document.querySelectorAll(".law-tab-btn");
  const pressureSlider = document.getElementById("slider-pressure");
  const tempSlider = document.getElementById("slider-temp");
  const pressureValText = document.getElementById("val-pressure");
  const tempValText = document.getElementById("val-temp");
  const gaugePressure = document.getElementById("gauge-pressure");
  const gaugeTemp = document.getElementById("gauge-temp");
  const gaugeVolume = document.getElementById("gauge-volume");

  const pressureControlGroup = document.getElementById("control-group-pressure");
  const tempControlGroup = document.getElementById("control-group-temp");

  const varControlledText = document.getElementById("var-controlled");
  const varIndependentText = document.getElementById("var-independent");
  const varDependentText = document.getElementById("var-dependent");

  const btnRecord = document.getElementById("btn-record");
  const btnReset = document.getElementById("btn-reset");
  const dataTableBody = document.querySelector("#data-table tbody");

  // Chart.js 인스턴스
  let chart = null;
  const recordedData = [];

  // 1. Chart.js 초기화 함수
  function initChart() {
    const chartCtx = document.getElementById("gasChart").getContext("2d");

    let xLabel = "압력 P (atm)";
    let yLabel = "부피 V (L)";
    if (currentLaw === "charles") {
      xLabel = "절대온도 T (K)";
      yLabel = "부피 V (L)";
    } else if (currentLaw === "combined") {
      xLabel = "상태 번호 (#)";
      yLabel = "상태값";
    }

    if (chart) {
      chart.destroy();
    }

    chart = new Chart(chartCtx, {
      type: "scatter",
      data: {
        datasets: [{
          label: "실험 측정점",
          data: [],
          backgroundColor: "#2563eb",
          borderColor: "#2563eb",
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: true,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: xLabel, font: { weight: "bold" } },
            grid: { color: "#e2e8f0" }
          },
          y: {
            title: { display: true, text: yLabel, font: { weight: "bold" } },
            grid: { color: "#e2e8f0" },
            beginAtZero: true
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `X: ${context.parsed.x.toFixed(2)}, Y: ${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        }
      }
    });
  }

  // 2. 물리적 상태 계산 (이상 기체 상태 방정식 V = (n*R*T)/P 비례)
  // V = 10.0 * (T_kelvin / 300) / P
  function updateState() {
    const kelvin = tempC + 273.15;

    if (currentLaw === "boyle") {
      // T = 300K 고정 (27℃)
      volume = (1.0 * 10.0) / pressure;
    } else if (currentLaw === "charles") {
      // P = 1.0 atm 고정
      volume = (10.0 * (kelvin / 300.15));
    } else {
      // 보일·샤를 (P, T 동시 조작)
      volume = (10.0 * (kelvin / 300.15)) / pressure;
    }

    // 소수점 2자리 반올림
    volume = Math.max(2.5, Math.min(25.0, volume)); // 실린더 시각화 한계 고려

    // 계측기 및 라벨 업데이트
    gaugePressure.textContent = `${pressure.toFixed(2)} atm`;
    gaugeTemp.textContent = `${tempC} ℃ (${kelvin.toFixed(1)} K)`;
    gaugeVolume.textContent = `${volume.toFixed(2)} L`;

    pressureValText.textContent = `${pressure.toFixed(2)} atm`;
    tempValText.textContent = `${tempC} ℃ (${kelvin.toFixed(1)} K)`;
  }

  // 3. 탐구 모드(탭) 변경
  function setLawMode(mode) {
    currentLaw = mode;

    tabButtons.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-mode") === mode);
    });

    // 슬라이더 및 변인 표시 설정
    if (mode === "boyle") {
      pressureControlGroup.style.display = "flex";
      tempControlGroup.style.display = "none";
      varControlledText.textContent = "온도 T (27℃ / 300.15 K), 기체 입자 수";
      varIndependentText.textContent = "압력 P (atm)";
      varDependentText.textContent = "기체 부피 V (L)";
      tempC = 27;
      pressure = 1.0;
      pressureSlider.value = 1.0;
    } else if (mode === "charles") {
      pressureControlGroup.style.display = "none";
      tempControlGroup.style.display = "flex";
      varControlledText.textContent = "압력 P (1.00 atm), 기체 입자 수";
      varIndependentText.textContent = "온도 T (℃, K)";
      varDependentText.textContent = "기체 부피 V (L)";
      pressure = 1.0;
      tempC = 27;
      tempSlider.value = 27;
    } else {
      pressureControlGroup.style.display = "flex";
      tempControlGroup.style.display = "flex";
      varControlledText.textContent = "기체 입자 수 (몰 수 n)";
      varIndependentText.textContent = "압력 P, 온도 T";
      varDependentText.textContent = "기체 부피 V (L)";
      pressure = 1.0;
      tempC = 27;
      pressureSlider.value = 1.0;
      tempSlider.value = 27;
    }

    // 데이터 및 그래프 리셋
    resetExperimentData();
    updateState();
    initChart();
  }

  // 4. 슬라이더 이벤트 리스너
  pressureSlider.addEventListener("input", (e) => {
    pressure = parseFloat(e.target.value);
    updateState();
  });

  tempSlider.addEventListener("input", (e) => {
    tempC = parseInt(e.target.value, 10);
    updateState();
  });

  // 5. 데이터 기록 및 테이블/그래프 추가
  function recordDataPoint() {
    const kelvin = (tempC + 273.15).toFixed(1);
    const pVal = pressure.toFixed(2);
    const vVal = volume.toFixed(2);
    const pvVal = (pressure * volume).toFixed(2);

    const record = {
      id: recordedData.length + 1,
      pressure: parseFloat(pVal),
      tempC: tempC,
      kelvin: parseFloat(kelvin),
      volume: parseFloat(vVal),
      pv: parseFloat(pvVal)
    };

    recordedData.push(record);

    // 테이블 행 추가
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>#${record.id}</strong></td>
      <td>${record.pressure} atm</td>
      <td>${record.tempC}℃ (${record.kelvin}K)</td>
      <td><span style="color: #2563eb; font-weight:700;">${record.volume} L</span></td>
      <td>${record.pv}</td>
    `;
    dataTableBody.prepend(tr);

    // Chart 데이터 갱신
    let chartX = record.pressure;
    let chartY = record.volume;

    if (currentLaw === "charles") {
      chartX = record.kelvin;
      chartY = record.volume;
    } else if (currentLaw === "combined") {
      chartX = record.id;
      chartY = record.volume;
    }

    chart.data.datasets[0].data.push({ x: chartX, y: chartY });
    // 정렬 (X축 기준 부드러운 연결선)
    chart.data.datasets[0].data.sort((a, b) => a.x - b.x);
    chart.update();
  }

  function resetExperimentData() {
    recordedData.length = 0;
    dataTableBody.innerHTML = "";
    if (chart) {
      chart.data.datasets[0].data = [];
      chart.update();
    }
  }

  btnRecord.addEventListener("click", recordDataPoint);
  btnReset.addEventListener("click", resetExperimentData);

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      setLawMode(btn.getAttribute("data-mode"));
    });
  });

  // 6. Canvas 실린더 & 기체 입자 애니메이션 루프
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 실린더 규격 설정 (중앙 배치)
    const cylinderX = 140;
    const cylinderWidth = 320;
    const cylinderBottomY = 300;
    const cylinderMaxHeight = 220; // 최대 실린더 높이

    // 부피(2.5L ~ 25L)에 따른 피스톤 높이 매핑
    // 부피 2.5L -> 높이 40px, 부피 25L -> 높이 210px
    const pistonHeightFromBottom = 35 + ((volume - 2.5) / 22.5) * 175;
    const pistonTopY = cylinderBottomY - pistonHeightFromBottom;

    // (1) 실린더 외벽 그리기
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    // 왼쪽 벽
    ctx.moveTo(cylinderX, 50);
    ctx.lineTo(cylinderX, cylinderBottomY);
    // 바닥
    ctx.lineTo(cylinderX + cylinderWidth, cylinderBottomY);
    // 오른쪽 벽
    ctx.lineTo(cylinderX + cylinderWidth, 50);
    ctx.stroke();

    // 부피 눈금자 가이드
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1;
    for (let h = 60; h < cylinderBottomY; h += 35) {
      ctx.beginPath();
      ctx.moveTo(cylinderX, h);
      ctx.lineTo(cylinderX + 15, h);
      ctx.stroke();
    }

    // (2) 피스톤 헤드 및 핸들 그리기
    // 피스톤 헤드
    ctx.fillStyle = "#64748b";
    ctx.fillRect(cylinderX + 2, pistonTopY - 14, cylinderWidth - 4, 14);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(cylinderX + 2, pistonTopY - 14, cylinderWidth - 4, 14);

    // 피스톤 축(손잡이)
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(cylinderX + cylinderWidth / 2 - 12, 10, 24, pistonTopY - 24);

    // 압력 추(Weights) 시각화: 압력에 비례한 추 그래픽
    const weightCount = Math.round(pressure * 2);
    for (let w = 0; w < weightCount; w++) {
      ctx.fillStyle = "#475569";
      ctx.fillRect(cylinderX + cylinderWidth / 2 - 40 + (w % 4) * 22, pistonTopY - 32 - Math.floor(w / 4) * 16, 18, 14);
    }

    // (3) 온도에 따른 분자 평균 속도 계산 (온도 차이가 육안으로 명확히 보이도록 강화)
    const kelvin = tempC + 273.15;
    // 저온(223K / -50℃)에서는 둔하게, 고온(423K / 150℃)에서는 매우 빠르게 움직이도록 체감 증폭
    const speedFactor = Math.pow(kelvin / 300.15, 1.3) * 3.2;

    // (4) 기체 분자 위치 갱신 및 충돌 처리
    particles.forEach(p => {
      const prevX = p.x;
      const prevY = p.y;

      // 속도 벡터 적용
      p.x += p.vx * speedFactor;
      p.y += p.vy * speedFactor;

      // 좌우 벽면 충돌
      if (p.x - p.radius < cylinderX + 4) {
        p.x = cylinderX + 4 + p.radius;
        p.vx *= -1;
      } else if (p.x + p.radius > cylinderX + cylinderWidth - 4) {
        p.x = cylinderX + cylinderWidth - 4 - p.radius;
        p.vx *= -1;
      }

      // 피스톤 및 바닥 충돌
      if (p.y - p.radius < pistonTopY) {
        p.y = pistonTopY + p.radius;
        p.vy *= -1;
      } else if (p.y + p.radius > cylinderBottomY - 4) {
        p.y = cylinderBottomY - 4 - p.radius;
        p.vy *= -1;
      }

      // 고온 시 빠른 속도를 시각화하는 운동 잔상(Speed Tail)
      if (speedFactor > 2.5) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * speedFactor * 1.5, p.y - p.vy * speedFactor * 1.5);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // 분자 본체 그리기
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  // 초기 상태 로드
  setLawMode("boyle");
  requestAnimationFrame(animate);
});
