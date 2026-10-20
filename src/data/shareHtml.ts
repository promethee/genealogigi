import type { ShareModel } from "./shareModel.ts";

/** JSON that is safe inside a <script> element: no closing tag, comment or line-separator surprises. */
export function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll(" ", "\\u2028")
    .replaceAll(" ", "\\u2029");
}

const escapeHtml = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const STYLE = `
:root{--bg:#f7f8fb;--surface:#fff;--fg:#0f172a;--muted:#55627a;--line:#e3e7ef;--accent:#047857;--hover:#eef2f7;--edge:#94a3b8;--partner:#8b5cf6}
@media (prefers-color-scheme:dark){:root{--bg:#070d19;--surface:#0e1627;--fg:#eef2f9;--muted:#98a4bb;--line:#1c2740;--accent:#34d399;--hover:#16213a;--edge:#64748b;--partner:#a78bfa}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;gap:.6rem 1rem;align-items:center;padding:.8rem 1rem;background:var(--surface);border-bottom:1px solid var(--line)}
h1{font-size:1.15rem;margin:0}
#count{color:var(--muted);font-size:.9rem}
#search{flex:1;min-width:12rem;max-width:26rem;padding:.55rem .8rem;border:1px solid var(--line);border-radius:.6rem;background:var(--bg);color:var(--fg);font:inherit}
main{display:grid;grid-template-columns:minmax(14rem,22rem) 1fr;gap:1rem;max-width:72rem;margin:0 auto;padding:1rem}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:.9rem}
#list{list-style:none;margin:0;padding:.3rem;max-height:calc(100vh - 7rem);overflow:auto}
#list button{display:flex;gap:.7rem;align-items:center;width:100%;padding:.55rem .6rem;border:0;border-radius:.6rem;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}
#list button:hover,#list button[aria-current=true]{background:var(--hover)}
.av{flex:none;display:grid;place-items:center;width:2.4rem;height:2.4rem;border-radius:50%;font-weight:700;font-size:.9rem;overflow:hidden;background-size:cover}
.av img{width:100%;height:100%;object-fit:cover}
.sub{display:block;color:var(--muted);font-size:.82rem}
#card{padding:1.3rem}
#card .top{display:flex;gap:1rem;align-items:center;margin-bottom:1rem}
#card .av{width:4.2rem;height:4.2rem;font-size:1.3rem}
h2{margin:0;font-size:1.5rem;line-height:1.2}
h3{margin:1.3rem 0 .4rem;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.notes{white-space:pre-wrap}
.photos{display:flex;flex-wrap:wrap;gap:.5rem}
.photos img{height:6rem;border-radius:.5rem;cursor:zoom-in}
a.rel{color:var(--accent);font-weight:600;text-decoration:none;cursor:pointer}
a.rel:hover{text-decoration:underline}
.note{color:var(--muted);margin-left:.4rem;font-size:.85rem}
ul.plain{margin:0;padding:0;list-style:none}
.tl li{display:grid;grid-template-columns:8rem 1fr;gap:.6rem;padding:.25rem 0;border-bottom:1px solid var(--line)}
.tl .when{color:var(--muted)}
#back{display:none;margin-bottom:.8rem}
button.btn{padding:.4rem .8rem;border:1px solid var(--line);border-radius:.5rem;background:var(--surface);color:inherit;font:inherit;cursor:pointer}
#big{position:fixed;inset:0;display:none;place-items:center;background:rgba(0,0,0,.8);cursor:zoom-out;z-index:5}
#big img{max-width:92vw;max-height:92vh;border-radius:.6rem}
#views{display:flex;gap:.3rem}
#views button[aria-pressed=true]{background:var(--hover);border-color:var(--accent);color:var(--accent);font-weight:600}
#treeview{display:none;max-width:72rem;margin:0 auto;padding:1rem}
body.tree-view main{display:none}
body.tree-view #treeview{display:block}
#treebar{display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center;margin-bottom:.6rem;color:var(--muted);font-size:.85rem}
#treebox{overflow:auto;border:1px solid var(--line);border-radius:.9rem;background:var(--surface);max-height:calc(100vh - 11rem)}
#treebox svg{display:block;margin:0 auto}
.tn{cursor:pointer}
.tn rect{fill:var(--surface);stroke:var(--line);stroke-width:1.5}
.tn:hover rect,.tn.cur rect{stroke:var(--accent);stroke-width:2.5}
.tn text{fill:var(--fg);font:500 13px system-ui,sans-serif}
.tn text.s{fill:var(--muted);font-size:11px;font-weight:400}
.te{fill:none;stroke:var(--edge);stroke-width:2;stroke-linejoin:round}
.te.d{stroke-dasharray:5 4}
.tp{stroke:var(--partner);stroke-width:3;stroke-linecap:round}
.key{display:inline-flex;align-items:center;gap:.3rem}
footer{max-width:72rem;margin:0 auto;padding:1rem;color:var(--muted);font-size:.85rem}
@media (max-width:760px){main{grid-template-columns:1fr}#list{max-height:none}body.viewing #listpanel{display:none}body:not(.viewing) #cardpanel{display:none}#back{display:inline-block}.tl li{grid-template-columns:1fr}}
@media print{header,#back,#listpanel,footer,#treebar{display:none}main{display:block}body.tree-view #treebox{max-height:none}}
`;

