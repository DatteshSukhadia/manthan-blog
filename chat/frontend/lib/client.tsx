"use client";
import { createContext, useContext } from "react";
import { PathData, Profile } from "./types";
const marker = "__PORT_3000__";
export const API_BASE = marker.startsWith("__") ? "" : marker;
export const isPreview = !!API_BASE;
export const logoSrc = isPreview ? "./manthan-logo.png" : "/manthan-logo.png";
let sessionToken = "";
export function setToken(token: string) { sessionToken=token; }
export async function apiRaw(path: string, init: RequestInit={}) {
  const headers = new Headers(init.headers);
  if(sessionToken) headers.set("Authorization",`Bearer ${sessionToken}`);
  if(init.body && !(init.body instanceof FormData)) headers.set("Content-Type","application/json");
  return fetch(`${API_BASE}/api/${path}`, {...init,headers,cache:"no-store"});
}
export async function api<T=any>(path: string, init: RequestInit={}):Promise<T> {
  const response = await apiRaw(path,init);
  const data = await response.json();
  if(!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
export const post=(body:unknown):RequestInit=>({method:"POST",body:JSON.stringify(body)});
export type AppState = { user:Profile|null; setUser:(u:Profile|null)=>void; go:(path:string)=>void; route:string; path:PathData|null; refreshPath:()=>Promise<void>; config:{institutionPreview:boolean;devMailbox:boolean;generationMode:string;demoEnabled:boolean} };
export const AppContext=createContext<AppState>(null!);
export const useApp=()=>useContext(AppContext);
export function NavLink({to,children,className="",...rest}:{to:string;children:React.ReactNode;className?:string;[key:string]:unknown}) {
  const {go}=useApp();
  return <a href={isPreview?`#${to}`:to} className={className} {...rest} onClick={e=>{if(!e.metaKey&&!e.ctrlKey){e.preventDefault();go(to);}}}>{children}</a>;
}
