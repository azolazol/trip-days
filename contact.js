'use strict';
(()=>{
 const form=document.getElementById('contactForm'),status=document.getElementById('contactStatus'),fields=document.getElementById('contactFields'),button=form.querySelector('button'),deleteButton=document.getElementById('deleteMyFeedback');let requestId=crypto.randomUUID(),busy=false;
 const email=form.elements.replyEmail,emailConsent=form.elements.emailConsent;
 email.addEventListener('input',()=>{emailConsent.required=!!email.value.trim();if(!email.value.trim())emailConsent.checked=false;});
 form.addEventListener('input',()=>{requestId=crypto.randomUUID()});
 async function ready(){try{const r=await window.tripApi('/api/privacy-status');if(r.policyVersion!=='2026-10-17'||!r.feedbackReady)throw Error();fields.disabled=false;deleteButton.disabled=false;status.textContent='이메일 없이도 문의할 수 있어요. 개인정보 처리 안내를 확인해주세요.';}catch{fields.disabled=true;status.textContent='문의 접수 준비 중입니다. 보관·삭제 설정을 확인한 뒤 열립니다. 현재 입력정보는 전송되지 않습니다.';}}
 form.addEventListener('submit',async e=>{e.preventDefault();if(busy||fields.disabled||!form.reportValidity())return;busy=true;button.disabled=true;status.textContent='문의를 보내고 있어요…';const data=new FormData(form);
 try{const result=await window.tripApi('/api/feedback',{requestId,category:data.get('category'),message:data.get('message'),replyEmail:data.get('replyEmail'),website:data.get('website'),consent:data.get('consent')==='on',emailConsent:data.get('emailConsent')==='on',consentVersion:'2026-10-17'});if(!result?.ok)throw Error();status.textContent='문의가 접수됐어요. 접수번호: '+result.id;form.reset();emailConsent.required=false;requestId=crypto.randomUUID();}
 catch{status.textContent='접수 여부를 확인하지 못했어요. 잠시 후 다시 보내주세요. 내용을 바꾸지 않고 재시도하면 같은 접수번호를 사용합니다.';}
 finally{busy=false;button.disabled=false;}});
 deleteButton.onclick=async()=>{if(!confirm('이 브라우저로 접수한 문의를 모두 삭제할까요? 삭제하면 해당 문의 답변을 진행할 수 없습니다.'))return;deleteButton.disabled=true;const s=document.getElementById('deleteFeedbackStatus');try{const r=await window.tripApi('/api/privacy-delete',{scope:'feedback'});if(!r.ok)throw Error();s.textContent='이 브라우저로 접수한 문의 '+r.deleted+'건을 삭제했습니다.';}catch{s.textContent='삭제 여부를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.';}finally{deleteButton.disabled=false}};
 ready();document.getElementById('contactPanel').addEventListener('toggle',e=>{if(e.target.open&&fields.disabled)ready()});
})();
