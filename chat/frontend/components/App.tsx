"use client";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, CircleHelp, GraduationCap, Layers3, LogOut, Menu, Moon, Plus, Route, Sparkles, Sun, UserRound, X } from "lucide-react";
import { AppContext, api, isPreview, logoSrc, NavLink, post, setToken } from "@/lib/client";
import { PathData, Profile } from "@/lib/types";
import Brain from "./Brain";
import { Auth, Setup, ProfilePage, Mailbox } from "./Forms";
import Studio from "./Studio";
import Player from "./Player";

function Footer() { return <footer className="public-footer"><span>© {new Date().getFullYear()} Dattesh Sukhadia</span><span>Made for the curious. <a href="https://www.linkedin.com/in/dattesh-sukhadia" target="_blank" rel="noreferrer">Meet the founder <ArrowUpRight size={14}/></a></span></footer>; }
function Brand({small=false}:{small?:boolean}) {return <span className={`brand ${small?"small":""}`}><img src={logoSrc} alt="Official Manthan Ed-Tech logo" width={small?28:36} height={small?28:36}/><span>Manthan{!small&&<small>Tech Fundamentals Uncovered.</small>}</span></span>;}
function Marketing({demo,busy,error}:{demo:()=>void;busy:boolean;error:string}) {
  const {config,go}=useAppLocal();
  return <><main id="main" className="marketing">
    <div className="marketing-topline"><span className="eyebrow"><span className="status-dot"/> A little curiosity goes a long way</span><span className="text-muted small-copy">A new way to understand technology</span></div>
    <section className="marketing-hero">
      <div className="hero-copy"><h1>Big ideas.<br/>Made to <span>click.</span></h1><p>From “wait, what?” to “now I get it.”<br/>Turn your questions into animated tutorials,<br className="desktop-only"/> at a level that makes sense to you.</p>
        <div className="hero-actions"><NavLink to="/signup" className="button primary">Start your learning path <ArrowRight size={18}/></NavLink>{config.demoEnabled&&<button className="button text-button" onClick={demo} disabled={busy}>{busy?"Opening the studio…":"Explore the demo"} <ArrowUpRight size={17}/></button>}</div>
        {error&&<p className="error" role="alert">{error}</p>}
        <div className="hero-footnote"><Check size={15}/> No API key needed <span>·</span> Your pace. Your starting point.</div>
      </div>
      <div className="hero-preview"><div className="preview-top"><span><Sparkles size={15}/> Your next lightbulb moment</span><span className="mini-tag">LEARNING STUDIO</span></div><Brain large/><div className="preview-caption"><span className="eyebrow">MAKE THE CONNECTION</span><h2>A question is a great place to start.</h2><p>We’ll help you connect the dots.</p></div><button className="preview-prompt" onClick={()=>config.demoEnabled?demo():go("/signup")} disabled={busy}><span>How does a neural network actually learn?</span><ArrowRight size={18}/></button></div>
    </section>
    <div className="pillar-strip"><span>SIX FIELDS. ENDLESS CONNECTIONS.</span><div>Artificial intelligence <i/> Machine learning <i/> Data engineering <i/> Fintech <i/> Medtech <i/> Quantum computing</div></div>
    <section className="how-section"><div><span className="eyebrow">LESS SCROLLING. MORE UNDERSTANDING.</span><h2>Make it part of what you know.</h2><p>Not another tab you’ll get back to.<br/>A small lesson that moves you forward.</p></div><ol className="how-list"><li><span>01</span><div><h3>Bring your curiosity.</h3><p>Ask a question, upload your notes, or practice a method.</p></div></li><li><span>02</span><div><h3>See the idea come together.</h3><p>Watch animated scenes, listen, and follow the script.</p></div></li><li><span>03</span><div><h3>Make the knowledge yours.</h3><p>Pass a short quiz and add the topic to your learning path.</p></div></li></ol></section>
    <section className="blog-callout"><BookOpen size={25}/><div><h3>Still love a good read?</h3><p>The original Manthan blog isn’t going anywhere.</p></div><a href="https://www.manthan.education" target="_blank" rel="noreferrer" className="button secondary">Blog home <ArrowUpRight size={16}/></a></section>
  </main><Footer/></>;
}

