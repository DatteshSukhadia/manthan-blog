"use client";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Mail, Plus, ShieldCheck, X } from "lucide-react";
import { api, NavLink, post, setToken, useApp } from "@/lib/client";
import { INTERESTS, LEVELS, Level } from "@/lib/types";
import Brain from "./Brain";

function PasswordField({label="Password",name="password",minLength=8}:{label?:string;name?:string;minLength?:number}) {
  const [show,setShow]=useState(false);
  return <label className="field"><span>{label}</span><span className="password-input"><input name={name} type={show?"text":"password"} required minLength={minLength} maxLength={72} autoComplete={name==="current"?"current-password":"new-password"} placeholder={name==="current"?"Your current password":"At least 8 characters"}/><button type="button" aria-label={show?`Hide ${label.toLowerCase()}`:`Show ${label.toLowerCase()}`} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></span></label>;
}
export function Auth({kind,demo,demoBusy,demoError}:{kind:string;demo:()=>void;demoBusy:boolean;demoError:string}) {
  const {setUser,go,route,config}=useApp();
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{setError("");setMessage("");},[kind]);
  const signup=kind==="/signup",login=kind==="/login",forgot=kind==="/forgot-password";
  const title=signup?"A good question changes everything.":login?"Good to see you again.":forgot?"Forgot your password?":"A fresh start.";
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setError("");setMessage("");setBusy(true);
    const form=new FormData(e.currentTarget);
    const body=Object.fromEntries(form);
    try {
      if(!login&&!signup&&!forgot) body.token=new URLSearchParams(route.split("?")[1]||"").get("token")||"";
      const data=await api(`auth/${signup?"signup":login?"login":forgot?"forgot":"reset"}`,post(body));
      if(data.user){setToken(data.token || "");setUser(data.user);go(data.user.onboarded?"/learn":"/onboarding");}
      else setMessage(data.message);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <main id="main" className="auth-layout"><section className="auth-art"><span className="eyebrow">TECH FUNDAMENTALS UNCOVERED.</span><Brain large/><h2>Less memorizing.<br/>More lightbulb moments.</h2><p>Big ideas, broken down. At your pace,<br/>in your own way.</p><div className="auth-art-footer"><span className="status-dot"/> A space for curious minds.</div></section><section className="auth-form-wrap" key={kind}><div className="auth-form"><NavLink to="/" className="back-link"><ArrowLeft size={15}/> Back to Manthan</NavLink><span className="eyebrow">{signup?"YOUR LEARNING STARTS HERE":login?"PICK UP WHERE YOU LEFT OFF":"LET’S GET YOU BACK IN"}</span><h1>{title}</h1><p className="form-intro">{signup?"Create your account. Bring your curiosity.":login?"Your next connection is waiting for you.":forgot?"It happens. Enter your email and we’ll send a reset link.":"Choose a new password for your Manthan account."}</p>
    {message?<div className="success-box" role="status"><Check size={20}/><div><h3>{forgot?"Check your inbox.":"You’re all set."}</h3><p>{message}</p>{forgot&&config.devMailbox&&<NavLink to="/dev/mailbox">Open the development mailbox <ArrowRight size={15}/></NavLink>}{!forgot&&<NavLink to="/login" className="button primary">Back to log in <ArrowRight size={16}/></NavLink>}</div></div>:<form onSubmit={submit}>
      {signup&&<label className="field"><span>Your name</span><input name="name" placeholder="What should we call you?" required maxLength={60} autoComplete="name"/></label>}
      {(signup||login||forgot)&&<label className="field"><span>Email address</span><input name="email" type="email" placeholder="you@example.com" required autoComplete="email"/></label>}
      {!forgot&&<PasswordField minLength={login?1:8} label={signup||login?"Password":"New password"}/>}
      {login&&<div className="forgot-link"><NavLink to="/forgot-password">Forgot password?</NavLink></div>}
      {error&&<p className="error" role="alert">{error}</p>}
      <button type="submit" className="button primary full" disabled={busy}>{busy?"One moment…":signup?"Create your account":login?"Log in":forgot?"Send reset link":"Reset password"}<ArrowRight size={17}/></button>
    </form>}
    {(signup||login)&&<><p className="auth-switch">{signup?"Already have an account?":"New here?"} <NavLink to={signup?"/login":"/signup"}>{signup?"Log in":"Create an account"}</NavLink></p>{config.demoEnabled&&<><div className="or-line"><span>JUST LOOKING AROUND?</span></div><button className="button secondary full" onClick={demo} disabled={demoBusy}>{demoBusy?"Opening the studio…":"Try Ada’s demo workspace"}<ArrowUpRightIcon/></button><p className="demo-credentials">ada@manthan.education <span>·</span> ManthanDemo!</p>{demoError&&<p className="error">{demoError}</p>}</>}</>}
    {forgot&&<NavLink to="/login" className="back-link bottom-back"><ArrowLeft size={15}/> Back to log in</NavLink>}
  </div></section></main>;
}
function ArrowUpRightIcon(){return <ArrowRight size={16} style={{transform:"rotate(-45deg)"}}/>;}
function InterestPicker({values,onChange}:{values:string[];onChange:(v:string[])=>void}) {
  return <fieldset className="interest-field"><legend>Your interests <span>Choose at least one</span></legend><div className="interest-chips">{INTERESTS.map(i=><button key={i} type="button" aria-pressed={values.includes(i)} className={values.includes(i)?"selected":""} onClick={()=>onChange(values.includes(i)?values.filter(v=>v!==i):[...values,i])}>{values.includes(i)?<Check size={14}/>:<Plus size={14}/>} {i}</button>)}</div></fieldset>;
}
function Complexity({value,onChange}:{value:Level;onChange:(v:Level)=>void}) {return <fieldset className="complexity-field"><legend>Default complexity</legend><div className="segmented">{LEVELS.map(l=><button key={l} type="button" className={l===value?"selected":""} aria-pressed={l===value} onClick={()=>onChange(l)}>{l}</button>)}</div><p className="field-help">A starting point, not a label. You can change this for every tutorial.</p></fieldset>;}
export function Setup() {
  const {user,setUser,go}=useApp();
  const [level,setLevel]=useState<Level>(user?.level||"University");
  const [interests,setInterests]=useState<string[]>(user?.interests||[]);
  const [topics,setTopics]=useState<string[]>([]);
  const [topic,setTopic]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  function add(){const text=topic.trim();if(text&&!topics.includes(text)&&topics.length<12){setTopics([...topics,text]);setTopic("");}}
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setError("");
    if(!interests.length){setError("Choose at least one interest.");return;}
    setBusy(true);const data=Object.fromEntries(new FormData(e.currentTarget));
    try{const updated=await api("onboarding",post({...data,level,interests,firstTopics:topics}));setUser(updated);go("/learn");}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <main id="main" className="setup-page"><div className="setup-heading"><span className="eyebrow">A LITTLE ABOUT YOU</span><h1>Let’s find your starting point.</h1><p>No perfect plan needed. Just a direction you’re curious about.</p></div><form className="panel setup-form" onSubmit={submit}><label className="field"><span>What should we call you?</span><input name="name" defaultValue={user?.name} required maxLength={60} placeholder="Your name"/></label><Complexity value={level} onChange={setLevel}/><InterestPicker values={interests} onChange={setInterests}/><label className="field"><span>What would you like to understand?</span><textarea name="goal" required minLength={5} maxLength={300} rows={2} placeholder="I want to understand how a neural net actually learns."/></label><label className="field"><span>First topics <small>Optional</small></span><span className="topic-input"><input value={topic} onChange={e=>setTopic(e.target.value)} maxLength={100} placeholder="e.g. Transformers" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add();}}}/><button type="button" className="icon-button" onClick={add} aria-label="Add first topic"><Plus size={20}/></button></span></label><div className="topic-chips">{topics.map(t=><span key={t}>{t}<button type="button" aria-label={`Remove ${t}`} onClick={()=>setTopics(topics.filter(v=>v!==t))}><X size={14}/></button></span>)}</div>{error&&<p className="error" role="alert">{error}</p>}<div className="form-bottom"><span><ShieldCheck size={16}/> Built around you, not a syllabus.</span><button className="button primary" disabled={busy}>{busy?"Setting up your path…":"Let’s start learning"}<ArrowRight size={17}/></button></div></form></main>;
}
export function ProfilePage() {
  const {user,setUser}=useApp();
  const [level,setLevel]=useState<Level>(user!.level);
  const [interests,setInterests]=useState<string[]>(user!.interests);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [pwMessage,setPwMessage]=useState("");
  const [pwError,setPwError]=useState("");
  const [pwBusy,setPwBusy]=useState(false);
  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setMessage("");setError("");setBusy(true);
    try{const data=Object.fromEntries(new FormData(e.currentTarget));const updated=await api("profile",{method:"PATCH",body:JSON.stringify({...data,level,interests})});setUser(updated);setMessage("Your profile is saved. Make yourself at home.");}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function password(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setPwMessage("");setPwError("");setPwBusy(true);const form=e.currentTarget;
    try{const data=await api("profile/password",post(Object.fromEntries(new FormData(form))));setPwMessage(data.message);form.reset();}catch(e){setPwError((e as Error).message);}finally{setPwBusy(false);}
  }
  return <main id="main" className="page-content profile-page"><span className="eyebrow">YOUR WORKSPACE, YOUR WAY</span><div className="page-heading"><div><h1>Your profile</h1><p>A few details to make learning feel more like you.</p></div><span className="avatar large">{user!.name.slice(0,1)}</span></div><div className="profile-grid"><form className="panel" onSubmit={save}><h2>The essentials</h2><div className="two-fields"><label className="field"><span>Display name</span><input name="name" defaultValue={user!.name} required maxLength={60}/></label><label className="field"><span>Email address</span><input name="email" type="email" defaultValue={user!.email} required/></label></div><Complexity value={level} onChange={setLevel}/><InterestPicker values={interests} onChange={setInterests}/><label className="field"><span>A little about you <small>Optional</small></span><textarea name="bio" defaultValue={user!.bio} maxLength={500} rows={3} placeholder="What keeps you curious?"/></label>{message&&<p className="success-inline" role="status"><Check size={16}/>{message}</p>}{error&&<p className="error" role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy?"Saving…":"Save changes"}<Check size={16}/></button></form><form className="panel password-panel" onSubmit={password}><ShieldCheck size={23}/><h2>Keep it yours.</h2><p className="text-muted">Update your password here. Use at least eight characters.</p><PasswordField name="current" label="Current password" minLength={1}/><PasswordField label="New password"/>{pwMessage&&<p className="success-inline" role="status">{pwMessage}</p>}{pwError&&<p className="error" role="alert">{pwError}</p>}<button className="button secondary full" disabled={pwBusy}>{pwBusy?"Updating…":"Update password"}</button></form></div></main>;
}
export function Mailbox() {
  const {go}=useApp();
  const [messages,setMessages]=useState<any[]>([]);
  const [error,setError]=useState("");
  function load(){api("dev/mailbox").then(setMessages).catch(e=>setError(e.message));}
  useEffect(load,[]);
  return <main id="main" className="setup-page"><span className="eyebrow">LOCAL DEVELOPMENT ONLY</span><div className="page-heading"><div><h1>Development mailbox</h1><p>Reset emails without an SMTP server. Never available in production.</p></div><button className="button secondary" onClick={load}>Refresh</button></div>{error?<p className="error">{error}</p>:messages.length===0?<div className="panel empty-state"><Mail size={30}/><p>No messages yet. Request a password reset to see one here.</p><NavLink to="/forgot-password">Request a reset</NavLink></div>:messages.map(m=><article className="panel mail-card" key={m.id}><span className="tag">To: {m.recipient}</span><h2>{m.subject}</h2><p className="small-copy text-muted">{new Date(m.createdAt).toLocaleString()}</p><p className="mail-body">{m.body.replace(/https?:\/\/\S+/, "[single-use password reset link]")}</p><button className="button primary" onClick={()=>{const token=m.body.match(/token=([a-f0-9]+)/)?.[1];if(token)go(`/reset-password?token=${token}`);}}>Open reset link <ArrowRight size={16}/></button></article>)}</main>;
}
