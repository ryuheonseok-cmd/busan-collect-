const STORAGE_KEY = 'busan-ocean-collecting-v1';
const AREA_PLACEMENT_KEY = 'busan-ocean-hunter-area-placement-v1';
const ANALYSIS_ENDPOINT = '/api/analyze';
const MIN_MATCH_CONFIDENCE = 82;
const MIN_MATCH_MARGIN = 12;

const {
  LANGUAGE_OPTIONS,
  I18N,
  ITEM_NAMES,
  CATEGORY_NAMES,
  AREA_NAMES,
  RARITY_NAMES,
} = window.BUSAN_I18N;
const SUPPORTED_LANGUAGES = new Set(LANGUAGE_OPTIONS.map(({code})=>code));

const OFFICIAL = [
  ['life','COMMON'],['life','UNCOMMON'],['life','UNCOMMON'],['life','COMMON'],['life','COMMON'],['life','UNCOMMON'],['life','COMMON'],['life','COMMON'],['life','COMMON'],['life','RARE'],['life','RARE'],['life','COMMON'],['life','UNCOMMON'],['life','UNCOMMON'],['life','RARE'],
  ['landmark','LEGEND'],['landmark','RARE'],['landmark','LEGEND'],['landmark','LEGEND'],['landmark','RARE'],['landmark','RARE'],['landmark','RARE'],['landmark','UNCOMMON'],['landmark','RARE'],['landmark','UNCOMMON'],['landmark','UNCOMMON'],
  ['object','UNCOMMON'],['object','COMMON'],['object','COMMON'],['object','COMMON'],['object','UNCOMMON'],['object','COMMON'],['object','UNCOMMON'],['object','RARE'],['object','COMMON'],['object','COMMON'],['object','UNCOMMON'],['object','UNCOMMON'],
  ['nature','COMMON'],['nature','UNCOMMON'],['nature','COMMON'],['nature','RARE'],['nature','RARE'],['nature','UNCOMMON'],['nature','UNCOMMON'],['nature','RARE'],['nature','RARE'],['nature','RARE'],['nature','COMMON'],['nature','RARE'],
  ['landmark','LEGEND'],['object','RARE'],['landmark','RARE'],['landmark','RARE'],['life','LEGEND'],['object','RARE'],
].map((x,i)=>({id:`o${i+1}`,category:x[0],rarity:x[1]}));

const CATEGORY_IDS = ['life','landmark','object','nature'];
// Area entries are limited to items supported by official tourism, geological,
// ecological, or local-government sources. See AREA_SOURCES.md.
const AREA_SOURCES = [
  {id:'gwangalli', mapQuery:'부산광역시 광안리해수욕장', items:['o11','o16','o30','o31','o33','o39','o47','o49']},
  {id:'haeundae', mapQuery:'부산광역시 해운대해수욕장', items:['o11','o17','o23','o30','o31','o33','o39','o41','o42','o45','o47','o49']},
  {id:'songjeong', mapQuery:'부산광역시 송정해수욕장', items:['o11','o12','o26','o28','o30','o33','o36','o39','o41','o45','o47','o48','o49']},
  {id:'songdo', mapQuery:'부산광역시 송도해수욕장', items:['o11','o21','o28','o30','o31','o34','o38','o39','o41','o42','o45','o48','o49']},
  {id:'dadaepo', mapQuery:'부산광역시 다대포해수욕장', items:['o1','o2','o3','o4','o5','o7','o14','o25','o33','o38','o39','o44','o47','o48','o49']},
  {id:'taejongdae', mapQuery:'부산광역시 태종대유원지', items:['o18','o19','o27','o31','o40','o41','o42','o43','o45','o46','o49']},
  {id:'oryukdo', mapQuery:'부산광역시 오륙도 스카이워크', items:['o1','o12','o18','o27','o31','o38','o41','o42','o45','o46','o47','o48','o49']},
  {id:'huinnyeoul', mapQuery:'부산광역시 흰여울문화마을', items:['o22','o31','o40','o42','o48','o49']},
  {id:'cheongsapo', mapQuery:'부산광역시 청사포항', items:['o12','o15','o24','o27','o28','o31','o37','o41','o47','o48','o49']},
  {id:'ilgwang', mapQuery:'부산광역시 일광해수욕장', items:['o12','o27','o28','o29','o30','o37','o39','o40','o49','o51','o52','o53']},
  {id:'imrang', mapQuery:'부산광역시 임랑해수욕장', items:['o12','o27','o28','o29','o31','o38','o39','o49','o54','o55','o56']},
];
const SOURCE_ITEM_COUNTS = AREA_SOURCES.reduce((counts,area)=>{
  [...new Set(area.items)].forEach(id=>{counts[id]=(counts[id]||0)+1});
  return counts;
},{});
const ORIGINAL_EXCLUSIVE_IDS = new Set(Object.keys(SOURCE_ITEM_COUNTS).filter(id=>SOURCE_ITEM_COUNTS[id]===1));
function buildAreaPlacement(){
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(AREA_PLACEMENT_KEY))||{}}catch(error){saved={}}
  const areaIds=new Set(AREA_SOURCES.map(area=>area.id));
  const duplicatedIds=Object.keys(SOURCE_ITEM_COUNTS).filter(id=>SOURCE_ITEM_COUNTS[id]>1);
  const placement={};
  duplicatedIds.forEach(id=>{
    placement[id]=areaIds.has(saved[id])?saved[id]:AREA_SOURCES[Math.floor(Math.random()*AREA_SOURCES.length)].id;
  });
  try{localStorage.setItem(AREA_PLACEMENT_KEY,JSON.stringify(placement))}catch(error){}
  return AREA_SOURCES.map(area=>({...area,items:area.items.filter(id=>ORIGINAL_EXCLUSIVE_IDS.has(id)).concat(duplicatedIds.filter(id=>placement[id]===area.id))}));
}
const AREAS = buildAreaPlacement();
const AREA_ITEM_COUNTS = AREAS.reduce((counts,area)=>{
  [...new Set(area.items)].forEach(id=>{counts[id]=(counts[id]||0)+1});
  return counts;
},{});
const BADGE_META = {
  gwangalli:{glyph:'⌒',stars:1},
  haeundae:{glyph:'▥',stars:1},
  songjeong:{glyph:'↟',stars:1},
  songdo:{glyph:'▣',stars:2},
  dadaepo:{glyph:'◒',stars:2},
  taejongdae:{glyph:'▲',stars:3},
  oryukdo:{glyph:'6',stars:3},
  huinnyeoul:{glyph:'⌂',stars:3},
  cheongsapo:{glyph:'◇',stars:3},
  ilgwang:{glyph:'☀',stars:3},
  imrang:{glyph:'≈',stars:3},
};
const BADGE_REQUIREMENTS = {gwangalli:['o16','o45','o47']};
const BADGE_CRITERIA_VERSION = 4;
const ASSETS = {bgm:'BGM.mp3',effect:'effect.mp3',badges:'badges.png'};
const QUESTS = [
  {id:'first',titleKey:'quest.first.title',hintKey:'quest.first.hint',done:()=>found()>=1},
  {id:'gwangalli3',titleKey:'quest.gwangalli3.title',hintKey:'quest.gwangalli3.hint',done:()=>areaFoundCount('gwangalli')>=3},
  {id:'ten',titleKey:'quest.ten.title',hintKey:'quest.ten.hint',done:()=>found()>=10},
  {id:'natureAll',titleKey:'quest.natureAll.title',hintKey:'quest.natureAll.hint',done:()=>categoryFoundCount('nature')>=OFFICIAL.filter(x=>x.category==='nature').length},
  {id:'landmarkAll',titleKey:'quest.landmarkAll.title',hintKey:'quest.landmarkAll.hint',done:()=>categoryFoundCount('landmark')>=OFFICIAL.filter(x=>x.category==='landmark').length},
  {id:'badgeOne',titleKey:'quest.badgeOne.title',hintKey:'quest.badgeOne.hint',done:()=>Object.keys(state.badges||{}).length>=1},
  {id:'threeBadges',titleKey:'quest.threeBadges.title',hintKey:'quest.threeBadges.hint',done:()=>Object.keys(state.badges||{}).length>=3},
  {id:'all',titleKey:'quest.all.title',hintKey:'quest.all.hint',done:()=>found()>=OFFICIAL.length},
];
const BADGE_SPRITES = {
  gwangalli:{x:0,y:0},haeundae:{x:1,y:0},taejongdae:{x:2,y:0},dadaepo:{x:3,y:0},
  songdo:{x:0,y:1},huinnyeoul:{x:1,y:1},cheongsapo:{x:2,y:1},oryukdo:{x:3,y:1},
  songjeong:{x:0,y:2},ilgwang:{x:1,y:2},imrang:{x:2,y:2},
};
const LEGACY_AREA_IDS = {
  '광안리':'gwangalli','해운대':'haeundae','송정':'songjeong','송도':'songdo',
  '다대포':'dadaepo','태종대':'taejongdae','오륙도':'oryukdo','흰여울문화마을':'huinnyeoul',
  '청사포':'cheongsapo','일광':'ilgwang','임랑':'imrang',
};

