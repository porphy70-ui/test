/**
 * 주기율표 탐구 실험실 - 장주기형(1~118번) 주기율표 인터랙션 및 모달 로직
 */

document.addEventListener("DOMContentLoaded", () => {
  const ptableGrid = document.getElementById("ptable-grid");
  const lanthanideRow = document.getElementById("lanthanide-row");
  const actinideRow = document.getElementById("actinide-row");

  const modalBackdrop = document.getElementById("modal-backdrop");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const categoryFilters = document.querySelectorAll(".legend-chip");

  let activeFilter = "all";
  let currentSelectedElement = null;

  // 1. 단일 원소 버튼 엘리먼트 생성 헬퍼
  function createElementCell(elem) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `ptable-cell cat-${elem.category}`;
    cell.setAttribute("data-category", elem.category);
    cell.setAttribute("data-number", elem.number);

    if (activeFilter !== "all" && elem.category !== activeFilter) {
      cell.style.opacity = "0.2";
      cell.style.filter = "grayscale(70%)";
    } else {
      cell.style.opacity = "1";
      cell.style.filter = "none";
    }

    cell.innerHTML = `
      <div class="ptable-cell-top">
        <span>${elem.number}</span>
        <span>${elem.group ? elem.group + '족' : ''}</span>
      </div>
      <div class="ptable-symbol">${elem.symbol}</div>
      <div class="ptable-name">${elem.name}</div>
      <div class="ptable-mass">${elem.atomicMass}</div>
    `;

    cell.addEventListener("click", () => openElementModal(elem));
    return cell;
  }

  // 2. 장주기형 주기율표 렌더링
  function renderPeriodicTable() {
    ptableGrid.innerHTML = "";
    lanthanideRow.innerHTML = "";
    actinideRow.innerHTML = "";

    // (A) 본체 주기율표 (1~7주기, 1~18족)
    for (let p = 1; p <= 7; p++) {
      for (let g = 1; g <= 18; g++) {
        // 6주기 3족: 란타넘족 위치 플레이스홀더 (57~71)
        if (p === 6 && g === 3) {
          const phCell = document.createElement("div");
          phCell.className = "ptable-placeholder-cell";
          phCell.innerHTML = `<span>57-71</span><span>*La-Lu</span>`;
          ptableGrid.appendChild(phCell);
          continue;
        }

        // 7주기 3족: 악티늄족 위치 플레이스홀더 (89~103)
        if (p === 7 && g === 3) {
          const phCell = document.createElement("div");
          phCell.className = "ptable-placeholder-cell";
          phCell.innerHTML = `<span>89-103</span><span>**Ac-Lr</span>`;
          ptableGrid.appendChild(phCell);
          continue;
        }

        // 해당 주기/족 원소 검색 (란타넘/악티늄 제외)
        const elem = ELEMENTS_DATA.find(e => 
          e.period === p && e.group === g && 
          e.category !== "lanthanide" && e.category !== "actinide"
        );

        if (elem) {
          ptableGrid.appendChild(createElementCell(elem));
        } else {
          // 비어있는 격자
          const emptyCell = document.createElement("div");
          emptyCell.className = "ptable-empty-cell";
          ptableGrid.appendChild(emptyCell);
        }
      }
    }

    // (B) 란타넘족 행 렌더링 (57번 La ~ 71번 Lu)
    // 앞 3칸 라벨 및 공백
    const laLabel = document.createElement("div");
    laLabel.className = "fblock-label";
    laLabel.textContent = "* 란타넘족 (La~Lu)";
    lanthanideRow.appendChild(laLabel);

    const lanthanides = ELEMENTS_DATA.filter(e => e.category === "lanthanide");
    lanthanides.forEach(elem => {
      lanthanideRow.appendChild(createElementCell(elem));
    });

    // (C) 악티늄족 행 렌더링 (89번 Ac ~ 103번 Lr)
    const acLabel = document.createElement("div");
    acLabel.className = "fblock-label";
    acLabel.textContent = "** 악티늄족 (Ac~Lr)";
    actinideRow.appendChild(acLabel);

    const actinides = ELEMENTS_DATA.filter(e => e.category === "actinide");
    actinides.forEach(elem => {
      actinideRow.appendChild(createElementCell(elem));
    });
  }

  // 3. 분류 필터 클릭 이벤트
  categoryFilters.forEach(chip => {
    chip.addEventListener("click", () => {
      categoryFilters.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeFilter = chip.getAttribute("data-filter");
      renderPeriodicTable();
    });
  });

  // 4. 모달 창 열기
  function openElementModal(elem) {
    currentSelectedElement = elem;

    document.getElementById("modal-elem-number").textContent = elem.number;
    document.getElementById("modal-elem-symbol").textContent = elem.symbol;
    document.getElementById("modal-elem-name").textContent = elem.name;
    document.getElementById("modal-elem-eng").textContent = elem.engName;

    const badge = document.getElementById("modal-symbol-badge");
    badge.className = `modal-symbol-badge cat-${elem.category}`;

    document.getElementById("spec-period").textContent = `${elem.period}주기`;
    document.getElementById("spec-group").textContent = elem.group ? `${elem.group}족` : `${elem.categoryName}`;
    document.getElementById("spec-valence").textContent = elem.valenceElectrons !== undefined ? `${elem.valenceElectrons}개` : "-";
    document.getElementById("spec-category").textContent = elem.categoryName;
    document.getElementById("spec-mass").textContent = elem.atomicMass;
    document.getElementById("spec-config").textContent = elem.electronConfig || "-";

    document.getElementById("modal-properties").textContent = elem.properties;

    // 보어 모형 SVG 렌더링
    drawBohrModel(elem);

    // 동위 원소 계산기 구성
    const isotopeSelect = document.getElementById("isotope-select");
    isotopeSelect.innerHTML = elem.isotopes.map((iso, idx) => `
      <option value="${idx}">${iso.name} (존재비: ${iso.abundance})</option>
    `).join("");

    updateIsotopeCalculations(0);

    modalBackdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  // 5. 보어 원자 모형 SVG 렌더링
  function drawBohrModel(elem) {
    const svg = document.getElementById("bohr-svg");
    svg.innerHTML = "";

    const cx = 120;
    const cy = 120;
    const shells = elem.shells || [elem.protons];
    const shellNames = ["K", "L", "M", "N", "O", "P", "Q"];

    // 중심 원자핵
    const nucleus = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    nucleus.setAttribute("cx", cx);
    nucleus.setAttribute("cy", cy);
    nucleus.setAttribute("r", 18);
    nucleus.setAttribute("fill", "#2563eb");
    svg.appendChild(nucleus);

    const nucleusText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    nucleusText.setAttribute("x", cx);
    nucleusText.setAttribute("y", cy + 4);
    nucleusText.setAttribute("text-anchor", "middle");
    nucleusText.setAttribute("fill", "#ffffff");
    nucleusText.setAttribute("font-size", elem.protons >= 100 ? "9px" : "11px");
    nucleusText.setAttribute("font-weight", "bold");
    nucleusText.textContent = `+${elem.protons}`;
    svg.appendChild(nucleusText);

    // 전자 껍질 궤도 그리기
    const baseRadius = 26;
    const radiusStep = 12;

    shells.forEach((electronCount, shellIdx) => {
      const r = baseRadius + shellIdx * radiusStep;

      const orbit = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      orbit.setAttribute("cx", cx);
      orbit.setAttribute("cy", cy);
      orbit.setAttribute("r", r);
      orbit.setAttribute("fill", "none");
      orbit.setAttribute("stroke", "#94a3b8");
      orbit.setAttribute("stroke-dasharray", "2,2");
      orbit.setAttribute("stroke-width", "1");
      svg.appendChild(orbit);

      // 시각적 표현을 위해 껍질당 최대 18개까지 고르게 표시
      const displayElectrons = Math.min(electronCount, 18);
      for (let i = 0; i < displayElectrons; i++) {
        const angle = (2 * Math.PI / displayElectrons) * i - (Math.PI / 2);
        const ex = cx + r * Math.cos(angle);
        const ey = cy + r * Math.sin(angle);

        const isOuter = shellIdx === shells.length - 1;

        const electron = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        electron.setAttribute("cx", ex);
        electron.setAttribute("cy", ey);
        electron.setAttribute("r", isOuter ? 3.5 : 2.5);
        electron.setAttribute("fill", isOuter ? "#ef4444" : "#4f46e5");
        svg.appendChild(electron);
      }
    });

    const shellDesc = shells.map((count, i) => `${shellNames[i]}: ${count}`).join(" / ");
    document.getElementById("bohr-shell-text").innerHTML = 
      `껍질별 전자수 (${shellDesc})<br><small style="color: #64748b;">(🔴 최외각 전자 ${shells[shells.length - 1]}개)</small>`;
  }

  // 6. 동위 원소 핵자 계산
  function updateIsotopeCalculations(isotopeIndex) {
    if (!currentSelectedElement) return;

    const iso = currentSelectedElement.isotopes[isotopeIndex];
    document.getElementById("calc-protons").textContent = `${currentSelectedElement.protons}개`;
    document.getElementById("calc-neutrons").textContent = `${iso.neutrons}개`;
    document.getElementById("calc-mass-number").textContent = `${iso.massNumber}`;
  }

  document.getElementById("isotope-select").addEventListener("change", (e) => {
    updateIsotopeCalculations(parseInt(e.target.value, 10));
  });

  // 7. 모달 닫기
  function closeModal() {
    modalBackdrop.classList.remove("active");
    document.body.style.overflow = "";
    currentSelectedElement = null;
  }

  modalCloseBtn.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBackdrop.classList.contains("active")) {
      closeModal();
    }
  });

  // 초기 렌더링
  renderPeriodicTable();
});
