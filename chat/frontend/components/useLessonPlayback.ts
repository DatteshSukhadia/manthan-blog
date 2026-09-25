"use client";
import { useEffect, useRef, useState } from "react";
import { apiRaw, post } from "@/lib/client";
import { BrowserNarration } from "@/lib/narration";
import { LessonRecord } from "@/lib/types";

export type Voice = "warm" | "clear" | "device";
let preferredVoice: Voice = "warm";
let preferredRate = 1;

export function useLessonPlayback(
  lesson: LessonRecord | null,
  index: number,
  setIndex: (index: number) => void,
  onFinished: () => void,
) {
  const [playing,setPlaying]=useState(false);
  const [muted,setMuted]=useState(false);
  const [voice,setVoiceState]=useState<Voice>(preferredVoice);
  const [rate,setRateState]=useState(preferredRate);
  const [elapsed,setElapsed]=useState(0);
  const [duration,setDuration]=useState(0);
  const [loading,setLoading]=useState(false);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState("");
  const [replay,setReplay]=useState(0);
  const audio=useRef<HTMLAudioElement|null>(null);
  const device=useRef(new BrowserNarration());
  const cache=useRef(new Map<string,Promise<string>>());
  const disposed=useRef(false);
  const started=useRef(false);
  const done=useRef(false);
  const clock=useRef(0);
  const callbacks=useRef({lesson,index,setIndex,onFinished});
  callbacks.current={lesson,index,setIndex,onFinished};
  const scene=lesson?.content.scenes[index];

  function finish() {
    if(done.current)return;
    done.current=true;
    const c=callbacks.current;
    if(c.lesson && c.index<c.lesson.content.scenes.length-1)c.setIndex(c.index+1);
    else {setPlaying(false);c.onFinished();}
  }
  function load(sceneId:string,chosen:Voice):Promise<string> {
    const key=`${lesson!.id}:${sceneId}:${chosen}`;
    const existing=cache.current.get(key);
    if(existing)return existing;
    const request=apiRaw(`lessons/${lesson!.id}/narration`,post({sceneId,voice:chosen}))
      .then(async response=>{
        if(!response.ok){const data=await response.json();throw new Error(data.error);}
        const blob=await response.blob();
        if(disposed.current)throw new Error("Player closed");
        return URL.createObjectURL(blob);
      }).catch(e=>{cache.current.delete(key);throw e;});
    cache.current.set(key,request);
    return request;
  }
  useEffect(()=>{
    disposed.current=false;
    return()=>{
      disposed.current=true;
      device.current.cancel();
      audio.current?.pause();
      for(const pending of cache.current.values())pending.then(url=>URL.revokeObjectURL(url)).catch(()=>{});
      cache.current.clear();
    };
  },[]);

  useEffect(()=>{
    let active=true;
    audio.current?.pause();audio.current=null;
    device.current.cancel();
    started.current=false;done.current=false;clock.current=0;
    setElapsed(0);setError("");setReady(false);
    if(!scene||!lesson)return;
    setDuration(scene.durationSec);
    if(muted||voice==="device"){
      setLoading(false);setReady(true);
      return;
    }
    setLoading(true);
    load(scene.id,voice).then(url=>{
      if(!active)return;
      const player=new Audio();
      audio.current=player;
      player.preload="auto";
      player.onloadedmetadata=()=>{
        if(!active)return;
        setDuration(player.duration);setReady(true);setLoading(false);
        // Prepare just the next scene while this one is being read.
        const next=lesson.content.scenes[index+1];
        if(next)load(next.id,voice).catch(()=>{});
      };
      player.ontimeupdate=()=>{if(active)setElapsed(player.currentTime);};
      player.onended=()=>{if(active)finish();};
      player.onerror=()=>{
        if(!active)return;
        cache.current.delete(`${lesson.id}:${scene.id}:${voice}`);
        setLoading(false);setPlaying(false);
        setError("The audio couldn't play. Retry the voice or read silently.");
      };
      player.src=url;player.load();
    }).catch(e=>{
      if(active){setLoading(false);setPlaying(false);setError(e.message);}
    });
    return()=>{
      active=false;
      const player=audio.current;
      if(player){player.pause();player.onended=null;player.ontimeupdate=null;player.onloadedmetadata=null;player.onerror=null;player.removeAttribute("src");player.load();}
      device.current.cancel();
    };
  // Scene identity, not an API object refresh, determines whether audio restarts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[lesson?.id,scene?.id,voice,muted,replay]);

  useEffect(()=>{
    if(!scene||!ready)return;
    if(!muted&&voice!=="device"){
      const player=audio.current;
      if(!player)return;
      player.playbackRate=rate;player.preservesPitch=true;
      if(playing){
        player.play().catch(e=>{
          if(e.name==="AbortError")return;
          setPlaying(false);setError("Press play again to let this browser start the audio.");
        });
      } else player.pause();
      return;
    }
    if(!playing){device.current.pause();return;}
    let speechEnded=false;
    if(!muted){
      if(!device.current.available()){
        setError("Device speech isn't available. The lesson will play silently.");
      } else if(!started.current){
        started.current=true;
        device.current.speak(scene.narration,()=>{speechEnded=true;finish();},()=>{
          setPlaying(false);setError("Device speech isn't available. Choose a natural voice or read silently.");
        });
      } else device.current.resume();
    }
    const timer=setInterval(()=>{
      clock.current+=0.2*rate;
      setElapsed(Math.min(clock.current,scene.durationSec));
      if(muted||!device.current.available()){
        if(clock.current>=scene.durationSec)finish();
      } else if(!speechEnded&&clock.current>scene.durationSec*3){
        device.current.cancel();setPlaying(false);
        setError("Device speech stopped responding. Choose a natural voice or read silently.");
      }
    },200);
    return()=>clearInterval(timer);
  },[playing,ready,voice,muted,rate,scene]);

  function selectScene(i:number){setIndex(i);setReplay(r=>r+1);}
  function togglePlay(){
    setError("");
    if(!playing&&elapsed>=duration-0.1){setReplay(r=>r+1);}
    setPlaying(p=>!p);
  }
  function setVoice(value:Voice){setPlaying(false);preferredVoice=value;setVoiceState(value);if(value==="device")setRateState(1);}
  function setRate(value:number){preferredRate=value;setRateState(value);}
  return {
    playing,setPlaying,muted,setMuted,voice,setVoice,rate,setRate,
    elapsed,duration:duration||scene?.durationSec||1,loading,error,
    running:playing&&ready&&!loading,
    selectScene,togglePlay,
    replayScene:()=>{setReplay(r=>r+1);setPlaying(true);},
    retry:()=>{setReplay(r=>r+1);setPlaying(false);},
    visualKey:`${replay}-${voice}-${muted}`,
  };
}