let state = load();
let page = 'home';
let activeCat = 'all';
let selectedArea = null;
let selectedCard = null;
let draftPhoto = null;
let aiResult = null;
let specialForm = false;
let setupDraft = {nickname:'',guide:''};
let settingsDraft = null;
let selectedBadgeAreaId = null;
let questChest = null;
let gachaSelection = [];
let detailPhotoIndex = 0;
let bgmAudio = null;
let cameraStream = null;
let capturedAt = null;
const capturedFingerprints = new Set();
let introPresented = false;

const badgeStateBeforeReconcile=JSON.stringify(state.badges);
reconcileBadges();
if(JSON.stringify(state.badges)!==badgeStateBeforeReconcile)save();

function normalizeLanguage(value){return SUPPORTED_LANGUAGES.has(value)?value:'ko'}
function isRecord(value){return Boolean(value&&typeof value==='object'&&!Array.isArray(value))}
function normalizeBadges(value){
  if(!isRecord(value))return {};
  return Object.fromEntries(Object.entries(value).filter(([id,record])=>AREAS.some(area=>area.id===id)&&isRecord(record)));
}
function starterDiscoveries(){
  return Object.fromEntries(BADGE_REQUIREMENTS.gwangalli.map(id=>[id,{photo:rewardPlaceholder('quest'),date:'2026-08-13',areaId:'gwangalli',copies:[]}]));
}
function blank(){return {profile:null,discoveries:starterDiscoveries(),personal:[],logs:[],badges:{},quests:{viewed:0,claimed:[],pending:null},settings:{sound:true,language:'ko'}}}
function load(){
  const base=blank();
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY))||{};
    const savedSettings=saved.settings&&typeof saved.settings==='object'?saved.settings:{};
    return {
      ...base,
      ...saved,
      discoveries:{...starterDiscoveries(),...(isRecord(saved.discoveries)?saved.discoveries:{})},
      personal:Array.isArray(saved.personal)?saved.personal:[],
      logs:Array.isArray(saved.logs)?saved.logs:[],
      badges:normalizeBadges(saved.badges),
      quests:{viewed:Number(saved.quests?.viewed)||0,claimed:Array.isArray(saved.quests?.claimed)?saved.quests.claimed:[],pending:saved.quests?.pending||null},
      settings:{...base.settings,...savedSettings,language:normalizeLanguage(savedSettings.language)},
    };
  }catch{return base}
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function language(){return normalizeLanguage(state.settings?.language)}
function t(key,vars={}){
  const current=language();
  const raw=I18N[current]?.[key]??I18N.ko[key]??key;
  return raw.replace(/\{(\w+)\}/g,(_,name)=>String(vars[name]??`{${name}}`));
}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function br(key,vars={}){return esc(t(key,vars)).replace(/\n/g,'<br>')}
function itemName(item){
  const index=Number(item?.id?.slice(1))-1;
  return ITEM_NAMES[language()]?.[index]??ITEM_NAMES.ko[index]??'';
}
function categoryName(id){return CATEGORY_NAMES[language()]?.[id]??CATEGORY_NAMES.ko[id]??id}
function areaName(areaOrId){
  const id=typeof areaOrId==='string'?areaOrId:areaOrId?.id;
  return AREA_NAMES[language()]?.[id]??AREA_NAMES.ko[id]??id??'';
}
function rarityName(id){return RARITY_NAMES[language()]?.[id]??RARITY_NAMES.ko[id]??id}
function isAreaExclusive(id){return ORIGINAL_EXCLUSIVE_IDS.has(id)}
function badgeRequiredIds(area){
  return BADGE_REQUIREMENTS[area.id]||[...new Set(area.items)].filter(id=>OFFICIAL.some(item=>item.id===id));
}
function badgeProgress(area){
  const requiredIds=badgeRequiredIds(area);
  const foundIds=requiredIds.filter(id=>itemFoundInArea(id,area.id));
  const complete=requiredIds.length>0&&foundIds.length===requiredIds.length;
  const storedBadge=state.badges?.[area.id];
  return {
    requiredIds,
    foundIds,
    found:foundIds.length,
    total:requiredIds.length,
    complete,
    earned:Boolean(complete&&storedBadge?.criteriaVersion===BADGE_CRITERIA_VERSION),
  };
}
function itemFoundInArea(id,areaId){
  const discovery=state.discoveries[id];
  if(!discovery)return false;
  if(discovery.areaId===areaId)return true;
  return discoveryCopies(id).some(copy=>copy.areaId===areaId);
}
function badgeEarnedDate(requiredIds){
  return requiredIds.map(id=>state.discoveries[id]?.date).filter(Boolean).sort().at(-1)||today();
}
(){
  if(!isRecord(state.badges))state.badges={};
  const newlyEarned=[];
  AREAS.forEach(area=>{
    const progress=badgeProgress(area);
    if(progress.complete&&!progress.earned){
      const previous=state.badges[area.id];
      state.badges[area.id]={earnedAt:previous?.earnedAt||badgeEarnedDate(progress.requiredIds),criteriaVersion:BADGE_CRITERIA_VERSION};
      if(!previous)newlyEarned.push(area.id);
    }else if(!progress.complete&&state.badges[area.id]){
      delete state.badges[area.id];
    }
  });
  return newlyEarned;
}
function found(){return Object.keys(state.discoveries).filter(id=>OFFICIAL.some(item=>item.id===id)).length}
function categoryFoundCount(category){return OFFICIAL.filter(item=>item.category===category&&state.discoveries[item.id]).length}
function areaFoundCount(areaId){return OFFICIAL.filter(item=>state.discoveries[item.id]?.areaId===areaId).length}
function discoveryCopies(id){return Array.isArray(state.discoveries[id]?.copies)?state.discoveries[id].copies:[]}
function duplicateCopies(){return Object.entries(state.discoveries).flatMap(([id,d])=>discoveryCopies(id).map((copy,index)=>({id,index,copy,item:OFFICIAL.find(x=>x.id===id)}))).filter(x=>x.item)}
function percent(){return Math.round(found()/OFFICIAL.length*100)}
function today(){return new Date().toISOString().slice(0,10)}
function formatNumber(value){try{return new Intl.NumberFormat(language()).format(value)}catch{return String(value)}}
function formatDate(value){
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value||'');
  if(!match)return value||'';
  const date=new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3])));
  try{return new Intl.DateTimeFormat(language(),{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(date)}catch{return value}
}
function isLegacySystemMemo(value=''){
  return /^(생명|랜드마크|조형물|자연) 도감에 기록된(?: 부산 바다의)? 발견입니다\.$/.test(value);
}
function officialLocation(record){
  if(record?.areaId&&AREA_NAMES.ko[record.areaId])return areaName(record.areaId);
  const legacyId=LEGACY_AREA_IDS[record?.location];
  if(legacyId)return areaName(legacyId);
  if(!record?.location||record.location==='부산 바다')return t('common.busanSea');
  return record.location;
}
function officialMemo(record,item){
  if(record?.memo&&!isLegacySystemMemo(record.memo))return record.memo;
  return t('detail.defaultMemo',{category:categoryName(item.category)});
}
function pixelIcon(icon,label){return `<span class="nav-icon" aria-hidden="true">${icon}</span><span>${esc(label)}</span>`}
function hunterHud(){
  return `<div class="hunter-hud"><span><i aria-hidden="true"></i>${esc(t('hunter.status'))}</span><b>${esc(t('hunter.targets',{found:formatNumber(found()),total:formatNumber(OFFICIAL.length)}))}</b></div>`;
}
function shell(content,nav=true){return `<main class="screen">${hunterHud()}${content}</main>${nav?bottomNav():''}`}
function bottomNav(){
  const items=[['guide','▦','nav.guide'],['camera','▣','nav.camera'],['home','⌂','nav.home'],['badges','◆','nav.badges'],['map','⌖','nav.map']];
  return `<nav class="bottom-nav" aria-label="${esc(t('nav.aria'))}">${items.map(([id,icon,key])=>`<button class="nav-item ${page===id?'active':''}" ${page===id?'aria-current="page"':''} onclick="go('${id}')">${pixelIcon(icon,t(key))}</button>`).join('')}</nav>`;
}
function applyDocumentLanguage(){
  document.documentElement.lang=language();
  document.title=t('meta.title');
}
function render(){
  applyDocumentLanguage();
  const app=document.querySelector('#app');
  if(!state.profile){app.innerHTML=setup();window.scrollTo(0,0);presentIntro();return}
  app.innerHTML=page==='home'?home():page==='map'?mapPage():page==='badges'?badgesPage():page==='guide'?guide():page==='camera'?camera():page==='detail'?detail():settings();
  if(page==='camera'&&cameraStream){
    const video=document.querySelector('#live-camera');
    if(video)video.srcObject=cameraStream;
  }
  window.scrollTo(0,0);
  presentIntro();
}

function presentIntro(){
  if(introPresented)return;
  introPresented=true;
  document.body.insertAdjacentHTML('beforeend',`<div class="app-intro" role="dialog" aria-modal="true" aria-labelledby="app-intro-title"><div class="intro-grid" aria-hidden="true"></div><div class="intro-foliage intro-foliage-left" aria-hidden="true"></div><div class="intro-foliage intro-foliage-right" aria-hidden="true"></div><div class="intro-trail" aria-hidden="true"></div><div class="intro-copy"><span>BOH // EXPEDITION START</span><h1 id="app-intro-title">${esc(t('meta.title'))}</h1><p>${esc(t('intro.tagline'))}</p></div><img src="hunter-mascot.png" alt="" aria-hidden="true"><button onclick="closeIntro()">${esc(t('intro.skip'))}</button></div>`);
}
function closeIntro(){
  const intro=document.querySelector('.app-intro');
  if(!intro)return;
  intro.classList.add('is-leaving');
  setTimeout(()=>intro.remove(),420);
}

function languageOptions(){return LANGUAGE_OPTIONS.map(({code,label})=>`<option value="${code}" lang="${code}" ${language()===code?'selected':''}>${label}</option>`).join('')}
function setup(){
  const options=languageOptions();
  return `<main class="setup"><div class="setup-hud"><span><i aria-hidden="true"></i>${esc(t('hunter.status'))}</span><b>OCEAN // 01</b></div><div class="sea-sprite" aria-hidden="true">⌖</div><p class="eyebrow">${esc(t('setup.eyebrow'))}</p><h1>${esc(t('setup.title'))}</h1><p class="intro">${br('setup.intro')}</p><label class="language-field" for="language-select">${esc(t('language.label'))}<select class="language-select" id="language-select" onchange="changeLanguage(this.value)">${options}</select></label><label for="nickname">${esc(t('setup.nickname'))}<input id="nickname" maxlength="12" value="${esc(setupDraft.nickname)}" placeholder="${esc(t('setup.nicknamePlaceholder'))}"></label><label for="guide-name">${esc(t('setup.guideName'))}<input id="guide-name" maxlength="18" value="${esc(setupDraft.guide)}" placeholder="${esc(t('setup.guidePlaceholder'))}"></label><button class="pixel-btn large" onclick="start()">${esc(t('setup.start'))}</button><small>${esc(t('setup.tagline'))}</small></main>`;
}

function home(){
  const recent=Object.entries(state.discoveries).filter(([id])=>OFFICIAL.some(item=>item.id===id)).sort((a,b)=>(b[1].date||'').localeCompare(a[1].date||'')).slice(0,3);
  const td=state.logs.filter(x=>x.date===today()).length;
  return shell(`<header class="top home-top"><button class="gear" aria-label="${esc(t('aria.settings'))}" title="${esc(t('aria.settings'))}" onclick="go('settings')">⚙</button><p class="eyebrow">${esc(state.profile.guide)}</p><h1>${esc(t('home.explorationLog',{nickname:state.profile.nickname}))}</h1></header>${homeIntroPanel()}${questPanel()}${gachaPanel()}<section><div class="section-title"><h2>${esc(t('home.recent'))}</h2><span>${esc(t('home.recentCaption'))}</span></div><div class="recent">${recent.length?recent.map(([id,d])=>{const item=OFFICIAL.find(x=>x.id===id);const name=itemName(item);return `<article><img src="${d.photo}" alt="${esc(name)}"><b>${esc(name)}</b><small>${esc(formatDate(d.date))}</small></article>`}).join(''):`<div class="empty">${br('home.emptyRecent')}</div>`}</div></section><section class="today"><span aria-hidden="true">✦</span><div><b>${esc(t('home.todayDiscovery'))}</b><strong>${formatNumber(td)}</strong></div><button onclick="go('camera')">${esc(t('home.takePhoto'))}</button></section>${questChest?questChestDialog():''}`);
}

function homeIntroPanel(){
  return `<section class="home-intro-panel"><div class="home-intro-copy"><span>BOH // FIELD INTRO</span><h2>${esc(t('meta.title'))}</h2><div class="home-intro-slot" aria-hidden="true"><i></i><i></i><i></i></div></div><img src="hunter-mascot.png" alt="" aria-hidden="true"></section>`;
}

function collectionDashboard(){
  const td=state.logs.filter(x=>x.date===today()).length;
  return `<section class="hero home-dashboard guide-dashboard"><div class="hero-stat"><p>${esc(t('home.collectionRate'))}</p><strong>${formatNumber(found())} <i>/</i> ${formatNumber(OFFICIAL.length)}</strong><b>${esc(t('home.complete',{percent:formatNumber(percent())}))}</b></div><div class="progress progress-large"><span style="width:${percent()}%"></span></div><div class="home-metrics"><article><b>${formatNumber(td)}</b><span>${esc(t('home.metricToday'))}</span></article><article><b>${formatNumber(Object.keys(state.badges||{}).length)}</b><span>${esc(t('home.metricBadges'))}</span></article><article><b>${formatNumber(duplicateCopies().length)}</b><span>${esc(t('home.metricDuplicates'))}</span></article></div></section>`;
}

function currentQuestIndex(){return Math.min(state.quests?.viewed||0,QUESTS.length-1)}
function currentQuest(){return QUESTS[currentQuestIndex()]}
function questPanel(){
  const quest=currentQuest();
  const complete=quest.done();
  return `<section class="quest-card ${complete?'is-complete':''}"><div><p>${esc(t('quest.eyebrow'))}</p><h2>${esc(t(quest.titleKey))}</h2><span>${esc(t(quest.hintKey))}</span></div><button onclick="touchQuest()">${esc(t(complete?'quest.claimReward':'quest.check'))}</button></section>`;
}
function touchQuest(){
  const quest=currentQuest();
  if(!quest.done())return;
  const claimed=new Set(state.quests.claimed||[]);
  if(!claimed.has(quest.id)){
    claimed.add(quest.id);
    state.quests.claimed=[...claimed];
    state.quests.pending=quest.id;
    questChest={questId:quest.id,opened:null,rewardId:null,misses:shuffle([0,1,2]).slice(0,2)};
    save();
    render();
    return;
  }
  if(state.quests.viewed<QUESTS.length-1){
    state.quests.viewed+=1;
    save();
    render();
  }
}
function questChestDialog(){
  return `<div class="chest-backdrop"><section class="chest-dialog"><p>${esc(t('quest.clearEyebrow'))}</p><h2>${esc(t('quest.chooseChest'))}</h2><div class="chests">${[0,1,2].map(i=>`<button class="chest ${questChest.opened===i?'open':''}" ${questChest.opened===null?`onclick="openQuestChest(${i})"`:'disabled'}>${esc(t(questChest.opened===i?(questChest.rewardId?'quest.fieldGuide':'quest.miss'):'quest.chest'))}</button>`).join('')}</div>${questChest.opened!==null?`<strong>${esc(questChest.rewardId?t('quest.rewardAcquired',{item:itemName(OFFICIAL.find(x=>x.id===questChest.rewardId))}):t('quest.missMessage'))}</strong><button class="pixel-btn" onclick="finishQuestChest()">${esc(t('quest.close'))}</button>`:''}</section></div>`;
}
function openQuestChest(index){
  const rewardPool=OFFICIAL.filter(item=>!state.discoveries[item.id]);
  const isMiss=questChest.misses.includes(index)||!rewardPool.length;
  questChest.opened=index;
  if(!isMiss){
    const item=rewardPool[Math.floor(Math.random()*rewardPool.length)];
    state.discoveries[item.id]={photo:rewardPlaceholder('quest'),date:today(),areaId:null,copies:[]};
    state.logs.unshift({id:item.id,date:today(),type:'quest'});
    questChest.rewardId=item.id;
    playEffect();
  }
  reconcileBadges();
  save();
  render();
}
function finishQuestChest(){
  questChest=null;
  if(state.quests.viewed<QUESTS.length-1)state.quests.viewed+=1;
  state.quests.pending=null;
  save();
  render();
}
function shuffle(values){return values.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1])}
function rewardPlaceholder(type='quest'){
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;
  const ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  ctx.fillStyle=type==='gacha'?'#17204a':'#0a5775';
  ctx.fillRect(0,0,320,320);
  ctx.fillStyle='#fff9e8';
  ctx.fillRect(64,64,192,192);
  ctx.fillStyle=type==='gacha'?'#ffcf4a':'#27b9b3';
  ctx.fillRect(80,80,160,160);
  ctx.fillStyle='#06395c';
  ctx.fillRect(96,96,128,128);
  if(type==='gacha'){
    ctx.fillStyle='#ffcf4a';
    ctx.fillRect(92,132,136,56);
    ctx.fillRect(112,112,96,96);
    ctx.fillStyle='#e65f49';
    ctx.fillRect(92,132,68,56);
    ctx.fillStyle='#fff9e8';
    ctx.fillRect(154,132,12,56);
  }else{
    ctx.fillStyle='#f5cf87';
    ctx.fillRect(104,122,112,82);
    ctx.fillStyle='#8a4f2b';
    ctx.fillRect(94,108,132,30);
    ctx.fillRect(112,92,96,24);
    ctx.fillStyle='#fff9e8';
    ctx.fillRect(150,146,20,20);
    ctx.fillStyle='#06395c';
    ctx.fillRect(156,152,8,20);
  }
  return canvas.toDataURL('image/png');
}

