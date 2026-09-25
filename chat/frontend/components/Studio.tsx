"use client";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, FileText, GraduationCap, Lightbulb, Paperclip, Plus, ShieldCheck, Sparkles, X } from "lucide-react";
import { apiRaw, useApp } from "@/lib/client";
import { LEVELS, Level } from "@/lib/types";
import Brain from "./Brain";
const examples=[
  {pillar:"Fintech",prompt:"How algorithmic trading works, in plain English",description:"When the algorithm takes the trading desk."},
  {pillar:"Medtech",prompt:"Digital biomarkers as the new lab tests",description:"What your everyday signals can tell us."},
  {pillar:"AI",prompt:"What a neural network is actually optimizing",description:"Look past the magic. Meet the mechanism."},
];
export default function Studio() {
  const {user,go,refreshPath,config,path}=useApp();
  const [prompt,setPrompt]=useState("");
  const [level,setLevel]=useState<Level>(user!.level);
  const [notes,setNotes]=useState<File|null>(null);
  const [assignment,setAssignment]=useState<File|null>(null);
  const [error,setError]=useState("");
  const [generating,setGenerating]=useState(false);
  const [stages,setStages]=useState<string[]>([]);
  const [uploadHelp,setUploadHelp]=useState(false);
  const input=useRef<HTMLTextAreaElement>(null);
  const notesRef=useRef<HTMLInputElement>(null);
  const assignmentRef=useRef<HTMLInputElement>(null);
  const allStages=["Reading your prompt",...(notes||assignment?["Reading the attachment"]:[]),"Writing the script","Storyboarding scenes","Preparing narration"];
  function selectFile(e:ChangeEvent<HTMLInputElement>,kind:"notes"|"assignment") {
    const file=e.target.files?.[0];e.target.value="";if(!file)return;setError("");
    if(file.size>10*1024*1024){setError("That file is over 10 MB. Try a smaller PDF.");return;}
    if(!/\.pdf$/i.test(file.name)&&!(kind==="assignment"&&/\.txt$/i.test(file.name))){setError(kind==="notes"?"Notes must be a PDF.":"Assignments must be a PDF or plain-text (.txt) file.");return;}
    (kind==="notes"?setNotes:setAssignment)(file);setUploadHelp(false);
  }
  async function generate(e:FormEvent) {
    e.preventDefault();if(generating||(!prompt.trim()&&!notes&&!assignment))return;
    setGenerating(true);setError("");setStages([]);
    const form=new FormData();form.set("prompt",prompt);form.set("level",level);if(notes)form.append("notes",notes);if(assignment)form.append("assignment",assignment);
    try {
      const response=await apiRaw("generate",{method:"POST",body:form});
      if(!response.ok) {const body=await response.json();throw new Error(body.error);}
      if(!response.body)throw new Error("Your browser couldn't open the lesson stream. Please try again.");
      const reader=response.body.getReader();const decoder=new TextDecoder();let buffer="";let id="";
      while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const parts=buffer.split("\n\n");buffer=parts.pop()||"";for(const part of parts){if(!part.startsWith("data: "))continue;const data=JSON.parse(part.slice(6));if(data.error)throw new Error(data.error);if(data.stage)setStages(s=>[...s,data.stage]);if(data.done)id=data.id;}}
      if(!id)throw new Error("Generation stopped before the lesson was ready. Please retry.");
      await refreshPath();go(`/learn/${id}`);
    }catch(e){setError((e as Error).message);setGenerating(false);}
  }
  return <main id="main" className="studio-page"><div className="studio-top"><div><span className="breadcrumb">Your workspace <span>/</span> <strong>Learning studio</strong></span></div><span className="mode-label"><span className="status-dot"/>{config.generationMode==="local"?"Local generation":"AI generation"}<span className="mode-tooltip">{config.generationMode==="local"?"Ready without an API key":"Connected model"}</span></span></div>
    <div className="studio-content">
      {generating?<section className="generation-state" aria-live="polite"><Brain/><span className="eyebrow">CURIOSITY, MEET CLARITY</span><h1>Your idea is coming together.</h1><p>Building a tutorial around your question, at your level.</p><div className="generation-steps">{allStages.map((s,i)=>{const done=stages.includes(s)&&stages.indexOf(s)<stages.length-1;const active=stages[stages.length-1]===s;return <div key={s} className={done?"done":active?"current":""}><span>{done?<Check size={15}/>:String(i+1).padStart(2,"0")}</span>{s}{active&&<small>In progress</small>}</div>;})}</div></section>:<>
        <section className="studio-welcome"><Brain/><div className="welcome-copy"><span className="eyebrow">A FRESH CONNECTION AWAITS</span><h1>Welcome back, {user!.name}!</h1><p>Stay curious, keep learning.</p></div></section>
        <section className="prompt-examples"><div className="section-line"><span>Not sure where to start?</span><span className="text-muted small-copy">Follow a little curiosity <ArrowUpRight size={13}/></span></div><div className="example-grid">{examples.map((ex,i)=><button key={ex.pillar} className="example-card" onClick={()=>{setPrompt(ex.prompt);input.current?.focus();}}><span className="example-card-top"><span className="tag">{ex.pillar}</span>{i===0?<ArrowUpRight size={17}/>:i===1?<Plus size={18}/>:<Sparkles size={17}/>}</span><strong>{ex.prompt}</strong><span className="example-description">{ex.description}</span><span className="example-action">Explore this idea <ArrowRight size={14}/></span></button>)}</div></section>
        {!!path?.firstTopics.length&&<div className="starting-topics"><span>Your starting topics</span>{path.firstTopics.map(t=><button key={t} onClick={()=>{setPrompt(`Explain ${t}`);input.current?.focus();}}>{t}<Plus size={13}/></button>)}</div>}
      </>}
      <div className="composer-wrap"><form className={`composer ${generating?"busy":""}`} onSubmit={generate}><div className="composer-input"><Sparkles size={21}/><label className="sr-only" htmlFor="tutorial-prompt">What would you like to understand?</label><textarea id="tutorial-prompt" ref={input} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="What would you like to understand?" maxLength={2500} disabled={generating} rows={2}/></div>
        {(notes||assignment)&&<div className="attached-files">{[{file:notes,kind:"notes"},{file:assignment,kind:"assignment"}].filter(v=>v.file).map(({file,kind})=><div className="attached-file" key={kind}><FileText size={17}/><span>{file!.name}<small>{(file!.size/1024).toFixed(1)} KB · {kind==="notes"?"PDF notes":"Practice assignment"}</small></span><button type="button" aria-label={`Remove ${file!.name}`} disabled={generating} onClick={()=>kind==="notes"?setNotes(null):setAssignment(null)}><X size={16}/></button></div>)}</div>}
        <div className="attachment-controls"><button type="button" onClick={()=>notesRef.current?.click()} disabled={generating} title="Use your notes as the source."><Paperclip size={15}/> Attach PDF</button><button type="button" onClick={()=>assignmentRef.current?.click()} disabled={generating} title="We’ll teach the method with similar, not identical, questions."><GraduationCap size={16}/> Attach assignment</button><button type="button" className="upload-help-button" onClick={()=>setUploadHelp(!uploadHelp)} aria-expanded={uploadHelp}>How attachments work</button><input type="file" ref={notesRef} accept=".pdf,application/pdf" onChange={e=>selectFile(e,"notes")} className="sr-only" tabIndex={-1} aria-label="Upload PDF notes"/><input type="file" ref={assignmentRef} accept=".pdf,.txt,application/pdf,text/plain" onChange={e=>selectFile(e,"assignment")} className="sr-only" tabIndex={-1} aria-label="Upload assignment"/></div>
        {uploadHelp&&<div className="upload-help"><p><strong>PDF notes:</strong> Use your notes as the source.</p><p><strong>Assignments:</strong> We’ll teach the method with similar, not identical, questions.</p><p>Text-based PDFs for notes; PDF or .txt for assignments. Up to 10 MB per file.</p></div>}
        <div className="composer-bottom"><label className="level-select"><span>Your level</span><select aria-label="Tutorial complexity" value={level} onChange={e=>setLevel(e.target.value as Level)} disabled={generating}>{LEVELS.map(l=><option key={l}>{l}</option>)}</select></label><button className="button primary" disabled={generating||(!prompt.trim()&&!notes&&!assignment)}>{generating?"Creating your tutorial…":error?"Retry tutorial":"Generate tutorial"}<ArrowRight size={17}/></button></div></form>
      {error&&<div className="error composer-error" role="alert">{error} <span>Your draft is still here.</span></div>}<div className="composer-note"><ShieldCheck size={14}/><span>Understand the why, not just the answer.</span><span className="note-dot">·</span><span>Animation + narration + a quick quiz</span></div></div>
    </div>
    <div className="studio-bottom"><Lightbulb size={14}/><span>A little more understanding, every time.</span></div>
  </main>;
}
