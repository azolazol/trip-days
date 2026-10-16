/** Trip Days – private Sheets datastore. Configure Script Properties before deployment. */
function db_(){const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');if(!id)throw Error('SPREADSHEET_ID를 설정해주세요.');return SpreadsheetApp.openById(id)}
function rows_(name){const s=db_().getSheetByName(name);if(!s)throw Error(name+' 시트가 없습니다.');const v=s.getDataRange().getValues(),head=v.shift();return v.map((r,i)=>Object.assign({_row:i+2},Object.fromEntries(head.map((k,j)=>[k,r[j] instanceof Date?Utilities.formatDate(r[j],'Asia/Seoul','yyyy-MM-dd'):r[j]])))).filter(r=>r[head[0]]!=='')}
function table_(name){return db_().getSheetByName(name)}
function hash_(token){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,token).map(b=>(b&255).toString(16).padStart(2,'0')).join('')}
function text_(v,n){return String(v==null?'':v).trim().slice(0,n)}
function safeCell_(v){return typeof v==='string'&&/^[=+@-]/.test(v)?"'"+v:v}
function write_(name,item,row){const s=table_(name),head=s.getRange(1,1,1,s.getLastColumn()).getValues()[0],values=head.map(k=>safeCell_(item[k]??''));if(row)s.getRange(row,1,1,values.length).setValues([values]);else s.appendRow(values)}
function public_(p,owner){return Object.fromEntries(['id','name','address','category','area','duration','map_url','notes','created_at','updated_at'].map(k=>[k,p[k]]) .concat([['owned',p.owner_hash===owner?1:0]]))}
function on_(v){return v===true||v===1||String(v).toLowerCase()==='true'}
function catalog_(){const cities=rows_('Cities'),areas=rows_('Areas'),places=rows_('Places'),presets=rows_('Presets');return{cities:cities.filter(c=>on_(c.enabled)).map(c=>{const a=areas.filter(a=>a.city===c.id);const ps=places.filter(p=>p.city===c.id&&on_(p.enabled)).map(p=>({id:p.id,name:p.name,jp:p.query,area:p.area,type:p.category,lat:Number(p.lat),lng:Number(p.lng),duration:Number(p.duration),desc:p.description,tag:p.tag,source:/^https:\/\//.test(p.source)?p.source:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.query),tamnik:on_(p.tamnik),meal:p.meal}));const days=Array.from({length:Number(c.defaultDays)},()=>[]);presets.filter(p=>p.city===c.id).sort((a,b)=>a.order-b.order).forEach(p=>{if(days[p.day-1]&&ps.some(x=>x.id===p.place))days[p.day-1].push(p.place)});return{id:c.id,name:c.name,country:c.country,mapRegion:c.mapRegion,color:c.color,defaultDays:Number(c.defaultDays),maxDays:Number(c.maxDays),defaultArea:c.defaultArea,areas:Object.fromEntries(a.map(x=>[x.id,x.name])),anchors:Object.fromEntries(a.map(x=>[x.id,[Number(x.lat),Number(x.lng),x.query]])),places:ps,recommended:days}})}}
function doGet(e){const t=HtmlService.createTemplateFromFile('Bridge');t.origin=PropertiesService.getScriptProperties().getProperty('SITE_ORIGIN')||'https://azolazol.github.io';t.channel=/^[a-f0-9-]{36}$/i.test(e.parameter.channel||'')?e.parameter.channel:'';return t.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).setTitle('Trip Days 연결')}
function api(input){try{if(!input||typeof input!=='object')throw Error('잘못된 요청');if(input.path==='/api/catalog')return catalog_();if(!/^[a-f0-9]{64}$/.test(input.token||''))throw Error('브라우저 저장정보를 확인해주세요.');const owner=hash_(input.token),body=input.body||{},now=new Date().toISOString();const lock=LockService.getScriptLock();if(!lock.tryLock(15000))throw Error('잠시 후 다시 시도해주세요.');try{
 if(input.path==='/api/feedback')return feedback_(input,owner,now);
 if(input.path==='/api/visitors'){const day=Utilities.formatDate(new Date(),'Asia/Seoul','yyyy-MM-dd'),all=rows_('Visitors'),old=all.find(x=>x.owner_hash===owner);if(!old)write_('Visitors',{owner_hash:owner,first_day:day,last_day:day});else if(old.last_day!==day)write_('Visitors',{...old,last_day:day},old._row);return{day,today:all.filter(x=>x.last_day===day&&x.owner_hash!==owner).length+1,total:all.length+(old?0:1)}}
 const city=rows_('Cities').find(c=>c.id===input.city&&on_(c.enabled));if(!city)throw Error('여행지를 확인해주세요.');const mine=rows_('MyPlaces').filter(p=>p.city===city.id&&p.owner_hash===owner),rec=rows_('Recommendations').filter(p=>p.city===city.id);
 if(input.path==='/api/my-places'){
 if(!body.action)return{items:mine.map(p=>public_(p,owner))};
 if(body.action==='save'){const name=text_(body.name,120),area=text_(body.area,40),category=body.category,duration=Number(body.duration),map=text_(body.map_url,2048);if(!name||!rows_('Areas').some(a=>a.city===city.id&&a.id===area)||!['sight','food'].includes(category)||![30,60,90,120,180,240].includes(duration))throw Error('장소 이름·지역·종류·시간을 확인해주세요.');if(map&&!/^https:\/\/(maps\.app\.goo\.gl|goo\.gl|maps\.google\.com|www\.google\.com|google\.com)\//.test(map))throw Error('구글맵 링크를 확인해주세요.');const old=body.id?mine.find(p=>p.id===body.id):null;if(body.id&&!old)throw Error('내 장소를 찾을 수 없습니다.');if(!old&&mine.length>=200)throw Error('도시별 저장 한도는 200곳입니다.');const item={city:city.id,id:old?old.id:Utilities.getUuid(),owner_hash:owner,name,address:text_(body.address,200),category,area,duration,map_url:map,notes:text_(body.notes,500),created_at:old?old.created_at:now,updated_at:now};write_('MyPlaces',item,old&&old._row);return{item:public_(item,owner)}}
 if(body.action==='delete'){const old=mine.find(p=>p.id===body.id);if(!old)throw Error('내 장소를 찾을 수 없습니다.');const published=rec.find(p=>p.id===body.id&&p.owner_hash===owner);if(published)table_('Recommendations').deleteRow(published._row);table_('MyPlaces').deleteRow(old._row);return{ok:true}}
 }
 if(input.path==='/api/recommendations'){
 if(!body.action)return{items:rec.sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at))).slice(0,200).map(p=>public_(p,owner))};
 if(body.action==='recommend'){const item=mine.find(p=>p.id===body.id);if(!item)throw Error('내 장소를 먼저 저장해주세요.');const old=rec.find(p=>p.id===item.id&&p.owner_hash===owner);if(!old&&rec.filter(p=>p.owner_hash===owner).length>=50)throw Error('도시별 추천은 50곳까지 가능합니다.');write_('Recommendations',{...item,updated_at:now},old&&old._row);return{ok:true}}
 if(body.action==='delete'){const old=rec.find(p=>p.id===body.id&&p.owner_hash===owner);if(!old)throw Error('내 추천을 찾을 수 없습니다.');table_('Recommendations').deleteRow(old._row);return{ok:true}}
 }throw Error('지원하지 않는 요청입니다.');
 }finally{lock.releaseLock()}}catch(e){return{error:e.message}}}

// Private contact inbox; recipient is configured ONLY in Script Properties.
function setupFeedback(){
 const to=PropertiesService.getScriptProperties().getProperty('FEEDBACK_TO');
 if(!to||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))throw Error('FEEDBACK_TO를 설정해주세요.');
 if(!table_('Feedback'))db_().insertSheet('Feedback').appendRow(['id','created_at','owner_hash','city','category','message','reply_email','email_status']);
 MailApp.getRemainingDailyQuota();
 console.log('FEEDBACK_READY');
}
function feedback_(input,owner,now){
 const b=input.body||{},id=String(b.requestId||''),category=String(b.category||''),message=String(b.message||'').trim(),reply=String(b.replyEmail||'').trim();
 if(b.website||b.consent!==true||! /^[a-f0-9-]{36}$/i.test(id)||!['일반 문의','오류 신고','개선 제안','여행지 추가 요청'].includes(category)||message.length<5||message.length>3000||reply.length>254||(reply&&! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reply)))throw Error('문의 입력을 확인해주세요.');
 const to=PropertiesService.getScriptProperties().getProperty('FEEDBACK_TO');
 if(!to||!table_('Feedback'))throw Error('문의 기능 준비 중입니다.');
 const all=rows_('Feedback'),prior=all.find(r=>r.id===id&&r.owner_hash===owner);
 if(prior)return{ok:true,id:prior.id};
 const today=now.slice(0,10),daily=all.filter(r=>String(r.created_at).startsWith(today));
 if(daily.length>=50||daily.filter(r=>r.owner_hash===owner).length>=5)throw Error('오늘 접수 한도에 도달했어요.');
 if(all.some(r=>r.owner_hash===owner&&Date.parse(now)-Date.parse(r.created_at)<60000))throw Error('잠시 후 다시 보내주세요.');
 const city=rows_('Cities').find(c=>c.id===input.city&&on_(c.enabled));
 const item={id,created_at:now,owner_hash:owner,city:city?city.name:'공통',category,message,reply_email:reply,email_status:'PENDING'};
 write_('Feedback',item);SpreadsheetApp.flush();
 const row=table_('Feedback').getLastRow();
 try{MailApp.sendEmail({to,subject:'[Trip Days 문의] '+category,body:'접수번호: '+id+'\n접수시각: '+now+'\n여행지: '+item.city+'\n유형: '+category+'\n답변 이메일(작성자 입력, 미인증): '+(reply||'없음')+'\n\n문의 내용:\n'+message+'\n\n문의에 포함된 링크는 확인 후 열어 주세요.'});item.email_status='SENT';}catch(e){item.email_status='FAILED';}
 write_('Feedback',item,row);return{ok:true,id};
}
