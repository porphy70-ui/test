/**
 * Science Lab Hub - 탐구 수업 데이터 저장소
 * 새로운 실험을 추가하려면 이 배열에 새 객체를 등록하기만 하면 됩니다.
 */
const LABS_DATA = [
  {
    id: "periodic-table",
    number: "LAB 01",
    title: "주기율표 탐구 실험실",
    description: "1번 수소(H)부터 118번 오가네손(Og)까지 1~7주기 18족 전체 원소의 주기성, 전자 배치, 보어 원자 모형을 장주기형 주기율표로 탐구합니다.",
    icon: "🧪",
    grade: "고1·고2",
    subject: "화학",
    unit: "물질의 규칙성",
    tags: ["원소", "장주기형주기율표", "118번원소", "보어원자모형", "원자가전자", "동위원소"],
    path: "labs/periodic-table/index.html"
  },
  {
    id: "gas-laws",
    number: "LAB 02",
    title: "기체 법칙 가상 실험실",
    description: "온도, 압력, 부피를 직접 조작하며 보일 법칙, 샤를 법칙, 보일·샤를 법칙과 분자 운동론을 5단계 주도적 탐구로 시뮬레이션합니다.",
    icon: "🎈",
    grade: "고1·고2",
    subject: "물리/화학",
    unit: "기체의 성질",
    tags: ["보일법칙", "샤를법칙", "보일샤를법칙", "분자운동", "압력과부피", "절대온도"],
    path: "labs/gas-laws/index.html"
  },
  {
    id: "wave-interference",
    number: "LAB 03",
    title: "파동의 중첩과 간섭 시뮬레이터",
    description: "파동의 기본 성질(v = f·λ), 변위의 중첩 원리(y = y₁ + y₂), 그리고 2차원 수면파의 보강·상쇄 간섭무늬와 경로차를 실시간으로 탐구합니다.",
    icon: "🌊",
    grade: "고1·고2",
    subject: "물리",
    unit: "파동과 정보통신",
    tags: ["파동의성질", "중첩원리", "합성파", "보강간섭", "상쇄간섭", "2D수면파", "경로차"],
    path: "labs/wave-interference/index.html"
  }
];

// 전역 스코프(window)에 등록하여 다른 스크립트에서도 사용 가능하도록 설정
if (typeof window !== "undefined") {
  window.LABS_DATA = LABS_DATA;
}
