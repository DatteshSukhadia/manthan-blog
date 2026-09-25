"use client";
import { useEffect, useId, useState } from "react";
const points = [[92,70],[130,44],[171,39],[211,45],[249,61],[276,91],[295,123],[297,157],[278,192],[244,213],[203,218],[169,224],[136,236],[105,212],[74,182],[58,145],[68,109],[111,113],[149,86],[189,88],[228,104],[259,141],[230,174],[190,155],[151,135],[114,157],[145,187],[192,193],[102,187],[174,116],[210,128]];
// All graph geometry is contained within the hand-drawn silhouette.
const nodes=points.slice(0,26);
const pairs=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,0],[0,17],[17,18],[18,2],[18,19],[19,3],[19,20],[20,4],[20,21],[21,6],[21,22],[22,8],[22,23],[23,24],[24,17],[17,25],[25,15],[25,14],[24,18],[24,19],[23,19],[23,20],[22,10],[25,13],[24,11]];
export default function Brain({large=false}:{large?:boolean}) {
  const uid=useId().replace(/:/g,"");
  const [reduced,setReduced]=useState(true);
  useEffect(()=>{const m=matchMedia("(prefers-reduced-motion: reduce)");setReduced(m.matches);const change=()=>setReduced(m.matches);m.addEventListener("change",change);return()=>m.removeEventListener("change",change);},[]);
  return <svg className={`brain ${large?"brain-large":""}`} viewBox="0 0 360 280" role="img" aria-label="A brain with interconnected neurons and traveling signals">
    <defs><clipPath id={`${uid}clip`}><path d="M133 241C109 239 99 221 97 216C68 213 53 193 56 174C36 157 41 131 54 119C43 96 58 76 79 70C76 48 101 34 122 37C135 15 166 19 180 26C201 17 221 27 231 38C258 33 275 48 280 65C306 70 315 93 308 110C327 127 321 151 314 160C321 185 302 201 287 206C279 232 253 240 234 229C212 245 194 236 181 234L152 262L136 260Z"/></clipPath></defs>
    <path className="brain-outline" d="M133 241C109 239 99 221 97 216C68 213 53 193 56 174C36 157 41 131 54 119C43 96 58 76 79 70C76 48 101 34 122 37C135 15 166 19 180 26C201 17 221 27 231 38C258 33 275 48 280 65C306 70 315 93 308 110C327 127 321 151 314 160C321 185 302 201 287 206C279 232 253 240 234 229C212 245 194 236 181 234L152 262L136 260Z"/>
    <g clipPath={`url(#${uid}clip)`}>
      {pairs.map(([a,b],i)=>{const [x,y]=nodes[a];const [x2,y2]=nodes[b];return <path key={i} id={`${uid}edge${i}`} className="brain-edge" d={`M${x},${y} Q${(x+x2)/2+5},${(y+y2)/2-6} ${x2},${y2}`}/>;})}
      {nodes.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%4===0?6.5:4} className="brain-node"/>)}
      {!reduced && [2,18,23,27,32,36].map((edge,i)=><circle key={edge} r="3.4" className="brain-signal"><animateMotion dur="2.4s" begin={`${i*1.2}s`} repeatCount="indefinite"><mpath href={`#${uid}edge${edge}`}/></animateMotion></circle>)}
      {!reduced && [2,18,23,27,32,36].map((edge,i)=>{const [x,y]=nodes[pairs[edge][1]];return <circle key={edge} cx={x} cy={y} r="7" className="brain-synapse"><animate attributeName="opacity" values="0;0;0.65;0" keyTimes="0;0.75;0.9;1" dur="2.4s" begin={`${i*1.2}s`} repeatCount="indefinite"/></circle>;})}
    </g>
  </svg>;
}