function gachaPanel(){
  const dups=duplicateCopies();
  const odds=gachaOdds(Math.max(1,gachaSelection.length));
  const tierOdds=odds.map((value,index)=>t('gacha.tierOdds',{count:formatNumber(index+1),percent:formatNumber(value)})).join(', ');
  return `<section class="gacha-card"><div class="section-title"><h2>${esc(t('gacha.title'))}</h2><span>${esc(t('gacha.duplicateCount',{count:formatNumber(dups.length)}))}</span></div><p>${esc(t('gacha.description'))}</p>${dups.length?`<div class="dupe-list">${dups.map(d=>`<button class="${gachaSelection.some(x=>x.id===d.id&&x.index===d.index)?'on':''}" onclick="toggleGacha('${d.id}',${d.index})"><img src="${d.copy.photo}" alt="${esc(itemName(d.item))}"><b>${esc(itemName(d.item))}</b><small>${esc(formatDate(d.copy.date))}</small></button>`).join('')}</div><p class="odds">${esc(t('gacha.selectedOdds',{count:formatNumber(gachaSelection.length),odds:tierOdds}))}</p><button class="pixel-btn full" ${gachaSelection.length?'onclick="runGacha()"':'disabled'}>${esc(t('gacha.run'))}</button>`:`<div class="empty">${esc(t('gacha.empty'))}</div>`}</section>`;
}
function gachaOdds(count){
  const tables={1:[70,20,7,2.9,.1],2:[50,30,15,4,1],3:[38,31,20,8,3],4:[28,29,25,12,6],5:[20,25,27,18,10]};
  return tables[Math.min(count,5)]||[15,22,28,20,15];
}
function toggleGacha(id,index){
  const exists=gachaSelection.some(x=>x.id===id&&x.index===index);
  gachaSelection=exists?gachaSelection.filter(x=>!(x.id===id&&x.index===index)):[...gachaSelection,{id,index}];
  render();
}
function runGacha(){
  const pool=OFFICIAL.filter(item=>!state.discoveries[item.id]);
  if(!pool.length){alert(t('gacha.allCollected'));return}
  const odds=gachaOdds(gachaSelection.length);
  const roll=Math.random()*100;
  let acc=0,count=1;
  for(let i=0;i<odds.length;i++){acc+=odds[i];if(roll<=acc){count=i+1;break}}
  const rewards=shuffle(pool).slice(0,Math.min(count,pool.length));
  const consume=new Map(gachaSelection.map(x=>[`${x.id}:${x.index}`,true]));
  Object.entries(state.discoveries).forEach(([id,d])=>{
    if(Array.isArray(d.copies))d.copies=d.copies.filter((_,index)=>!consume.has(`${id}:${index}`));
  });
  rewards.forEach(item=>{
    state.discoveries[item.id]={photo:rewardPlaceholder('gacha'),date:today(),areaId:null,copies:[]};
    state.logs.unshift({id:item.id,date:today(),type:'gacha'});
  });
  gachaSelection=[];
  reconcileBadges();
  save();
  playEffect();
  showDiscovery(t('gacha.reward',{count:formatNumber(rewards.length)}));
}

