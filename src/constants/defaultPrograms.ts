/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */

export const DEFAULT_PROGRAMS = [
    {
        id: '1',
        title: "신체활동 지원",
        eng: "Physical Activity Support",
        icon_name: 'Heart',
        desc: "어르신의 신체 기능 유지 및 향상을 위해 일상생활 동작(ADL) 훈련, 보행 연습, 관절 운동 등을 지원합니다.",
        targets: ["거동이 불편하신 어르신", "근력 저하가 있으신 어르신", "재활이 필요하신 어르신"]
    },
    {
        id: '2',
        title: "가사 지원",
        eng: "Housekeeping Support",
        icon_name: 'Home',
        desc: "청소, 세탁, 식사 준비 등 가사 활동을 지원하여 어르신이 쾌적한 환경에서 생활하실 수 있도록 돕습니다.",
        targets: ["독거 어르신", "가사 활동이 어려우신 어르신", "일상생활 지원이 필요하신 어르신"]
    },
    {
        id: '3',
        title: "건강 관리",
        eng: "Health Management",
        icon_name: 'Stethoscope',
        desc: "혈압, 혈당 체크 등 기본 건강 모니터링과 투약 관리, 병원 동행 서비스를 제공합니다.",
        targets: ["만성질환이 있으신 어르신", "정기적인 건강 관리가 필요하신 어르신", "투약 관리가 필요하신 어르신"]
    },
    {
        id: '4',
        title: "인지활동 지원",
        eng: "Cognitive Activity Support",
        icon_name: 'Brain',
        desc: "기억력 향상 프로그램, 두뇌 활성화 활동, 회상 요법 등을 통해 어르신의 인지 기능 유지를 돕습니다.",
        targets: ["경도 인지장애가 있으신 어르신", "치매 예방이 필요하신 어르신", "인지 기능 저하가 우려되시는 어르신"]
    },
    {
        id: '5',
        title: "정서 지원",
        eng: "Emotional Support",
        icon_name: 'Heart',
        desc: "말벗 서비스, 사회활동 동행, 취미활동 지원 등을 통해 어르신의 정서적 안정과 사회적 교류를 도모합니다.",
        targets: ["외로움을 느끼시는 어르신", "우울감이 있으신 어르신", "사회적 교류가 필요하신 어르신"]
    },
    {
        id: '6',
        title: "건강 상태 평가",
        eng: "Health Assessment",
        icon_name: 'ClipboardCheck',
        desc: "표준화된 평가 도구를 활용하여 어르신의 현재 건강 상태와 케어 필요도를 파악하고, 맞춤형 케어 계획을 수립합니다.",
        targets: ["신규 이용 어르신", "정기적인 건강 평가가 필요하신 어르신"]
    }
];
