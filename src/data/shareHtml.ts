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
:root{--bg:#f7f8fb;--surface:#fff;--fg:#0f172a;--muted:#55627a;--line:#e3e7ef;--accent:#047857;--hover:#eef2f7}
@media (prefers-color-scheme:dark){:root{--bg:#070d19;--surface:#0e1627;--fg:#eef2f9;--muted:#98a4bb;--line:#1c2740;--accent:#34d399;--hover:#16213a}}
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
footer{max-width:72rem;margin:0 auto;padding:1rem;color:var(--muted);font-size:.85rem}
@media (max-width:760px){main{grid-template-columns:1fr}#list{max-height:none}body.viewing #listpanel{display:none}body:not(.viewing) #cardpanel{display:none}#back{display:inline-block}.tl li{grid-template-columns:1fr}}
@media print{header,#back,#listpanel,footer{display:none}main{display:block}}
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
function show(id){location.hash=id?"p="+encodeURIComponent(id):""}
function renderList(){
  var words=norm($("search").value).split(/\\s+/).filter(Boolean);
  var shown=people.filter(function(p){return words.every(function(w){return haystack[p.id].indexOf(w)>=0})});
  var ul=$("list");ul.textContent="";
  if(!shown.length){ul.appendChild(el("li","sub",model.labels.none));return}
  var current=currentId();
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
function currentId(){var m=/^#p=(.+)$/.exec(location.hash);return m?decodeURIComponent(m[1]):null}
function renderCard(){
  var id=currentId(),p=id&&byId[id],c=$("card");c.textContent="";
  document.body.classList.toggle("viewing",!!p);
  if(!p){c.appendChild(el("p","sub",model.labels.people));return}
  var back=el("button","btn",model.labels.back);back.id="back";back.onclick=function(){show(null)};c.appendChild(back);
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
function sync(){renderList();renderCard()}
$("search").oninput=renderList;
$("big").onclick=function(){this.style.display="none"};
window.addEventListener("hashchange",sync);
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
<input id="search" type="search" placeholder="${escapeHtml(model.labels.search)}" aria-label="${escapeHtml(model.labels.search)}">
</header>
<main>
<section class="panel" id="listpanel"><ul id="list"></ul></section>
<section class="panel" id="cardpanel"><div id="card"></div></section>
</main>
<footer>${escapeHtml(model.labels.footer)} · ${escapeHtml(model.generated)}</footer>
<div id="big" role="dialog" aria-label="photo"></div>
<script type="application/json" id="data">${safeJson(model)}</script>
<script>${SCRIPT}</script>
</body>
</html>
`;
}