function areaItemChip(item){
  const exclusive=isAreaExclusive(item.id);
  const label=exclusive?t('map.exclusiveItem'):'';
  return `<span class="${exclusive?'area-exclusive':''}" ${exclusive?`title="${esc(label)}"`:''}>${esc(itemName(item))}${exclusive?`<small>${esc(label)}</small>`:''}</span>`;
}
function mapPage(){
  const area=selectedArea||AREAS[0];
  const translatedArea=areaName(area);
  const areaFound=area.items.filter(id=>state.discoveries[id]).length;
  const hasExclusive=area.items.some(isAreaExclusive);
  const googleMapsUrl=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(area.mapQuery)}`;
  const areaLogs=state.logs.filter(log=>state.discoveries[log.id]?.areaId===area.id).slice(0,6);
  return shell(`<header class="top"><p class="eyebrow">${esc(t('map.eyebrow'))}</p><h1>${esc(t('map.title'))}</h1></header><div class="pixel-map"><div class="land"><span>${esc(t('map.busan'))}</span><small>${esc(t('map.coast'))}</small></div>${AREAS.map((x,i)=>`<button class="map-pin p${i} ${area.id===x.id?'selected':''}" aria-pressed="${area.id===x.id}" onclick="selectArea(${i})"><i></i><span>${esc(areaName(x))}</span></button>`).join('')}<div class="waves" aria-hidden="true">≈ ≈ ≈ ≈ ≈</div></div><section class="area-card"><p>📍 ${esc(translatedArea)}</p><h2>${esc(t('map.areaGuide'))}</h2><div class="area-count"><b>${formatNumber(areaFound)} / ${formatNumber(area.items.length)}</b><span>${esc(t('map.discovered'))}</span></div><p>${esc(t('map.availableItems'))}</p>${hasExclusive?`<p class="exclusive-legend"><i aria-hidden="true"></i>${esc(t('map.exclusiveLegend'))}</p>`:''}<div class="chips">${area.items.map(id=>OFFICIAL.find(x=>x.id===id)).filter(Boolean).map(areaItemChip).join('')}</div><p class="map-availability-note">${esc(t('map.availabilityNote'))}</p><a class="map-shortcut" href="${esc(googleMapsUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t('map.openGoogleMapsAria',{area:translatedArea}))}"><span aria-hidden="true">⌖</span>${esc(t('map.openGoogleMaps'))}<span aria-hidden="true">↗</span></a></section><section class="area-card area-log-card"><p>${esc(t('map.photoLogEyebrow'))}</p><h2>${esc(t('map.photoLogTitle',{area:translatedArea}))}</h2>${areaLogs.length?`<div class="area-log-list">${areaLogs.map(log=>{const item=OFFICIAL.find(x=>x.id===log.id);const d=state.discoveries[log.id];return `<article><img src="${d.photo}" alt="${esc(itemName(item))}"><div><b>${esc(itemName(item))}</b><small>${esc(formatDate(log.date))} · ${esc(t(`logType.${log.type}`))}</small></div></article>`}).join('')}</div>`:`<div class="empty">${esc(t('map.emptyPhotoLog'))}</div>`}</section>`);
}

function badgeEmblem(area,earned){
  const meta=BADGE_META[area.id];
  const sprite=BADGE_SPRITES[area.id];
  const spriteStyle=sprite?`style="--badge-x:${sprite.x};--badge-y:${sprite.y}"`:'';
  return `<div class="badge-emblem-wrap" aria-hidden="true"><div class="badge-emblem badge-${area.id} ${earned?'is-earned':'is-locked'} ${sprite?'badge-image':''}" ${spriteStyle}><span class="badge-glyph">${meta.glyph}</span></div><span class="badge-stars">${'★'.repeat(meta.stars)}</span></div>`;
}
function badgeItemList(items,found){
  if(!items.length)return `<p class="badge-detail-empty">${esc(t(found?'badges.noneEarned':'badges.noneMissing'))}</p>`;
  return `<ul class="badge-detail-list">${items.map(item=>`<li class="${found?'is-found':'is-missing'}"><span aria-hidden="true">${found?'✓':'○'}</span><div><b>${esc(itemName(item))}</b><small>${esc(categoryName(item.category))}</small></div></li>`).join('')}</ul>`;
}
function badgeDetail(area){
  const progress=badgeProgress(area);
  const requiredItems=progress.requiredIds.map(id=>OFFICIAL.find(item=>item.id===id)).filter(Boolean);
  const earnedItems=requiredItems.filter(item=>state.discoveries[item.id]);
  const missingItems=requiredItems.filter(item=>!state.discoveries[item.id]);
  const translatedArea=areaName(area);
  return `<div class="badge-detail-backdrop"><section class="badge-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="badge-detail-title"><button class="badge-detail-close" data-badge-close aria-label="${esc(t('badges.close'))}" title="${esc(t('badges.close'))}" onclick="closeBadgeArea()">×</button><div class="badge-detail-head">${badgeEmblem(area,progress.earned)}<div><p>${esc(t('badges.detailEyebrow'))}</p><h2 id="badge-detail-title">${esc(t('badges.detailTitle',{area:translatedArea}))}</h2><strong>${esc(t('badges.progress',{found:formatNumber(progress.found),total:formatNumber(progress.total)}))}</strong></div></div><div class="badge-detail-columns"><section><h3><span aria-hidden="true">✓</span>${esc(t('badges.earnedItems'))} <small>${formatNumber(earnedItems.length)}</small></h3>${badgeItemList(earnedItems,true)}</section><section><h3><span aria-hidden="true">○</span>${esc(t('badges.missingItems'))} <small>${formatNumber(missingItems.length)}</small></h3>${badgeItemList(missingItems,false)}</section></div></section></div>`;
}
function badgesPage(){
  const earnedCount=AREAS.filter(area=>badgeProgress(area).earned).length;
  const total=AREAS.length;
  const summaryPercent=Math.round(earnedCount/total*100);
  return shell(`<header class="top badge-head"><p class="eyebrow">${esc(t('badges.eyebrow'))}</p><h1>${esc(t('badges.title'))}</h1><p class="badge-intro">${esc(t('badges.intro'))}</p></header><section class="badge-summary"><b>${esc(t('badges.summary',{earned:formatNumber(earnedCount),total:formatNumber(total)}))}</b><div class="badge-summary-bar" role="progressbar" aria-label="${esc(t('badges.summary',{earned:formatNumber(earnedCount),total:formatNumber(total)}))}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${earnedCount}"><span style="width:${summaryPercent}%"></span></div>${earnedCount===total?`<strong>${esc(t('badges.allEarned'))}</strong>`:''}</section><section class="badge-grid">${AREAS.map(area=>{
    const progress=badgeProgress(area);
    const translatedArea=areaName(area);
    const progressText=t('badges.progress',{found:formatNumber(progress.found),total:formatNumber(progress.total)});
    const status=progress.earned?t('badges.earned'):t('badges.inProgress');
    return `<article class="badge-card ${progress.earned?'is-earned':'is-locked'}" aria-label="${esc(t('badges.cardAria',{area:translatedArea,found:formatNumber(progress.found),total:formatNumber(progress.total),status,stars:formatNumber(BADGE_META[area.id].stars)}))}"><button class="badge-emblem-button" data-badge-id="${area.id}" aria-label="${esc(t('badges.viewItems',{area:translatedArea}))}" onclick="openBadgeArea('${area.id}')">${badgeEmblem(area,progress.earned)}<span>${esc(t('badges.viewItemsShort'))}</span></button><h2>${esc(t('badges.badgeName',{area:translatedArea}))}</h2><b class="badge-status">${esc(status)}</b><p>${esc(progressText)}</p><div class="badge-card-bar" role="progressbar" aria-label="${esc(progressText)}" aria-valuemin="0" aria-valuemax="${progress.total}" aria-valuenow="${progress.found}"><span style="width:${Math.round(progress.found/progress.total*100)}%"></span></div>${progress.earned?`<small>${esc(t('badges.earnedOn',{date:formatDate(state.badges[area.id].earnedAt)}))}</small>`:''}</article>`;
  }).join('')}</section>${selectedBadgeAreaId?badgeDetail(AREAS.find(area=>area.id===selectedBadgeAreaId)||AREAS[0]):''}`);
}

