/* Medidor de leitura (contraste) pela imagem da tela, usado pelos testes de
   contraste do app do aluno e do torneio da Gestão.
   Esconde as letras, fotografa o fundo de verdade (degradê, vidro, foto) e
   compara cada texto com o fundo que fica atrás dele. Régua WCAG AA: 4,5:1
   para texto normal e 3:1 para texto grande (24 px, ou 18,66 px em negrito).
   Vale o pior pedaço do fundo (20% mais claro/escuro), não a média.
   medir(página, foto?) devolve um item por texto: {t, ratio, minimo, fg, fundo, fs, onde, desativado}. */
async function medir(p,foto){
 // 1) tela alta o bastante para caber a página e a janela aberta inteiras
 for(let i=0;i<2;i++){
  const h=await p.evaluate(()=>{let h=document.documentElement.scrollHeight;
   document.querySelectorAll('.overlay.on .modal,.overlay.on .sheet,.overlay.on').forEach(m=>{h=Math.max(h,m.scrollHeight+120);});return Math.min(9000,Math.max(844,h));});
  await p.setViewportSize({width:390,height:h});await p.waitForTimeout(120);
 }
 if(foto)await p.screenshot({path:foto});
 // 2) textos visíveis (não cobertos por outra camada)
 const itens=await p.evaluate(()=>{
  const out=[],caminho=el=>{const a=[];for(let e=el;e&&e!==document.body&&a.length<4;e=e.parentElement)a.unshift(e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className.trim()?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):''));return a.join(' > ');};
  const opac=el=>{let o=1;for(let e=el;e;e=e.parentElement)o*=Number(getComputedStyle(e).opacity);return o;};
  const visivel=el=>{
   if(el.checkVisibility&&!el.checkVisibility({contentVisibilityAuto:true,visibilityProperty:true}))return false;
   const d=el.closest('details:not([open])');if(d&&!el.closest('summary'))return false;   // grupo fechado não aparece
   for(let e=el;e;e=e.parentElement){const s=getComputedStyle(e);if(s.display==='none'||s.visibility!=='visible'&&s.visibility!=='')return false;}return true;};
  const corteDe=el=>{let c={l:-1e9,t:-1e9,r:1e9,b:1e9};
   for(let e=el;e&&e!==document.documentElement;e=e.parentElement){const s=getComputedStyle(e);
    // o corte é na caixa de dentro da borda (padding box), não na borda
    if(s.overflowX!=='visible'||s.overflowY!=='visible'){const k=e.getBoundingClientRect(),l=k.left+e.clientLeft,t=k.top+e.clientTop;
     c={l:Math.max(c.l,l),t:Math.max(c.t,t),r:Math.min(c.r,l+e.clientWidth),b:Math.min(c.b,t+e.clientHeight)};}}
   return c;};
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode())){
   const t=n.textContent.replace(/\s+/g,' ').trim();if(!t||!/[\p{L}\p{N}]/u.test(t))continue;
   const el=n.parentElement;if(!el||/^(SCRIPT|STYLE|NOSCRIPT|OPTION|TITLE)$/.test(el.tagName)||!visivel(el))continue;
   const op=opac(el);if(op<0.05)continue;
   const r=document.createRange();r.selectNodeContents(n);
   // o que um ancestral com overflow corta não aparece (ex.: 3ª linha de um nome com line-clamp)
   const c=corteDe(el);
   const rects=[...r.getClientRects()].map(x=>{const l=Math.max(x.left,c.l),t=Math.max(x.top,c.t),rr=Math.min(x.right,c.r),b=Math.min(x.bottom,c.b);
     return {left:l,top:t,right:rr,bottom:b,width:rr-l,height:b-t};}).filter(x=>x.width>2&&x.height>4&&x.bottom>0&&x.right>0&&x.left<innerWidth&&x.top<innerHeight);
   if(!rects.length)continue;
   const vis=rects.filter(x=>{const h=document.elementFromPoint(x.left+x.width/2,x.top+x.height/2);return h&&(h===el||el.contains(h)||h.contains(el));});
   if(!vis.length)continue;
   const s=getComputedStyle(el);
   out.push({t:t.slice(0,80),onde:caminho(el),fg:s.webkitTextFillColor,cor:s.color,clip:s.webkitBackgroundClip||s.backgroundClip,fs:parseFloat(s.fontSize),fw:Number(s.fontWeight)||400,op,
    desativado:!!el.closest('button[disabled],input[disabled],select[disabled],[aria-disabled="true"]'),
    rects:vis.map(x=>[Math.round(x.left),Math.round(x.top),Math.round(x.width),Math.round(x.height)])});
  }
  // campos: o que foi digitado, a opção escolhida ou o texto de exemplo
  document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]),textarea,select').forEach(el=>{
   if(!visivel(el))return;const r=el.getBoundingClientRect();if(r.width<20||r.height<14||r.bottom<0||r.top>innerHeight)return;
   const h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);if(!h||!(h===el||el.contains(h)||h.contains(el)))return;
   const s=getComputedStyle(el),exemplo=el.tagName!=='SELECT'&&!el.value;
   const txt=el.tagName==='SELECT'?((el.selectedOptions[0]||{}).text||''):(el.value||el.placeholder||'');if(!txt.trim())return;
   const cs=exemplo?getComputedStyle(el,'::placeholder'):s;
   const x=r.left+parseFloat(s.borderLeftWidth)+parseFloat(s.paddingLeft),y=r.top+parseFloat(s.borderTopWidth)+parseFloat(s.paddingTop);
   const hh=Math.min(r.height-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom),parseFloat(s.fontSize)*1.4);
   out.push({t:(exemplo?'[exemplo no campo] ':'[campo] ')+txt.slice(0,60),onde:caminho(el),fg:cs.webkitTextFillColor,cor:cs.color,clip:'',fs:parseFloat(s.fontSize),fw:Number(s.fontWeight)||400,
    op:opac(el),desativado:el.disabled,rects:[[Math.round(x),Math.round(y+(r.height-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom)-hh)/2),Math.round(Math.min(r.width*0.6,txt.length*parseFloat(s.fontSize)*0.5)),Math.round(hh)]]});
  });
  // 3) esconde todas as letras para fotografar só o fundo
  const ph=document.createElement('style');ph.id='__ph';ph.textContent='html body:not(#a1):not(#a2):not(#a3) *::placeholder{color:transparent!important;-webkit-text-fill-color:transparent!important}';document.head.appendChild(ph);
  window.__estilos=[];
  document.querySelectorAll('*').forEach(e=>{window.__estilos.push([e,e.getAttribute('style')]);
   e.style.setProperty('color','transparent','important');e.style.setProperty('-webkit-text-fill-color','transparent','important');
   e.style.setProperty('text-shadow','none','important');e.style.setProperty('caret-color','transparent','important');});
  return out;
 });
 const png=(await p.screenshot()).toString('base64');
 // 4) compara cada texto com os pixels do fundo atrás dele
 const res=await p.evaluate(async({png,itens})=>{
  window.__estilos.forEach(([e,s])=>{if(s===null)e.removeAttribute('style');else e.setAttribute('style',s);});
  const ph=document.getElementById('__ph');if(ph)ph.remove();
  const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);
  const px=g.getImageData(0,0,c.width,c.height).data;
  const rgb=s=>{const m=String(s).match(/[\d.]+/g);return m?m.map(Number):[0,0,0,1];};
  const lin=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  const lum=(r,g2,b)=>.2126*lin(r)+.7152*lin(g2)+.0722*lin(b);
  const out=[];
  for(const it of itens){
   let fg=rgb(it.fg&&!/^rgba?\(0, 0, 0, 0\)$/.test(it.fg)?it.fg:it.cor);
   if(fg.length<4)fg[3]=1;
   if(fg[3]===0||/text/.test(it.clip)){out.push(Object.assign(it,{ratio:null,nota:'texto em degradê (conferir na foto)'}));continue;}
   const a=fg[3]*it.op,vals=[];let sr=0,sg=0,sb=0,k=0;
   for(const [x,y,w,h] of it.rects){
    const passo=Math.max(1,Math.floor(Math.sqrt(w*h/300)));
    for(let yy=Math.max(0,y);yy<Math.min(c.height,y+h);yy+=passo)for(let xx=Math.max(0,x);xx<Math.min(c.width,x+w);xx+=passo){
     const i=(yy*c.width+xx)*4,br=px[i],bg=px[i+1],bb=px[i+2];
     const fr=fg[0]*a+br*(1-a),fgg=fg[1]*a+bg*(1-a),fb=fg[2]*a+bb*(1-a);
     const l1=lum(fr,fgg,fb),l2=lum(br,bg,bb);vals.push((Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05));
     sr+=br;sg+=bg;sb+=bb;k++;
    }
   }
   if(!vals.length)continue;
   vals.sort((x,y)=>x-y);
   const grande=it.fs>=24||(it.fs>=18.66&&it.fw>=700);
   out.push(Object.assign(it,{ratio:+vals[Math.floor(vals.length*.2)].toFixed(2),min:+vals[0].toFixed(2),
    fundo:'rgb('+[sr,sg,sb].map(v=>Math.round(v/k)).join(',')+')',minimo:grande?3:4.5}));
  }
  return out;
 },{png,itens});
 await p.setViewportSize({width:390,height:844});
 return res;
}

module.exports={medir};