function PathPage() {
  const {path,go}=useAppLocal();
  const [filter,setFilter]=useState("all");
  const complete=path?.items.filter(i=>i.status==="completed").length||0;
  const items=path?.items.filter(i=>filter==="all"||i.status===filter)||[];
  return <main id="main" className="page-content"><div className="page-top"><span className="eyebrow">ONE CONNECTION AT A TIME</span><span className="mini-tag"><span className="status-dot"/> Active learning path</span></div><div className="page-heading"><div><h1>Your learning path</h1><p>Proof of progress. Built by your curiosity.</p></div><button className="button primary" onClick={()=>go("/learn")}><Plus size={17}/> New tutorial</button></div>
    <div className="path-overview"><div><span className="eyebrow">YOUR NORTH STAR</span><h2>{path?.goal||"Keep asking good questions."}</h2><p>Finish a tutorial, check your understanding, and make it part of your path.</p></div><div className="path-stat"><strong>{complete}<span> / {path?.items.length||0}</span></strong><span>topics completed</span><div className="progress-track"><span style={{width:`${100*complete/Math.max(1,path?.items.length||0)}%`}}/></div></div></div>
    <div className="tabs" role="group" aria-label="Filter learning path">{[["all","All topics"],["in_progress","In progress"],["completed","Completed"]].map(([value,label])=><button key={value} className={filter===value?"selected":""} onClick={()=>setFilter(value)}>{label} <span>{value==="all"?path?.items.length||0:path?.items.filter(i=>i.status===value).length||0}</span></button>)}</div>
    {!path?<div className="loading-block">Loading your path…</div>:items.length===0?<div className="empty-state"><Route size={32}/><h2>{path.items.length?"Nothing here just yet.":"Your path is empty."}</h2><p>{path.items.length?"Try another filter or start a new tutorial.":"Your path is empty. Generate a tutorial, finish the quiz, and it will land here."}</p><button className="button primary" onClick={()=>go("/learn")}>Explore an idea <ArrowRight size={16}/></button></div>:<div className="path-timeline">{items.map((item)=><article key={item.id} className="path-row"><div className={`timeline-mark ${item.status==="completed"?"done":""}`}>{item.status==="completed"?<Check size={17}/>:<span/>}</div><div className="path-topic"><div className="topic-meta"><span className="tag">{item.lesson.pillar}</span><span>{item.lesson.level}</span></div><h2>{item.lesson.title}</h2><div className="topic-meta"><span>{new Date(item.completedAt||item.lesson.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span><span>·</span><span>{item.lesson.attachments.length?item.lesson.attachments.map(f=>f.kind==="notes"?"PDF notes":"Assignment").join(" + "):"From a question"}</span></div></div><div className="path-outcome"><span className={item.status==="completed"?"success-label":"text-muted"}>{item.status==="completed"?"Completed":"In progress"}</span><small>{item.latestScore!==null?`Latest quiz: ${item.latestScore}%`:"Quiz not yet passed"}</small><button onClick={()=>go(`/learn/${item.lesson.id}`)}>{item.status==="completed"?"Revisit tutorial":"Continue learning"} <ArrowRight size={15}/></button></div></article>)}</div>}
    <div className="quiet-note"><CircleHelp size={16}/><span>A watched tutorial is a start. A passing quiz is what marks it complete.</span></div>
  </main>;
}
// Keep page components on the same app context without an additional router.
import { useApp as useAppLocal } from "@/lib/client";

function Institution() {
  const {config}=useAppLocal();
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState("");
  useEffect(()=>{if(config.institutionPreview)api("institution").then(setData).catch(e=>setError(e.message));},[config.institutionPreview]);
  return <main id="main" className="page-content"><span className="eyebrow">INSTITUTIONS · EARLY PREVIEW</span><div className="institution-intro"><GraduationCap size={40}/><h1>Coming when we partner<br/>with institutions.</h1><p>Instructor oversight will arrive through partnerships with schools, universities, and colleges. Today, this is a read-only preview using the demo learner.</p><div className="quiet-note"><Check size={17}/> Learning progress, not surveillance. No live proctoring or screen capture.</div></div>{!config.institutionPreview?<p>This preview is not enabled.</p>:<section className="panel"><div className="section-line"><h2>Learner progress preview</h2><span className="tag">Demo data only</span></div>{error&&<p className="error">{error}</p>}<div className="table-scroll"><table><thead><tr><th>Learner</th><th>Topic</th><th>Status</th><th>Latest quiz</th><th>Completed</th></tr></thead><tbody>{data?.items.map((i:any)=><tr key={i.id}><td>{data.name}</td><td>{i.lesson.title}</td><td>{i.status==="completed"?"Completed":"In progress"}</td><td>{i.latestScore===null?"Not passed":`${i.latestScore}%`}</td><td>{i.completedAt?new Date(i.completedAt).toLocaleDateString():"—"}</td></tr>)}</tbody></table></div></section>}</main>;
}
export default function App() {
  const [mounted,setMounted]=useState(false);
  const [route,setRoute]=useState("/");
  const [user,setUser]=useState<Profile|null>(null);
  const [path,setPath]=useState<PathData|null>(null);
  const [config,setConfig]=useState({institutionPreview:false,devMailbox:false,generationMode:"local",demoEnabled:false});
  const [dark,setDark]=useState(false);
  const [drawer,setDrawer]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  function go(to:string) {
    if(isPreview) window.history.pushState(null,"",`#${to}`); else window.history.pushState(null,"",to);
    setRoute(to);setDrawer(false);window.scrollTo(0,0);
  }
  async function refreshPath() { if(user) { try{setPath(await api<PathData>("path"));}catch{} } }
  useEffect(()=>{
    const read=()=>setRoute(isPreview?(window.location.hash.slice(1)||"/"):window.location.pathname+window.location.search);
    read();
    window.addEventListener("popstate",read);window.addEventListener("hashchange",read);
    api("config").then(setConfig).catch(()=>{});
    api<Profile>("me").then(setUser).catch(()=>{}).finally(()=>setMounted(true));
    return()=>{window.removeEventListener("popstate",read);window.removeEventListener("hashchange",read);};
  },[]);
  useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light";},[dark]);
  useEffect(()=>{if(user?.onboarded)refreshPath();else setPath(null);},[user]);
  const bare=route.split("?")[0];
  const isPublic=["/","/login","/signup","/forgot-password","/reset-password","/dev/mailbox"].includes(bare);
  useEffect(()=>{
    if(!mounted)return;
    if(!isPublic&&!user){go("/login");return;}
    if(user&&!user.onboarded&&!["/onboarding","/reset-password","/dev/mailbox"].includes(bare)){go("/onboarding");return;}
    if(user?.onboarded&&["/","/login","/signup","/onboarding"].includes(bare))go("/learn");
    const name=bare==="/learn"?"Learning studio":bare==="/path"?"Your learning path":bare==="/profile"?"Your profile":bare==="/signup"?"Start learning":bare==="/login"?"Welcome back":"Tech Fundamentals Uncovered";
    document.title=`${name} | Manthan`;
  },[mounted,user,bare]);
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(e.key==="Escape")setDrawer(false);};window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn);},[]);
  async function demo() {setBusy(true);setError("");try{const data=await api("auth/login",post({email:"ada@manthan.education",password:"ManthanDemo!"}));setToken(data.token);setUser(data.user);go("/learn");}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function logout() {try{await api("auth/logout",post({}));}finally{setToken("");setUser(null);setPath(null);go("/");}}
  const shell=!!user&&user.onboarded&&!isPublic&&bare!=="/onboarding";
  const complete=path?.items.filter(i=>i.status==="completed").length||0;
  const state={user,setUser,route,go,path,refreshPath,config};
  if(!mounted) return <div className="initial-loading"><img src={logoSrc} alt="Manthan" width={48} height={48}/><span>Making room for curiosity.</span></div>;
  return <AppContext.Provider value={state}>
    <a href="#main" className="skip-link" onClick={e=>{e.preventDefault();document.getElementById("main")?.focus();}}>Skip to content</a>
    <header className="navbar"><div className="nav-left">{shell&&<button className="icon-button mobile-menu" aria-label={drawer?"Close navigation":"Open navigation"} aria-expanded={drawer} onClick={()=>setDrawer(!drawer)}>{drawer?<X size={20}/>:<Menu size={20}/>}</button>}<NavLink to={user?"/learn":"/"} aria-label="Manthan home"><Brand/></NavLink></div><nav className="nav-right" aria-label="Account navigation">{user?<><NavLink to="/path" className="nav-link desktop-only">Learning path</NavLink><NavLink to="/profile" className="nav-link desktop-only">Profile</NavLink><button className="nav-link desktop-only" onClick={logout}>Log out</button></>:<><NavLink to="/login" className="nav-link">Log in</NavLink><NavLink to="/signup" className="button primary compact">Sign up <ArrowRight size={15}/></NavLink></>}<span className="nav-divider"/><button className="icon-button" title={dark?"Switch to light mode":"Switch to dark mode"} aria-label={dark?"Switch to light mode":"Switch to dark mode"} onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button>{user&&<NavLink to="/profile" className="avatar" aria-label="Your profile">{user.name.slice(0,1).toUpperCase()}</NavLink>}</nav></header>
    {shell&&<>{drawer&&<button className="drawer-backdrop" aria-label="Close navigation" onClick={()=>setDrawer(false)}/>}<aside className={`sidebar ${drawer?"open":""}`}><div className="sidebar-brand"><Brand small/><span className="workspace-label">Your workspace</span></div><nav aria-label="Learning navigation"><NavLink to="/learn" className={`side-link ${bare==="/learn"?"active":""}`}><Plus size={18}/><span>New tutorial</span><span className="side-shortcut"><Sparkles size={13}/></span></NavLink><NavLink to="/path" className={`side-link ${bare==="/path"?"active":""}`}><Route size={18}/><span>Learning path</span><span className="count">{complete}</span></NavLink><NavLink to="/profile" className={`side-link ${bare==="/profile"?"active":""}`}><UserRound size={18}/><span>Profile</span></NavLink></nav><a className="blog-button" href="https://www.manthan.education" target="_blank" rel="noreferrer"><BookOpen size={17}/><span>Blog home</span><ArrowUpRight size={16}/></a>
      <div className="recent"><span className="eyebrow">RECENT EXPLORATIONS</span>{path?.items.slice(0,3).map(item=><NavLink key={item.id} to={`/learn/${item.lesson.id}`} className="recent-link"><span className={`recent-dot ${item.status==="completed"?"complete":""}`}/><span>{item.lesson.title}</span></NavLink>)}{path?.items.length===0&&<p className="small-copy text-muted">Your next good question belongs here.</p>}</div>
      <div className="sidebar-bottom"><div className="growth-card"><div className="section-line"><span>Little steps. Real progress.</span><Layers3 size={16}/></div><div className="progress-track"><span style={{width:`${100*complete/Math.max(1,path?.items.length||0)}%`}}/></div><small>{complete} of {path?.items.length||0} topics completed</small></div>{config.institutionPreview&&<NavLink to="/institution" className="institution-link"><GraduationCap size={16}/> For institutions <span>Preview</span></NavLink>}<button className="sidebar-account" onClick={()=>go("/profile")}><span className="avatar">{user!.name.slice(0,1)}</span><span>{user!.name}<small>Curiosity in progress</small></span><ChevronRight size={16}/></button><button className="mobile-logout" onClick={logout}><LogOut size={16}/>Log out</button></div>
    </aside></>}
    <div className={shell?"app-area":""}>
      {bare==="/"&&!user?<Marketing demo={demo} busy={busy} error={error}/>:["/login","/signup","/forgot-password","/reset-password"].includes(bare)?<><Auth kind={bare} demo={demo} demoBusy={busy} demoError={error}/><Footer/></>:bare==="/dev/mailbox"?<Mailbox/>:!user?<div className="loading-block">Opening your workspace…</div>:bare==="/onboarding"?<Setup/>:bare==="/learn"?<Studio/>:bare.startsWith("/learn/")?<Player key={bare} id={bare.split("/")[2]}/>:bare==="/path"?<PathPage/>:bare==="/profile"?<ProfilePage/>:bare==="/institution"?<Institution/>:<main id="main" className="empty-state"><h1>This page took a wrong turn.</h1><p>Your learning path is still right where you left it.</p><NavLink to="/learn" className="button primary">Back to the studio</NavLink></main>}
    </div>
  </AppContext.Provider>;
}