const SCRIPT = `
(function(){
var model=JSON.parse(document.getElementById("data").textContent);
var people=model.people,byId={};
people.forEach(function(p){byId[p.id]=p});
var $=function(id){return document.getElementById(id)};
function norm(s){return s.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase()}
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function safeImg(src){return typeof src==="string"&&/^data:image\\/(jpeg|png|webp);base64,/.test(src)}
function avatar(p){
  var a=el("span","av");
  if(p.photos.length&&safeImg(p.photos[0].src)){var i=document.createElement("img");i.src=p.photos[0].src;i.alt="";a.appendChild(i)}
  else{a.textContent=p.initials;a.style.background=p.tint+"33";a.style.color=p.ink}
  return a}
var haystack={};
people.forEach(function(p){haystack[p.id]=norm([p.name,p.life,p.notes].join(" "))});
function show(id){location.hash=id?"p="+encodeURIComponent(id):"people"}
function renderList(){
  var words=norm($("search").value).split(/\\s+/).filter(Boolean);
  var shown=people.filter(function(p){return words.every(function(w){return haystack[p.id].indexOf(w)>=0})});
  var ul=$("list");ul.textContent="";
  if(!shown.length){ul.appendChild(el("li","sub",model.labels.none));return}
  var current=shownId();
  shown.forEach(function(p){
    var li=document.createElement("li"),b=document.createElement("button");
    b.appendChild(avatar(p));
    var t=el("span");t.appendChild(document.createTextNode(p.name));
    if(p.life)t.appendChild(el("span","sub",p.life));
    b.appendChild(t);
    if(p.id===current)b.setAttribute("aria-current","true");
    b.onclick=function(){show(p.id)};
    li.appendChild(b);ul.appendChild(li)})}
function link(r){
  var s=el("span");
  var a=el("a","rel",r.name);a.href="#p="+encodeURIComponent(r.id);s.appendChild(a);
  if(r.note)s.appendChild(el("span","note",r.note));
  return s}
var twoPanes=window.matchMedia("(min-width:761px)");
/** The person on the card: the one in the address, else (list and card side by side) the one seen last, else the first. */
function shownId(){
  var c=currentId();if(c)return c;
  if(!twoPanes.matches||!people.length)return null;
  return lastId&&byId[lastId]?lastId:people[0].id}
function currentId(){var m=/^#p=(.+)$/.exec(location.hash);return m?decodeURIComponent(m[1]):null}
function renderCard(){
  var id=shownId(),p=id&&byId[id],c=$("card");c.textContent="";
  document.body.classList.toggle("viewing",!!(p&&currentId()));
  if(!p){c.appendChild(el("p","sub",model.labels.people));return}
  var back=el("button","btn",model.labels.back);back.id="back";back.onclick=function(){if(navigated)history.back();else show(null)};c.appendChild(back);
  var top=el("div","top");top.appendChild(avatar(p));
  var h=el("div");h.appendChild(el("h2","",p.name));if(p.life)h.appendChild(el("span","sub",p.life));
  top.appendChild(h);c.appendChild(top);
  if(p.notes){c.appendChild(el("h3","",model.labels.notes));c.appendChild(el("p","notes",p.notes))}
  if(p.photos.length){
    var box=el("div","photos");
    p.photos.forEach(function(ph){
      if(!safeImg(ph.src))return;
      var i=document.createElement("img");i.src=ph.src;i.alt=ph.caption;i.title=ph.caption;
      i.onclick=function(){var b=$("big");b.textContent="";var big=document.createElement("img");big.src=ph.src;big.alt=ph.caption;b.appendChild(big);b.style.display="grid"};
      box.appendChild(i)});
    c.appendChild(box)}
  p.groups.forEach(function(g){
    c.appendChild(el("h3","",g.label));
    var ul=el("ul","plain");
    g.items.forEach(function(r){var li=document.createElement("li");li.appendChild(link(r));ul.appendChild(li)});
    c.appendChild(ul)});
  if(p.timeline.length){
    c.appendChild(el("h3","",model.labels.timeline));
    var tl=el("ul","plain tl");
    p.timeline.forEach(function(e){
      var li=document.createElement("li");li.appendChild(el("span","when",e.when));
      var what=el("span");what.appendChild(document.createTextNode(e.text));
      e.people.forEach(function(r){what.appendChild(document.createTextNode(" "));what.appendChild(link(r))});
      li.appendChild(what);tl.appendChild(li)});
    c.appendChild(tl)}
  c.parentNode.scrollTop=0;window.scrollTo(0,0)}
var T=model.tree,SW=190,BW=170,BH=50,LH=90,PAD=16,NS="http://www.w3.org/2000/svg";
var natW=PAD*2+Math.max(0,T.slots-1)*SW+BW,natH=PAD*2+Math.max(0,T.levels-1)*LH+BH;
function svgEl(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
function setScale(s){var svg=$("treesvg");svg.setAttribute("width",Math.round(natW*s));svg.setAttribute("height",Math.round(natH*s))}
function fit(){setScale(Math.min(1,Math.max(.35,($("treebox").clientWidth-2)/natW)))}
function clip(s,n){return s.length>n?s.slice(0,n-1)+"\u2026":s}
var drawn=false,lastId=null,navigated=false;
function drawTree(){
  var svg=$("treesvg");svg.setAttribute("viewBox","0 0 "+natW+" "+natH);
  var defs=svgEl("defs",{},svg),cp=svgEl("clipPath",{id:"avc",clipPathUnits:"objectBoundingBox"},defs);svgEl("circle",{cx:.5,cy:.5,r:.5},cp);
  var pos={};T.nodes.forEach(function(n){pos[n.id]={x:PAD+n.slot*SW,y:PAD+n.level*LH}});
  T.edges.forEach(function(e){
    var a=pos[e.from],b=pos[e.to];if(!a||!b)return;
    var x1=a.x+BW/2,y1=a.y,x2=b.x+BW/2,y2=b.y+BH,mid=(y1+y2)/2;
    svgEl("path",{"class":"te"+(e.dashed?" d":""),d:"M "+x1+" "+y1+" V "+mid+" H "+x2+" V "+y2},svg)});
  T.partners.forEach(function(c){
    var a=pos[c.a],b=pos[c.b];if(!a||!b)return;
    var l=a.x<=b.x?a:b,r=a.x<=b.x?b:a;
    svgEl("line",{"class":"tp",x1:l.x+BW,x2:r.x,y1:l.y+BH/2,y2:l.y+BH/2},svg)});
  T.nodes.forEach(function(n){
    var p=pos[n.id],g=svgEl("g",{"class":"tn","data-id":n.id,transform:"translate("+p.x+" "+p.y+")"},svg);
    svgEl("title",{},g).textContent=n.name;
    svgEl("rect",{width:BW,height:BH,rx:10},g);
    svgEl("circle",{cx:BH/2,cy:BH/2,r:18,fill:n.tint+"33"},g);
    var who=byId[n.id],pic=who&&who.photos.length&&safeImg(who.photos[0].src)?who.photos[0].src:null;
    if(pic){svgEl("image",{"class":"pic",href:pic,x:BH/2-18,y:BH/2-18,width:36,height:36,preserveAspectRatio:"xMidYMid slice","clip-path":"url(#avc)"},g)}
    else{var i=svgEl("text",{x:BH/2,y:BH/2+4,"text-anchor":"middle",fill:n.ink},g);i.textContent=n.initials;i.style.fill=n.ink}
    svgEl("text",{x:BH+4,y:n.life?21:BH/2+4},g).textContent=clip(n.name,17);
    if(n.life)svgEl("text",{"class":"s",x:BH+4,y:38},g).textContent=clip(n.life,22);
    g.onclick=function(){show(n.id)}});
  drawn=true}
function treeView(){var h=location.hash;return h===""||h==="#"||h==="#tree"} // the tree is the default view
function renderViews(){
  var tv=treeView();
  document.body.classList.toggle("tree-view",tv);
  $("v-people").setAttribute("aria-pressed",String(!tv));
  $("v-tree").setAttribute("aria-pressed",String(tv));
  if(tv&&!drawn){drawTree();fit()}
  var cur=currentId();if(cur)lastId=cur;cur=lastId; // the person opened last stays marked in the tree
  Array.prototype.forEach.call(document.querySelectorAll(".tn"),function(g){g.classList.toggle("cur",g.getAttribute("data-id")===cur)})}
function sync(){renderViews();renderList();renderCard()}
$("v-people").textContent=model.labels.people;
$("v-tree").textContent=model.labels.tree;
$("v-people").onclick=function(){location.hash="people"};
$("v-tree").onclick=function(){location.hash="tree"};
$("fit").textContent=model.labels.fit;$("fit").onclick=fit;
$("actual").textContent=model.labels.actualSize;$("actual").onclick=function(){setScale(1)};
$("k-conf").textContent=model.labels.legendConfirmed;
$("k-other").textContent=model.labels.legendOther;
$("k-partner").textContent=model.labels.legendPartners;
$("search").oninput=renderList;
$("big").onclick=function(){this.style.display="none"};
window.addEventListener("hashchange",function(){navigated=true;sync()});
if(twoPanes.addEventListener)twoPanes.addEventListener("change",sync);
document.title=model.title;
$("count").textContent=model.labels.count;
sync();
})();
`;

