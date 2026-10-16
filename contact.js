
'use strict';
(()=>{
const form=document.getElementById('contactForm'),status=document.getElementById('contactStatus'),button=form.querySelector('button');let requestId=crypto.randomUUID(),busy=false;
form.addEventListener('input',()=>{requestId=crypto.randomUUID()});
form.addEventListener('submit',async e=>{e.preventDefault();if(busy||!form.reportValidity())return;busy=true;button.disabled=true;status.textContent='문의를 보내고 있어요…';const data=new FormData(form);
try{const result=await window.tripApi('/api/feedback',{requestId,category:data.get('category'),message:data.get('message'),replyEmail:data.get('replyEmail'),website:data.get('website'),consent:data.get('consent')==='on'});if(!result?.ok)throw Error('접수 확인 실패');status.textContent='문의가 접수됐어요. 접수번호: '+result.id;form.reset();requestId=crypto.randomUUID();}
catch{status.textContent='접수 여부를 확인하지 못했어요. 잠시 후 다시 보내주세요. 같은 내용을 다시 보내도 중복 접수되지 않습니다.';}
finally{busy=false;button.disabled=false;}});
})();