function guide(){
  const cats=activeCat==='all'?CATEGORY_IDS:[activeCat];
  const hasSpecial=state.personal.length>0;
  const special=hasSpecial?t('guide.specialTitle',{nickname:state.profile.nickname}):'?';
  return shell(`<header class="guide-head"><div><p class="eyebrow">${esc(t('guide.eyebrow'))}</p><h1>${esc(state.profile.guide)}</h1></div></header>${collectionDashboard()}<div class="tabs"><button class="${activeCat==='all'?'on':''}" onclick="cat('all')">${esc(t('guide.all'))}</button>${CATEGORY_IDS.map(id=>`<button class="${activeCat===id?'on':''}" onclick="cat('${id}')">${esc(categoryName(id))}</button>`).join('')}<button class="${activeCat==='personal'?'on':''} ${hasSpecial?'':'locked-tab'}" ${hasSpecial?`onclick="cat('personal')"`:'disabled'}>${esc(special)}</button></div>${activeCat==='personal'?personalGuide():cats.map(id=>`<section class="guide-section"><div class="section-title"><h2>${esc(categoryName(id))}</h2><span>${formatNumber(OFFICIAL.filter(x=>x.category===id&&state.discoveries[x.id]).length)}/${formatNumber(OFFICIAL.filter(x=>x.category===id).length)}</span></div><div class="card-grid">${OFFICIAL.filter(x=>x.category===id).map(card).join('')}</div></section>`).join('')}`);
}
function card(item){
  const discovery=state.discoveries[item.id];
  const name=itemName(item);
  return discovery?`<article class="guide-card found" onclick="openOfficial('${item.id}')"><img src="${discovery.photo}" alt="${esc(name)}"><span class="rarity ${item.rarity}">${esc(rarityName(item.rarity))}</span><b>${esc(name)}</b></article>`:`<article class="guide-card locked" onclick="openOfficial('${item.id}')"><div class="silhouette">?</div><b>${esc(name)}</b></article>`;
}
function personalGuide(){
  return `<section class="guide-section"><div class="section-title"><h2>✨ ${esc(t('guide.specialTitle',{nickname:state.profile.nickname}))}</h2><span>${esc(t('guide.specialCount',{count:formatNumber(state.personal.length)}))}</span></div>${state.personal.length?`<div class="card-grid">${state.personal.map(item=>`<article class="guide-card found" onclick="openPersonal('${item.id}')"><img src="${item.photo}" alt="${esc(item.name)}"><span class="rarity PERSONAL">${esc(t('badge.new'))}</span><b>${esc(item.name)}</b></article>`).join('')}</div>`:`<div class="empty">${esc(t('guide.emptySpecial'))}</div>`}</section>`;
}

