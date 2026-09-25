"use client";
import { CSSProperties, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight, FileText, LockKeyhole, Pause, Play, RotateCcw, Route, Volume2, VolumeX } from "lucide-react";
import { api, NavLink, post, useApp } from "@/lib/client";
import { LessonRecord, Scene } from "@/lib/types";
import { useLessonPlayback, Voice } from "./useLessonPlayback";

function Visual({scene,playing,elapsed}:{scene:Scene;playing:boolean;elapsed:number}) {
  const visual=scene.visual;
  const parts=visual.steps||visual.nodes||[];
  const current=Math.min(parts.length-1,Math.floor(elapsed/Math.max(1,scene.durationSec/Math.max(1,parts.length))));
  return <div className={`scene-art visual-${scene.visualType}`} style={{"--scene-duration":`${scene.durationSec}s`,"--play-state":playing?"running":"paused"} as CSSProperties}>
    <div className="scene-kicker"><span className="status-dot"/> THE IDEA, VISUALIZED</div><h2>{visual.heading}</h2>
    {["concept-map","annotated-diagram"].includes(scene.visualType)&&<div className="concept-visual">{parts.map((n,i)=><div className={`concept-node reveal-item ${i<=current?"is-revealed":""}`} key={i}><span className="node-index">{String(i+1).padStart(2,"0")}</span><span>{n}</span>{i<parts.length-1&&<ArrowRight className="node-arrow" size={20}/>}</div>)}</div>}
    {scene.visualType==="step-sequence"&&<div className="steps-visual">{parts.map((step,i)=><div className={`visual-step ${i===current?"current":i<current?"past":""}`} key={i}><span>{i<current?<Check size={15}/>:String(i+1).padStart(2,"0")}</span><p>{step}</p>{i===current&&<ArrowRight size={19}/>}</div>)}</div>}
    {scene.visualType==="comparison"&&<div className="comparison-visual"><div><span className="eyebrow">ON ONE SIDE</span><p>{visual.left}</p></div><span className="versus">≠</span><div><span className="eyebrow">ON THE OTHER</span><p>{visual.right}</p></div></div>}
    {scene.visualType==="equation"&&<div className="equation-visual"><div>{visual.equation?.split(" ").map((s,i)=><span key={i} style={{animationDelay:`${i*scene.durationSec/Math.max(1,visual.equation!.split(" ").length)}s`}}>{s} </span>)}</div><ul>{visual.labels?.map(l=><li key={l}>{l}</li>)}</ul></div>}
    {scene.visualType==="code-block"&&<pre className="code-visual"><code>{visual.code}</code></pre>}
    {scene.visualType==="caution"&&<div className="caution-visual"><div className="caution-symbol">!</div><p>{visual.note}</p><span className="eyebrow">GOOD QUESTIONS INCLUDE LIMITS.</span></div>}
    {visual.note&&scene.visualType!=="caution"&&<p className="source-excerpt">{visual.note}</p>}
  </div>;
}

