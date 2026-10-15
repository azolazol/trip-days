# Trip Days

오사카·시드니·후쿠오카를 하나의 도시 선택형 여행 일정 사이트로 통합합니다.

## 현재 준비 상태

- 프런트엔드와 Apps Script 코드 완성, 로컬 로직 검증 통과.
- Google Sheets: https://docs.google.com/spreadsheets/d/1bw0gTJ-FKieoPKFVlXPtSNSqK6dugjvQPrl2tHYSeUs/edit
- GitHub 저장소: https://github.com/azolazol/trip-days — Pages 및 Apps Script 연결 진행 중입니다.
- `config.js`의 `appsScriptUrl`은 배포 후 실제 `/exec` 주소로 채워야 합니다.

## 공개 연결 순서

1. `azolazol` 계정에 공개 `trip-days` 저장소를 만들고 이 폴더 내용을 업로드합니다. 기존 저장소와 구분된 새 프로젝트입니다.
2. GitHub Settings → Pages → Deploy from a branch → main / root를 선택합니다. 별도 빌드나 유료 API 키가 필요하지 않습니다.
3. 위 Google Sheets에서 확장 프로그램 → Apps Script를 열고 `apps-script/Code.gs`, `Bridge.html`, `appsscript.json`을 각각 입력합니다.
4. 프로젝트 설정 → 스크립트 속성에 아래 값을 지정합니다.
   - `SPREADSHEET_ID`: `1bw0gTJ-FKieoPKFVlXPtSNSqK6dugjvQPrl2tHYSeUs`
   - `SITE_ORIGIN`: `https://azolazol.github.io`
5. 새 배포 → 웹 앱, 실행 사용자 '나', 액세스 '모든 사용자'로 배포합니다. Google 권한 승인은 소유자가 진행합니다. 스프레드시트 자체는 공개하지 않습니다.
6. 반환된 웹 앱 `/exec` URL을 `config.js`의 `appsScriptUrl`에 입력하고 커밋합니다.
7. 실제 배포 주소에서 도시 선택 → 내 장소 저장 → 다시 접속 → 추천 → 다른 브라우저 추천 확인 → 내 추천 철회 → 사진 저장을 확인합니다. 브라우저 종단 검증 전까지 배포 완료로 간주하지 않습니다.

GitHub Pages 기본 예상 주소는 `https://azolazol.github.io/trip-days/`이며, 현재 실제 공개 여부는 확인되지 않았습니다.

## 기능

- 도시별 관광지, 맛집, 공간탐닉 소개 목록. 시드니에는 별도 공간탐닉 자료가 없어 해당 탭을 숨깁니다.
- 숙소, 여행 일수, 출발 시각, 휴식 시간, 자동 동선, 수동 일차·순서 이동.
- 일차별 PNG 내보내기, 긴 일정 자동 분할.
- 내 장소는 브라우저별 익명 토큰으로 구분해 비공개 보관. 캐시로 같은 기기에서 다시 열 수 있습니다.
- 추천하기를 누른 항목만 공개 추천에 복사합니다. 추천 후 원본 수정은 재추천 시 반영됩니다.
- 전체 사이트의 한국시간 기준 오늘/누적 방문자 수. 도시를 바꿔도 같은 브라우저는 중복 집계하지 않습니다.

## 데이터 관리와 새 여행지

`Cities`: 도시 기본 설정. id는 영문 소문자·숫자·하이픈으로 고유하게 지정합니다.
`Areas`: 도시별 지역, 이동시간 추정용 좌표, 기준역 검색어.
`Places`: 도시 id와 장소 id, 이름·검색어, 지역 id, sight/food, 공간탐닉 여부, 방문시간(분), 좌표, 소개·출처·식사 종류.
`Presets`: 도시 id, 일차, 순서, 장소 id로 추천 일정을 구성합니다.
`MyPlaces`, `Recommendations`, `Visitors`: 사이트가 기록하는 운영 데이터. 열 이름을 변경하지 않습니다.

새 여행지는 Cities 행 추가 → Areas 지역 추가 → Places 장소 추가 → Presets 추천 일정 작성 순서로 등록합니다. `enabled`는 TRUE로 지정합니다. `defaultDays`와 `maxDays`는 1~30의 정수로, `defaultArea`는 해당 도시의 지역 id로 입력합니다. 공개 목록은 새로고침 시 Sheet에서 읽습니다. 사진 추가 시 assets와 data.js의 해당 도시 photo/credit 설정을 함께 업데이트합니다. 사진 미등록 도시는 사진 없이 표시됩니다.

Places의 `meal`은 lunch, dinner, brunch, snack 중 선택하거나 비워둡니다. `tamnik` TRUE인 음식점은 공간탐닉 탭에 표시됩니다. 기존 지역·장소 id 변경 또는 삭제는 개인 저장 일정에 영향을 줄 수 있으므로 되도록 이름·설명만 수정합니다.

## 이전 사이트의 데이터

기존 도시별 사이트는 유지합니다. 주소가 바뀌므로 기존 쿠키·브라우저 저장정보는 자동 이동되지 않습니다. 개인 일정은 이전 사이트에서 계속 볼 수 있고 새 사이트에서 다시 구성해야 합니다. 이전 세 사이트의 공개 추천은 이전 준비 당시 모두 0건이었습니다. 새 통합 사이트 방문자는 새로 집계합니다. 세 사이트의 과거 방문자를 합하면 동일 인물이 중복될 수 있어 합산하지 않습니다.

## 검증

`node tests/check.cjs`: 3개 도시의 일정 배치, 지도 지역, 저장 키 분리, Sheets 어댑터를 사용한 개인 장소 격리, 추천 소유권, 중복 추천 방지, 방문자 중복 집계 방지, URL 검사, 빈 행 처리 검증.
실제 Apps Script 배포·Google 인증·GitHub Pages·모바일 사진 저장은 배포 후 추가 확인이 필요합니다.

## 사진 출처

기존 도시별 사이트에 표시한 저작자·라이선스 링크를 data.js의 credit에 유지했습니다. 사진은 각 도시의 기존 파일을 사용합니다. 사용자 업로드 로고 그림은 사용하지 않습니다.