function detail(){
  if(!selectedCard)return guide();
  const personal=selectedCard.type==='personal';
  const item=personal?state.personal.find(x=>x.id===selectedCard.id):OFFICIAL.find(x=>x.id===selectedCard.id);
  if(!item)return guide();
  const discovery=personal?item:state.discoveries[item.id];
  const name=personal?item.name:itemName(item);
  if(!discovery)return shell(`<header class="detail-head"><button aria-label="${esc(t('aria.back'))}" onclick="go('guide')">←</button><p class="eyebrow">${esc(t('detail.fieldGuide'))}</p></header><section class="detail-locked"><div>?</div><h1>${esc(name)}</h1><p>${esc(t('detail.locked'))}</p></section>`);
  const photos=personal?[discovery]:[discovery,...discoveryCopies(item.id)];
  const activePhoto=photos[Math.min(detailPhotoIndex,photos.length-1)]||discovery;
  const location=personal?(discovery.location||t('common.busanSea')):officialLocation(discovery);
  const memo=personal?(discovery.memo||t('detail.defaultMemo',{category:t('common.specialCategory')})):officialMemo(discovery,item);
  const badge=personal?t('detail.specialBadge'):rarityName(item.rarity);
  return shell(`<header class="detail-head"><button aria-label="${esc(t('aria.back'))}" onclick="go('guide')">←</button><p class="eyebrow">${esc(personal?t('detail.specialDiscovery'):t('detail.fieldGuide'))}</p></header><section class="detail-found"><div class="photo-carousel"><img src="${activePhoto.photo}" alt="${esc(name)}">${photos.length>1?`<button class="photo-prev" onclick="moveDetailPhoto(-1)">‹</button><button class="photo-next" onclick="moveDetailPhoto(1)">›</button><b>${formatNumber(detailPhotoIndex+1)} / ${formatNumber(photos.length)}</b>`:''}</div><div class="detail-copy"><span class="rarity ${personal?'PERSONAL':item.rarity}">${esc(badge)}</span><h1>${esc(name)}</h1><dl><dt>${esc(t('detail.location'))}</dt><dd>${esc(location)}</dd><dt>${esc(t('detail.discoveryDate'))}</dt><dd>${esc(formatDate(activePhoto.date||discovery.date))}</dd><dt>${esc(t('detail.info'))}</dt><dd>${esc(memo)}</dd></dl></div></section>`);
}
function moveDetailPhoto(delta){
  if(!selectedCard||selectedCard.type!=='official')return;
  const total=1+discoveryCopies(selectedCard.id).length;
  detailPhotoIndex=(detailPhotoIndex+delta+total)%total;
  render();
}

