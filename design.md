# CERAD CATALOG App Design

## Overview
대호상사 CERAD 미용용품 카탈로그 앱. Google Drive에서 카탈로그 데이터를 로드하여 표시하며, 오프라인 모드, 검색, 즐겨찾기, 카테고리 필터 기능을 제공한다.

## Screen List

### 1. Home Screen (홈)
- 상단: CERAD 로고 + 앱 타이틀 헤더
- 히어로 배너: "CERAD" 브랜드 배너 (그라데이션 배경)
- 카테고리 그리드: 10개 카테고리 카드 (2열 그리드)
  - 각 카드: 대표 이미지 썸네일, 카테고리명(한/영), 설명, 페이지 수
  - 카드 탭 → 카탈로그 뷰어로 이동

### 2. Catalog Viewer Screen (카탈로그 뷰어)
- 상단: 뒤로가기 버튼 + 카테고리명 + 페이지 인디케이터
- 썸네일 스트립: 가로 스크롤 페이지 썸네일 목록
- 메인 이미지 영역: 전체 화면 이미지 뷰어
  - 좌우 스와이프로 페이지 이동
  - 핀치 줌 지원
  - 줌 컨트롤 버튼 (+, 리셋, -)

### 3. Search Screen (검색)
- 상단: 검색 입력 필드
- 검색 결과: 카테고리 목록 (이름/설명 기반 필터링)
- 빈 상태: "검색어를 입력하세요" 안내

### 4. Favorites Screen (즐겨찾기)
- 즐겨찾기한 카테고리 목록
- 빈 상태: "즐겨찾기가 없습니다" 안내
- 각 항목에서 즐겨찾기 해제 가능

## Primary Content and Functionality

### 데이터 소스
- Google Drive에 저장된 catalog.json (카테고리 정보 + 이미지 ID)
- Google Drive에 저장된 page_XXX.jpg (카탈로그 이미지 54장)

### 핵심 기능
1. **카탈로그 브라우징**: 카테고리별 제품 이미지 열람
2. **이미지 뷰어**: 줌, 스와이프, 썸네일 네비게이션
3. **검색**: 카테고리명/설명으로 검색
4. **즐겨찾기**: 자주 보는 카테고리 북마크 (AsyncStorage)
5. **오프라인 모드**: 한 번 로드된 이미지 캐싱
6. **새로고침**: Pull-to-refresh로 최신 데이터 로드

## Key User Flows

### Flow 1: 카탈로그 열람
1. 앱 실행 → 홈 화면 (카테고리 그리드)
2. 카테고리 카드 탭 → 카탈로그 뷰어
3. 이미지 좌우 스와이프 / 썸네일 탭으로 페이지 이동
4. 핀치 줌으로 상세 확인
5. 뒤로가기 → 홈 화면

### Flow 2: 검색
1. 검색 탭 탭 → 검색 화면
2. 검색어 입력 → 실시간 필터링
3. 결과 카테고리 탭 → 카탈로그 뷰어

### Flow 3: 즐겨찾기
1. 홈 화면에서 카테고리 카드의 하트 아이콘 탭
2. 즐겨찾기 탭 → 즐겨찾기 목록 확인
3. 즐겨찾기 항목 탭 → 카탈로그 뷰어

## Color Choices

### Primary Brand Colors
- **Primary (Navy)**: `#1A237E` - CERAD 브랜드 메인 컬러
- **Accent (Orange)**: `#FF6F00` - 강조 색상
- **Background**: `#F5F5F5` (라이트) / `#151718` (다크)
- **Surface**: `#FFFFFF` (라이트) / `#1e2022` (다크)
- **Text**: `#212121` (라이트) / `#ECEDEE` (다크)
- **Subtext**: `#757575` (라이트) / `#9BA1A6` (다크)

### Category Colors (from original HTML)
- Iron: `#C0392B`
- Brush: `#8E44AD`
- Comb: `#2980B9`
- Rod: `#16A085`
- Pin: `#D35400`
- Tissue: `#27AE60`
- Misc: `#1A237E`
- Electric: `#F39C12`
- Wig: `#5D4037`
- Basic Set: `#546E7A`

## Tab Bar Configuration
1. **홈** (house.fill) - 카테고리 그리드
2. **검색** (magnifyingglass) - 검색 기능
3. **즐겨찾기** (heart.fill) - 즐겨찾기 목록