function Quiz({lesson,onPass}:{lesson:LessonRecord;onPass:()=>Promise<void>}) {
  const {go}=useApp();
  const [current,setCurrent]=useState(0);
  const [answers,setAnswers]=useState<Record<string,string|number>>({});
  const [feedback,setFeedback]=useState<{correct:boolean;explanation:string;correctOption?:string}|null>(null);
  const [result,setResult]=useState<{score:number;passed:boolean;message:string}|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const questions=lesson.content.quiz;
  const q=questions[current];
  async function check() {
    if(answers[q.id]===undefined || answers[q.id]==="")return;
    setBusy(true);setError("");
    try{setFeedback(await api(`lessons/${lesson.id}/answer`,post({questionId:q.id,answer:answers[q.id]})));}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function next() {
    if(current<questions.length-1){setCurrent(current+1);setFeedback(null);return;}
    setBusy(true);setError("");
    try{const data=await api(`lessons/${lesson.id}/quiz`,post({answers}));setResult(data);await onPass();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  function retry(){setCurrent(0);setAnswers({});setFeedback(null);setResult(null);setError("");}
  if(!lesson.watched)return <section className="quiz-locked panel"><LockKeyhole size={24}/><div><h2>First, let the idea sink in.</h2><p>Finish the tutorial to unlock your knowledge check. Watching alone won’t mark the topic complete.</p></div><span className="tag">{questions.length} questions · Pass at 60%</span></section>;
  if(result)return <section className="quiz-result panel"><CheckCircle2 size={36}/><span className="eyebrow">{result.passed?"THAT CONNECTION IS YOURS":"ONE MORE PASS CAN MAKE IT CLICK"}</span><h2>{result.message}</h2><div className="result-score">{result.score}<span>%</span></div><p>{result.passed?"You’ve put this idea into practice. Where will your curiosity take you next?":"Your attempt is saved. Review the tutorial or retry the quiz to reach 60%."}</p><div className="result-actions"><button className="button primary" onClick={()=>result.passed?go("/path"):retry()}>{result.passed?"View learning path":"Try the quiz again"}<ArrowRight size={16}/></button><button className="button secondary" onClick={()=>result.passed?go("/learn"):document.getElementById("lesson-player")?.scrollIntoView({behavior:"smooth"})}>{result.passed?"Explore another idea":"Review tutorial"}</button></div></section>;
  return <section className="quiz-panel panel" id="knowledge-check"><div className="section-line"><div><span className="eyebrow">MAKE THE KNOWLEDGE YOURS</span><h2>A quick check for understanding.</h2></div><span className="tag">Question {current+1} of {questions.length}</span></div><div className="quiz-progress">{questions.map((item,i)=><span key={item.id} className={i<=current?"filled":""}/>)}</div><h3>{q.question}</h3>{q.type==="choice"?<div className="quiz-options" role="radiogroup" aria-label={q.question}>{q.options?.map((option,i)=><button key={i} role="radio" aria-checked={answers[q.id]===i} disabled={!!feedback} className={answers[q.id]===i?"selected":""} onClick={()=>setAnswers({...answers,[q.id]:i})}><span className="option-letter">{String.fromCharCode(65+i)}</span><span>{option}</span>{answers[q.id]===i&&<Check size={18}/>}</button>)}</div>:<><label className="field"><span className="sr-only">Your explanation</span><textarea rows={4} placeholder="In my own words…" maxLength={4000} value={answers[q.id]||""} disabled={!!feedback} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})}/></label><p className="field-help">Local formative check: at least 12 words and two relevant lesson terms. This is practice, not a formal assessment.</p></>}
    {feedback&&<div className={`quiz-feedback ${feedback.correct?"correct":""}`} role="status"><h3>{feedback.correct?"You’ve got it.":"Here’s the connection."}</h3>{!feedback.correct&&feedback.correctOption&&<p><strong>Best answer:</strong> {feedback.correctOption}</p>}<p>{feedback.explanation}</p></div>}{error&&<p role="alert" className="error">{error}</p>}<div className="quiz-bottom"><span>60% to complete this topic. Retakes welcome.</span><button className="button primary" disabled={busy||answers[q.id]===undefined||answers[q.id]===""} onClick={feedback?next:check}>{busy?"Checking…":feedback?(current===questions.length-1?"Finish quiz":"Next question"):"Check answer"}<ArrowRight size={16}/></button></div></section>;
}
export default function Player({id}:{id:string}) {
  const {refreshPath}=useApp();
  const [lesson,setLesson]=useState<LessonRecord|null>(null);
  const [error,setError]=useState("");
  const [index,setIndex]=useState(0);
  const [showScript,setShowScript]=useState(true);
  const [marking,setMarking]=useState(false);
  const [activeTab,setActiveTab]=useState("tutorial");
  const scene=lesson?.content.scenes[index];
  useEffect(()=>{api<LessonRecord>(`lessons/${id}`).then(setLesson).catch(e=>setError(e.message));},[id]);
  async function markWatched() {
    if(!lesson||lesson.watched)return;
    setMarking(true);setError("");
    try{await api(`lessons/${id}/watched`,post({}));setLesson({...lesson,watched:true});}catch(e){setError((e as Error).message);}finally{setMarking(false);}
  }
  const playback=useLessonPlayback(lesson,index,setIndex,markWatched);
  const {playing,setPlaying,muted,setMuted,elapsed,duration,selectScene,togglePlay}=playback;
  if(!lesson)return <main id="main" className="page-content"><NavLink to="/learn" className="back-link"><ArrowLeft size={15}/> Back to studio</NavLink>{error?<div className="error" role="alert">{error}</div>:<div className="loading-block"><div className="skeleton-title"/><div className="skeleton-player"/><p>Opening your tutorial…</p></div>}</main>;
  const total=Math.ceil(lesson.content.scenes.reduce((n,s)=>n+s.durationSec,0)/60);
  return <main id="main" className="page-content lesson-page"><div className="page-top"><NavLink to="/learn" className="back-link"><ArrowLeft size={15}/> Learning studio</NavLink><span className="mini-tag">{lesson.generator==="local"?"LOCAL LESSON":"AI-GENERATED LESSON"}</span></div><div className="lesson-heading"><div className="topic-meta"><span className="tag">{lesson.pillar}</span><span>{lesson.level}</span><span>·</span><span>About {total} min</span></div><h1>{lesson.title}</h1><p>See it. Understand it. Make it yours.</p></div>
    {lesson.content.sourceNote&&<div className="source-banner"><FileText size={17}/><span>{lesson.content.sourceNote}</span></div>}{lesson.content.localNote&&<div className="source-banner">{lesson.content.localNote}</div>}
    <div className="tabs lesson-tabs"><button className={activeTab==="tutorial"?"selected":""} onClick={()=>setActiveTab("tutorial")}><Play size={15}/> Tutorial</button><button className={activeTab==="quiz"?"selected":""} onClick={()=>{setActiveTab("quiz");setPlaying(false);}}>{lesson.watched?<CheckCircle2 size={16}/>:<LockKeyhole size={15}/>} Knowledge check</button><span className="lesson-progress-label">{lesson.watched?"Tutorial finished":"Learn first, then check your understanding"}</span></div>
    {activeTab==="tutorial"&&<><div className="voice-toolbar">
      <div className="voice-intro"><Volume2 size={18}/><div><strong>A voice worth listening to.</strong><span>Neural narration, made on this server. No external speech service.</span></div></div>
      <div className="voice-settings"><label>Voice<select aria-label="Narrator voice" value={playback.voice} onChange={e=>playback.setVoice(e.target.value as Voice)}><option value="warm">Warm · natural</option><option value="clear">Clear · natural</option><option value="device">Device · offline</option></select></label><label>Speed<select aria-label="Narration speed" value={playback.rate} disabled={playback.voice==="device"} onChange={e=>playback.setRate(Number(e.target.value))}><option value={0.9}>0.9×</option><option value={1}>1×</option><option value={1.1}>1.1×</option><option value={1.25}>1.25×</option></select></label></div>
    </div>
    <div className="voice-status" role="status">{muted?"Silent playback. Your script stays in view.":playback.loading?"Preparing your natural voice. First playback may take a moment.":playback.voice==="device"?"Using your device’s speech voice. Sound quality varies by browser.":playback.error?"Natural narration needs another try.":"Natural voice ready. Scenes follow the audio, not a timer."}</div>
    {playback.error&&<div className="voice-error" role="alert"><span>{playback.error}</span><button className="button secondary compact" onClick={playback.retry}>Retry voice</button><button className="button secondary compact" onClick={()=>setMuted(true)}>Read silently</button></div>}
    <div id="lesson-player" className={`lesson-grid ${!showScript?"no-script":""}`}><section className="player-panel"><div className="player-top"><span>SCENE {String(index+1).padStart(2,"0")} <span>/ {String(lesson.content.scenes.length).padStart(2,"0")}</span></span><span>{scene!.title}</span></div><Visual key={`${index}-${playback.visualKey}`} scene={{...scene!,durationSec:duration}} playing={playback.running} elapsed={elapsed}/><div className="player-narration">{scene!.narration}</div><div className="player-controls"><div className="scene-scrubber">{lesson.content.scenes.map((s,i)=><button key={s.id} aria-label={`Go to scene ${i+1}: ${s.title}`} title={s.title} onClick={()=>selectScene(i)} className={i===index?"active":i<index?"visited":""}><span style={{width:i===index?`${Math.min(100,elapsed/duration*100)}%`:i<index?"100%":"0%"}}/></button>)}</div><div className="player-control-row"><div><button className="play-button" aria-label={playing?"Pause tutorial":"Play tutorial"} onClick={togglePlay}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><button className="icon-button" title="Previous scene" aria-label="Previous scene" disabled={index===0} onClick={()=>selectScene(index-1)}><ChevronLeft size={19}/></button><button className="icon-button" title="Next scene" aria-label="Next scene" disabled={index===lesson.content.scenes.length-1} onClick={()=>selectScene(index+1)}><ChevronRight size={19}/></button><button className="icon-button" title="Replay scene" aria-label="Replay scene" onClick={playback.replayScene}><RotateCcw size={17}/></button><span className="player-time">{Math.floor(Math.min(elapsed,duration))} / {Math.ceil(duration)}s</span></div><div><button className="icon-button" aria-label={muted?"Enable narration":"Mute narration"} title={muted?"Enable narration":"Mute narration"} onClick={()=>setMuted(!muted)}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button><button className={`script-toggle ${showScript?"selected":""}`} onClick={()=>setShowScript(!showScript)} aria-pressed={showScript}><BookOpen size={16}/>Script</button></div></div></div></section>
      {showScript&&<aside className="script-panel"><div className="section-line"><h2>The full script</h2><span className="tag">Read along</span></div><p className="small-copy text-muted">The current scene is highlighted.</p><div className="script-scroll">{lesson.content.scenes.map((s,i)=><button key={s.id} className={`script-scene ${i===index?"active":""}`} onClick={()=>selectScene(i)}><span className="script-number">{String(i+1).padStart(2,"0")}</span><div><h3>{s.title}</h3><p>{s.narration}</p></div></button>)}</div></aside>}</div>
      <div className="finish-row"><p>{lesson.watched?<><CheckCircle2 size={17}/> Tutorial finished. Ready to make it stick?</>:<><Route size={17}/> Understanding is the first step. The quiz makes it part of your path.</>}</p><button className={`button ${lesson.watched?"primary":"secondary"}`} disabled={marking} onClick={()=>lesson.watched?setActiveTab("quiz"):markWatched()}>{marking?"Saving…":lesson.watched?"Take the knowledge check":"I’ve finished this tutorial"}<ArrowRight size={16}/></button></div>
      {lesson.content.practice&&<section className="practice-panel panel"><span className="eyebrow">SIMILAR QUESTIONS. YOUR OWN REASONING.</span><h2>Your practice set</h2><ol>{lesson.content.practice.map(p=><li key={p}>{p}</li>)}</ol><p className="field-help">These are new situations, not answers to your uploaded assignment. Write your own submission in your own words.</p></section>}
    </>}
    {error&&<p className="error" role="alert">{error}</p>}{(activeTab==="quiz"||!lesson.watched)&&<Quiz lesson={lesson} onPass={refreshPath}/>}
  </main>;
}