function camera(){
  if(specialForm)return shell(`<header class="top"><p class="eyebrow">${esc(t('camera.specialEyebrow'))}</p><h1>${esc(t('camera.specialTitle'))}</h1><p class="hint">${esc(t('camera.specialHint'))}</p></header><section class="special-form">${draftPhoto?`<img src="${draftPhoto}" alt="${esc(t('camera.newPhotoAlt'))}">`:''}<label for="special-name">${esc(t('camera.targetName'))}<input id="special-name" maxlength="24" placeholder="${esc(t('camera.targetPlaceholder'))}"></label><label for="special-location">${esc(t('camera.discoveryLocation'))}<input id="special-location" maxlength="30" value="${esc(selectedArea?areaName(selectedArea):t('common.busanSea'))}"></label><label for="special-memo">${esc(t('camera.memo'))}<input id="special-memo" maxlength="80" placeholder="${esc(t('camera.memoPlaceholder'))}"></label><button class="pixel-btn full" onclick="savePersonal()">${esc(t('camera.recordSpecial'))}</button><button class="text-btn" onclick="cancelPersonal()">${esc(t('camera.cancelSpecial'))}</button></section>`);
  return shell(`<header class="top"><p class="eyebrow">${esc(t('camera.eyebrow'))}</p><h1>${esc(t('camera.title'))}</h1><p class="hint">${esc(t('camera.hint'))}</p></header><section class="camera-area-select"><label for="camera-area">${esc(t('camera.areaLabel'))}</label><select id="camera-area" onchange="setCameraArea(this.value)"><option value="">${esc(t('camera.areaPlaceholder'))}</option>${AREAS.map(area=>`<option value="${area.id}" ${selectedArea?.id===area.id?'selected':''}>${esc(areaName(area))}</option>`).join('')}</select></section><section class="camera-box">${draftPhoto?`<img class="preview" src="${draftPhoto}" alt="${esc(t('camera.selectedPhotoAlt'))}"><button class="change-photo" onclick="resetCamera()">${esc(t('camera.changePhoto'))}</button>`:cameraStream?`<video id="live-camera" autoplay muted playsinline aria-label="${esc(t('camera.livePreview'))}"></video>`:`<div class="camera-empty"><span aria-hidden="true">▣</span><b>${esc(t('camera.prompt'))}</b><small>${esc(t('camera.liveOnly'))}</small></div>`}</section>${aiResult?analysisResult():draftPhoto?`<button class="pixel-btn large full" onclick="runAnalysis()">${esc(t('camera.analyze'))}</button>`:cameraStream?`<button class="pixel-btn large full" onclick="capturePhoto()">${esc(t('camera.capture'))}</button>`:`<button class="pixel-btn large full" onclick="startLiveCamera()">${esc(t('camera.openCamera'))}</button>`}<p class="camera-note">${esc(t('camera.disclaimer'))}</p>`);
}
function analysisResult(){
  if(aiResult.loading)return `<section class="analyzing"><span aria-hidden="true">⌛</span><b>${esc(t('analysis.loading'))}</b><i>${esc(t('analysis.searching'))}</i></section>`;
  if(aiResult.match)return `<section class="result success"><span aria-hidden="true">✦</span><p>${esc(t('analysis.found'))}</p><h2>${esc(itemName(aiResult.item))}</h2><strong class="match-confidence">${esc(t('analysis.match',{confidence:formatNumber(aiResult.confidence)}))}</strong><small>${esc(selectedArea?t('analysis.matchArea',{area:areaName(selectedArea)}):t('analysis.matchAll'))}</small><div><button class="pixel-btn" onclick="confirmOfficial()">${esc(t('analysis.yes'))}</button><button class="ghost-btn no-btn" onclick="personalForm()">${esc(t('analysis.no'))}</button><button class="ghost-btn" onclick="resetCamera()">${esc(t('analysis.reselect'))}</button></div></section>`;
  return `<section class="result"><span aria-hidden="true">?</span><p>${br('analysis.noMatch')}</p><button class="pixel-btn" onclick="personalForm()">${esc(t('analysis.recordPersonal'))}</button></section>`;
}
function settings(){
  const profile=settingsDraft||state.profile;
  return shell(`<header class="top"><p class="eyebrow">${esc(t('settings.eyebrow'))}</p><h1>${esc(t('settings.title'))}</h1></header><section class="settings"><label class="language-field" for="settings-language-select">${esc(t('language.label'))}<select class="language-select" id="settings-language-select" onchange="changeLanguage(this.value)">${languageOptions()}</select></label><label for="edit-nickname">${esc(t('settings.nickname'))}<input id="edit-nickname" value="${esc(profile.nickname)}" maxlength="12"></label><label for="edit-guide">${esc(t('settings.guideName'))}<input id="edit-guide" value="${esc(profile.guide)}" maxlength="18"></label><label class="sound-toggle"><input type="checkbox" ${state.settings.sound!==false?'checked':''} onchange="toggleSound(this.checked)"><span>${esc(t('settings.sound'))}</span></label><button class="pixel-btn full" onclick="updateProfile()">${esc(t('settings.save'))}</button><hr><p>${esc(t('settings.storageNotice'))}</p><button class="text-btn" onclick="resetAll()">${esc(t('settings.reset'))}</button></section>`);
}