/** One self-contained HTML file: data, styles and viewer inline, no network, read-only. */
export function renderShareHtml(model: ShareModel): string {
  const title = escapeHtml(model.title);
  return `<!doctype html>
<html lang="${escapeHtml(model.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="Genealogigi">
<title>${title}</title>
<style>${STYLE}</style>
</head>
<body>
<header>
<h1>${title}</h1>
<span id="count"></span>
<nav id="views"><button class="btn" id="v-people" type="button" aria-pressed="true"></button><button class="btn" id="v-tree" type="button" aria-pressed="false"></button></nav>
<input id="search" type="search" placeholder="${escapeHtml(model.labels.search)}" aria-label="${escapeHtml(model.labels.search)}">
</header>
<main>
<section class="panel" id="listpanel"><ul id="list"></ul></section>
<section class="panel" id="cardpanel"><div id="card"></div></section>
</main>
<section id="treeview">
<div id="treebar">
<button class="btn" id="fit" type="button"></button>
<button class="btn" id="actual" type="button"></button>
<span class="key"><svg width="28" height="6"><line x1="0" y1="3" x2="28" y2="3" stroke="var(--edge)" stroke-width="2"/></svg><span id="k-conf"></span></span>
<span class="key"><svg width="28" height="6"><line x1="0" y1="3" x2="28" y2="3" stroke="var(--edge)" stroke-width="2" stroke-dasharray="5 3"/></svg><span id="k-other"></span></span>
<span class="key"><svg width="28" height="6"><line x1="0" y1="3" x2="28" y2="3" stroke="var(--partner)" stroke-width="3"/></svg><span id="k-partner"></span></span>
</div>
<div id="treebox"><svg id="treesvg" xmlns="http://www.w3.org/2000/svg" role="img"></svg></div>
</section>
<footer>${escapeHtml(model.labels.footer)} · ${escapeHtml(model.generated)}</footer>
<div id="big" role="dialog" aria-label="photo"></div>
<script type="application/json" id="data">${safeJson(model)}</script>
<script>${SCRIPT}</script>
</body>
</html>
`;
}
