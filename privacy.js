'use strict';
(()=>{
 const VERSION='2026-10-17',KEY='trip-days-privacy-v1',TOKEN='trip-days-analytics-v1',PENDING='trip-days-analytics-delete',TTL=90*86400000;
 const read=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}},write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
 const remove=k=>{try{localStorage.removeItem(k)}catch{}};
 let choice=read(KEY),token=read(TOKEN),mapUrl='',mapAllowed=false;
 const valid=()=>choice?.version===VERSION&&choice.analytics===true&&Date.now()-choice.at<TTL;
 if(!valid()&&token){write(PENDING,token);remove(TOKEN);token=null;}
 const el=id=>document.getElementById(id),status=t=>{el('privacyStatus').textContent=t};
 window.tripPrivacy={analyticsAllowed:valid,analyticsToken(){if(!valid())throw Error('통계 선택 동의가 필요합니다.');if(!token){token=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');write(TOKEN,token)}return token},setMap(url){mapUrl=url;if(mapAllowed){el('map').src=url;el('map').hidden=false;}},version:VERSION};
 async function cleanup(){const pending=read(PENDING);if(!pending)return true;try{const r=await window.tripApi('/api/privacy-delete',{scope:'analytics',analyticsToken:pending});if(!r.ok)throw Error();remove(PENDING);return true}catch{return false}}
 el('openPrivacySettings').onclick=()=>{el('privacySettings').hidden=false;el('privacySettings').scrollIntoView({behavior:'smooth'});};
 el('closePrivacySettings').onclick=()=>el('privacySettings').hidden=true;
 el('acceptAnalytics').onclick=async()=>{if(!await cleanup()){status('이전 통계정보 삭제 처리가 준비 중입니다. 삭제 완료 후 다시 허용할 수 있어요.');return}choice={version:VERSION,analytics:true,at:Date.now()};write(KEY,choice);status('방문통계를 허용했습니다. 서버의 보관·삭제 설정이 준비된 경우에만 집계합니다.');window.dispatchEvent(new Event('trip-privacy-change'))};
 el('rejectAnalytics').onclick=async()=>{const previous=token;choice={version:VERSION,analytics:false,at:Date.now()};write(KEY,choice);if(previous)write(PENDING,previous);token=null;remove(TOKEN);window.dispatchEvent(new Event('trip-privacy-change'));status('방문통계를 거부했습니다. 여행 기능은 계속 이용할 수 있습니다.');if(!await cleanup())status('새 방문 집계는 중단했습니다. 기존 통계정보 삭제는 서버 연결 후 재시도됩니다.');else if(previous)status('방문통계를 철회하고 해당 통계 식별정보를 삭제했습니다.');};
 el('loadExternalMap').onclick=()=>{mapAllowed=true;el('loadExternalMap').hidden=true;if(mapUrl)window.tripPrivacy.setMap(mapUrl)};
 el('disableExternalMap').onclick=()=>{mapAllowed=false;el('map').removeAttribute('src');el('map').hidden=true;el('loadExternalMap').hidden=false;status('지도를 닫았습니다. 다시 불러오기 전까지 지도 요청을 보내지 않습니다.')};
 if(!choice||choice.version!==VERSION||Date.now()-choice.at>=TTL)el('privacySettings').hidden=false;
 window.addEventListener('load',()=>{cleanup();if(valid())status('현재 방문통계 허용 상태입니다. 언제든 철회할 수 있어요.');});
})();