function go(nextPage){if(nextPage!=='camera')stopLiveCamera();if(page==='settings'&&nextPage!=='settings')settingsDraft=null;if(nextPage!=='badges')selectedBadgeAreaId=null;page=nextPage;render()}
function cat(category){activeCat=category;render()}
function selectArea(index){selectedArea=AREAS[index];render()}
function setCameraArea(id){selectedArea=AREAS.find(area=>area.id===id)||null;render()}
function openBadgeArea(id){selectedBadgeAreaId=id;render();requestAnimationFrame(()=>document.querySelector('[data-badge-close]')?.focus())}
function closeBadgeArea(){const id=selectedBadgeAreaId;selectedBadgeAreaId=null;render();requestAnimationFrame(()=>document.querySelector(`[data-badge-id="${id}"]`)?.focus())}
function openOfficial(id){selectedCard={type:'official',id};detailPhotoIndex=0;page='detail';render()}
function openPersonal(id){selectedCard={type:'personal',id};page='detail';render()}
function changeLanguage(value){
  const changingInSettings=Boolean(state.profile&&page==='settings');
  if(changingInSettings){
    settingsDraft={
      nickname:document.querySelector('#edit-nickname')?.value??state.profile.nickname,
      guide:document.querySelector('#edit-guide')?.value??state.profile.guide,
    };
  }else{
    setupDraft={nickname:document.querySelector('#nickname')?.value||'',guide:document.querySelector('#guide-name')?.value||''};
  }
  state.settings.language=normalizeLanguage(value);
  save();
  render();
  requestAnimationFrame(()=>document.querySelector(changingInSettings?'#settings-language-select':'#language-select')?.focus());
}
function start(){
  const nickname=document.querySelector('#nickname').value.trim();
  const guideName=document.querySelector('#guide-name').value.trim();
  if(!nickname||!guideName)return alert(t('setup.required'));
  state.profile={nickname,guide:guideName};
  setupDraft={nickname:'',guide:''};
  save();
  render();
}
function updateProfile(){
  state.profile.nickname=document.querySelector('#edit-nickname').value.trim()||state.profile.nickname;
  state.profile.guide=document.querySelector('#edit-guide').value.trim()||state.profile.guide;
  settingsDraft=null;
  save();
  go('home');
}
function toggleSound(enabled){
  state.settings.sound=Boolean(enabled);
  save();
  if(!bgmAudio)initAudio();
  if(enabled)bgmAudio?.play().catch(()=>{});
  else bgmAudio?.pause();
}
function resetAll(){
  if(confirm(t('settings.resetConfirm'))){
    localStorage.removeItem(STORAGE_KEY);
    state=blank();
    page='home';
    activeCat='all';
    selectedArea=null;
    selectedCard=null;
    setupDraft={nickname:'',guide:''};
    settingsDraft=null;
    render();
  }
}
async function startLiveCamera(){
  if(!navigator.mediaDevices?.getUserMedia){alert(t('camera.unavailable'));return}
  try{
    cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:960}},audio:false});
    render();
    const video=document.querySelector('#live-camera');
    if(video)video.srcObject=cameraStream;
  }catch(error){cameraStream=null;alert(t('camera.permissionDenied'))}
}
function stopLiveCamera(){
  cameraStream?.getTracks().forEach(track=>track.stop());
  cameraStream=null;
}
function capturePhoto(){
  const video=document.querySelector('#live-camera');
  if(!video||video.readyState<2){alert(t('camera.notReady'));return}
  const canvas=document.createElement('canvas');
  const max=900;
  const scale=Math.min(1,max/Math.max(video.videoWidth,video.videoHeight));
  canvas.width=Math.max(1,Math.round(video.videoWidth*scale));
  canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
  canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
  draftPhoto=canvas.toDataURL('image/jpeg',.82);
  capturedAt=Date.now();
  stopLiveCamera();
  render();
}
async function runAnalysis(){
  if(!draftPhoto||!capturedAt||Date.now()-capturedAt>5*60*1000){aiResult={match:false,reason:'stale'};render();return}
  aiResult={loading:true};render();
  aiResult=await analyzeImage(draftPhoto);render();
}
function resize(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      const image=new Image();
      image.onload=()=>{
        const max=900;
        const scale=Math.min(1,max/Math.max(image.width,image.height));
        const canvas=document.createElement('canvas');
        canvas.width=image.width*scale;
        canvas.height=image.height*scale;
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg',.78));
      };
      image.src=reader.result;
    };
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}
async function analyzeImage(image){
  const fingerprint=await imageFingerprint(image);
  if(capturedFingerprints.has(fingerprint))return {match:false,reason:'duplicate'};
  capturedFingerprints.add(fingerprint);
  try{
    const response=await fetch(ANALYSIS_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,areaId:selectedArea?.id||null,capturedAt})});
    if(!response.ok)throw new Error('analysis unavailable');
    const result=await response.json();
    const confidence=Number(result.confidence)||0;
    const runnerUp=Number(result.runnerUpConfidence)||0;
    const item=OFFICIAL.find(candidate=>candidate.id===result.itemId);
    if(!item||confidence<MIN_MATCH_CONFIDENCE||confidence-runnerUp<MIN_MATCH_MARGIN||result.isUnknown===true)return {match:false,confidence};
    if(selectedArea&&!selectedArea.items.includes(item.id)&&AREA_ITEM_COUNTS[item.id]<=1)return {match:false,confidence};
    return {match:true,item,confidence:Math.round(confidence)};
  }catch(error){
    return {match:false,reason:'unavailable'};
  }
}
async function imageFingerprint(dataUrl){
  const bytes=new TextEncoder().encode(dataUrl.slice(dataUrl.indexOf(',')+1));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].slice(0,12).map(value=>value.toString(16).padStart(2,'0')).join('');
}
function confirmOfficial(){
  const item=aiResult.item;
  const existing=state.discoveries[item.id];
  if(existing){
    const dates=new Set([existing.date,...discoveryCopies(item.id).map(copy=>copy.date)]);
    if(dates.has(today())){
      alert(t('discovery.sameDayDuplicate'));
      draftPhoto=null;
      aiResult=null;
      go('guide');
      return;
    }
    existing.copies=[...discoveryCopies(item.id),{photo:draftPhoto,date:today(),areaId:selectedArea?.id||null}];
    state.logs.unshift({id:item.id,date:today(),type:'duplicate'});
    const newlyEarned=reconcileBadges();
    save();
    showDiscovery(t('discovery.duplicateCard',{item:itemName(item)}),newlyEarned);
    draftPhoto=null;
    aiResult=null;
    return;
  }
  state.discoveries[item.id]={photo:draftPhoto,date:today(),areaId:selectedArea?.id||null,copies:[]};
  state.logs.unshift({id:item.id,date:today(),type:'official'});
  const newlyEarned=reconcileBadges();
  save();
  showDiscovery(itemName(item),newlyEarned);
  draftPhoto=null;
  aiResult=null;
}
function showDiscovery(name,newlyEarned=[]){
  playEffect();
  const earnedAreas=newlyEarned.map(id=>AREAS.find(area=>area.id===id)).filter(Boolean);
  const badgeContent=earnedAreas.length?`<div class="earned-badge-list"><b>${esc(t('badges.unlockEyebrow'))}</b>${earnedAreas.map(area=>`<div class="earned-badge-row">${badgeEmblem(area,true)}<strong>${esc(t('badges.unlockTitle',{area:areaName(area)}))}</strong></div>`).join('')}</div>`:'';
  const destination=earnedAreas.length?'badges':'guide';
  const buttonLabel=earnedAreas.length?t('badges.viewBadges'):t('discovery.recorded');
  document.body.insertAdjacentHTML('beforeend',`<div class="discovery-pop" role="dialog" aria-modal="true" aria-labelledby="discovery-title"><span aria-hidden="true">✦</span><b>${esc(t('discovery.new'))}</b><strong id="discovery-title">${esc(name)}</strong>${badgeContent}<button data-discovery-close onclick="this.parentElement.remove();go('${destination}')">${esc(buttonLabel)}</button></div>`);
  requestAnimationFrame(()=>document.querySelector('[data-discovery-close]')?.focus());
}
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  if(selectedBadgeAreaId){closeBadgeArea();return}
  const popup=document.querySelector('.discovery-pop');
  if(popup){popup.remove();go('guide')}
});
function resetCamera(){stopLiveCamera();draftPhoto=null;capturedAt=null;aiResult=null;specialForm=false;render()}
function personalForm(){specialForm=true;render()}
function cancelPersonal(){specialForm=false;render()}
function savePersonal(){
  const name=document.querySelector('#special-name').value.trim();
  if(!name){alert(t('validation.targetRequired'));return}
  const location=document.querySelector('#special-location').value.trim()||t('common.busanSea');
  const memo=document.querySelector('#special-memo').value.trim();
  state.personal.unshift({id:'p'+Date.now(),name,location,memo,photo:draftPhoto,date:today(),ai:aiResult});
  state.logs.unshift({id:'personal',date:today(),type:'personal'});
  save();
  specialForm=false;
  draftPhoto=null;
  aiResult=null;
  showDiscovery(name);
}

function initAudio(){
  if(bgmAudio)return;
  bgmAudio=new Audio(ASSETS.bgm);
  bgmAudio.loop=true;
  bgmAudio.volume=.42;
  const unlock=()=>{if(state.settings?.sound!==false)bgmAudio.play().catch(()=>{});document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock)};
  document.addEventListener('pointerdown',unlock);
  document.addEventListener('keydown',unlock);
}
function playEffect(){
  if(state.settings?.sound===false)return;
  const audio=new Audio(ASSETS.effect);
  audio.volume=.78;
  audio.play().catch(()=>{});
}

initAudio();
render();
