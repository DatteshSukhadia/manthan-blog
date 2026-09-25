import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateLesson } from "@/lib/generator";
import { AttachmentInfo, INTERESTS, LessonJSON, LEVELS, Question } from "@/lib/types";
import type { User } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const json = (data: unknown, status=200) => NextResponse.json(data, { status, headers: {"Cache-Control":"no-store"} });
const cookieAuth = () => process.env.AUTH_MODE === "cookie";
const sessionCookie = "__Host-manthan_session";
const demoEnabled = () => process.env.DEMO_ENABLED !== "false";
function visitorId(req: NextRequest) {
  return cookieAuth() ? null : req.headers.get("x-visitor-id");
}
function authResponse(user: User, token: string, status=200) {
  const response = json({user:safeUser(user),token:cookieAuth()?"":token},status);
  if(cookieAuth()) response.cookies.set(sessionCookie,token,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:7*86400});
  return response;
}
const institutionEnabled = () => process.env.INSTITUTION_PREVIEW === "true" || (process.env.INSTITUTION_PREVIEW === undefined && process.env.NODE_ENV !== "production");
function localMailbox(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const forwarded = req.headers.get("x-forwarded-host");
  const loopback = /^(localhost|127\.0\.0\.1)(:\d+)?$/;
  // Next sets x-forwarded-host even for direct local requests.
  return process.env.NODE_ENV !== "production" && loopback.test(host) && !req.headers.get("x-visitor-id") && (!forwarded || loopback.test(forwarded));
}
function safeUser(user: User) {
  return { id:user.id, name:user.name, email:user.email, role:user.role, level:user.level, interests:JSON.parse(user.interests), bio:user.bio, onboarded:user.onboarded };
}
function publicLesson(lesson: {content: string; [key:string]:unknown}) {
  const content: LessonJSON = JSON.parse(lesson.content);
  return {...lesson,content:{...content,quiz:content.quiz.map(({correct,keywords,explanation,...q})=>q)}};
}
async function currentSession(req: NextRequest) {
  const bearer = cookieAuth() ? req.cookies.get(sessionCookie)?.value : req.headers.get("authorization")?.replace(/^Bearer /,"");
  const visitor = visitorId(req);
  if (!bearer && !visitor) return null;
  return db.session.findFirst({where:{...(bearer?{tokenHash:digest(bearer)}:{visitorHash:digest(visitor!)}),expiresAt:{gt:new Date()}},include:{user:true},orderBy:{expiresAt:"desc"}});
}
async function sessionFor(userId: string, req: NextRequest) {
  const token = randomBytes(32).toString("hex");
  const visitor = visitorId(req);
  if(visitor) await db.session.deleteMany({where:{visitorHash:digest(visitor)}});
  await db.session.create({data:{userId,tokenHash:digest(token),visitorHash:visitor?digest(visitor):null,expiresAt:new Date(Date.now()+7*86400000)}});
  return token;
}
const attempts = new Map<string,{count:number;until:number}>();
function throttle(req: NextRequest, scope: string, limit=15) {
  const ip = visitorId(req) || req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const key = `${scope}:${ip}`;
  const old = attempts.get(key);
  if(!old || old.until<Date.now()) {attempts.set(key,{count:1,until:Date.now()+900000});return;}
  old.count++;
  if(old.count>limit) throw new Error("Too many requests. Please try again in 15 minutes.");
  if(attempts.size>10000) for(const [k,v] of attempts) if(v.until<Date.now()) attempts.delete(k);
}
const emailSchema = z.string().trim().email("Enter a valid email address.").max(254).transform(s=>s.toLowerCase());
const passwordSchema = z.string().min(8,"Use at least 8 characters.").max(72,"Use no more than 72 characters.");
const profileSchema = z.object({name:z.string().trim().min(1,"Tell us what to call you.").max(60),email:emailSchema.optional(),level:z.enum(LEVELS),interests:z.array(z.enum(INTERESTS)).min(1,"Choose at least one interest.").max(6),bio:z.string().max(500).optional()});
async function ownLesson(id: string, userId: string) {
  return db.lesson.findFirst({where:{id,userId},include:{attachments:{select:{filename:true,kind:true,size:true}},attempts:{select:{score:true,createdAt:true},orderBy:{createdAt:"desc"}}}});
}
function grade(q: Question, answer: unknown) {
  if(q.type==="choice") return typeof answer==="number" && answer===q.correct;
  if(typeof answer!=="string") return false;
  const words = answer.toLowerCase().match(/[a-z]+/g) || [];
  const distinct = new Set(words);
  const keys = [...new Set(q.keywords || [])];
  return words.length>=12 && distinct.size>=8 && keys.filter(k=>answer.toLowerCase().includes(k)).length>=Math.min(2,keys.length);
}
async function deliverReset(req: NextRequest, recipient: string, token: string) {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/,"");
  const url = `${base}/reset-password?token=${token}`;
  const subject = "Reset your Manthan password";
  const text = `You requested a new password for Manthan.\n\nReset your password: ${url}\n\nThis link expires in 60 minutes and can only be used once. If this wasn't you, you can ignore this email.`;
  if(localMailbox(req)) await db.devEmail.create({data:{recipient,subject,body:text}});
  if(process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.MAIL_FROM || "Manthan <hello@manthan.education>",to:recipient,subject,text}),signal:AbortSignal.timeout(10000)});
    if(!response.ok) console.error("Password reset delivery failed",response.status);
  } else if(process.env.SMTP_HOST) {
    const nodemailer = await import("nodemailer");
    await nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT || 587),secure:process.env.SMTP_PORT==="465",auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}:undefined}).sendMail({from:process.env.MAIL_FROM || "Manthan <hello@manthan.education>",to:recipient,subject,text});
  }
}

async function handler(req: NextRequest, ctx: {params:Promise<{route:string[]}>}) {
  const {route} = await ctx.params;
  const path = route.join("/");
  try {
    if(cookieAuth() && !["GET","HEAD","OPTIONS"].includes(req.method)) {
      // Only explicitly configured deployment origins may mutate cookie-authenticated data.
      // Do not trust the request's Host or forwarded visitor headers on the public internet.
      const allowed = [process.env.APP_URL,process.env.RENDER_EXTERNAL_URL].filter(Boolean).map(value=>new URL(value!).origin);
      if(!allowed.includes(req.headers.get("origin") || "")) return json({error:"This request must come from the Manthan app."},403);
    }
    if(req.method==="GET" && path==="config") return json({institutionPreview:institutionEnabled(),devMailbox:localMailbox(req),demoEnabled:demoEnabled(),generationMode:process.env.OPENAI_API_KEY?"model":"local"});
    if(req.method==="GET" && path==="health") return json({ok:true});
    if(req.method==="GET" && path==="ready") {
      try {
        await db.$queryRaw`SELECT 1`;
        const voice=await fetch(`${process.env.NARRATION_URL || "http://127.0.0.1:8101"}/health`,{signal:AbortSignal.timeout(3000),cache:"no-store"});
        if(!voice.ok) throw new Error("Voice not ready");
        return json({ok:true});
      } catch { return json({ok:false},503); }
    }
    if(req.method==="GET" && path==="dev/mailbox") {
      if(!localMailbox(req)) return json({error:"The development mailbox is available only on localhost in development."},404);
      return json(await db.devEmail.findMany({orderBy:{createdAt:"desc"},take:25}));
    }
    if(req.method==="POST" && ["auth/signup","auth/login","auth/forgot","auth/reset"].includes(path)) {
      throttle(req,path,process.env.NODE_ENV==="production"?15:100);
      const body = await req.json();
      if(path==="auth/signup") {
        const data = z.object({name:z.string().trim().min(1,"Tell us what to call you.").max(60),email:emailSchema,password:passwordSchema}).parse(body);
        if(await db.user.findUnique({where:{email:data.email}})) return json({error:"An account with that email already exists. Try logging in."},409);
        const user = await db.user.create({data:{name:data.name,email:data.email,passwordHash:await hash(data.password,12)}});
        return authResponse(user,await sessionFor(user.id,req),201);
      }
      if(path==="auth/login") {
        const data = z.object({email:emailSchema,password:z.string().max(100)}).parse(body);
        if(!demoEnabled() && data.email==="ada@manthan.education") return json({error:"The shared demo is disabled. Create your own account to continue."},403);
        const user = await db.user.findUnique({where:{email:data.email}});
        const valid = await compare(data.password,user?.passwordHash || "$2b$12$C6UzMDM.H6dfI/f/IKcEe.7ABPexJLnnzcYvGZ.u5gsQcTJRoDB..");
        if(!user || !valid) return json({error:"That email and password don’t match."},401);
        return authResponse(user,await sessionFor(user.id,req));
      }
      if(path==="auth/forgot") {
        const email = emailSchema.parse(body.email);
        const user = await db.user.findUnique({where:{email}});
        if(user) {
          const token = randomBytes(32).toString("hex");
          await db.$transaction([db.resetToken.updateMany({where:{userId:user.id,usedAt:null},data:{usedAt:new Date()}}),db.resetToken.create({data:{userId:user.id,tokenHash:digest(token),expiresAt:new Date(Date.now()+3600000)}})]);
          try { await deliverReset(req,email,token); } catch { console.error("Password reset email could not be delivered."); }
        }
        return json({message:"If an account exists for that email, we’ve sent a password-reset link."});
      }
      if(path==="auth/reset") {
        const {token,password} = z.object({token:z.string().regex(/^[a-f0-9]{64}$/,"This reset link is invalid."),password:passwordSchema}).parse(body);
        const tokenHash = digest(token);
        const found = await db.resetToken.findUnique({where:{tokenHash}});
        if(!found || found.usedAt || found.expiresAt<new Date()) return json({error:"This link has expired or was already used. Request a new one."},400);
        const passwordHash = await hash(password,12);
        await db.$transaction(async tx=>{
          const consumed = await tx.resetToken.updateMany({where:{id:found.id,usedAt:null,expiresAt:{gt:new Date()}},data:{usedAt:new Date()}});
          if(consumed.count!==1) throw new Error("This link has expired or was already used. Request a new one.");
          await tx.user.update({where:{id:found.userId},data:{passwordHash}});
          await tx.session.deleteMany({where:{userId:found.userId}});
        });
        return json({message:"Password updated. You can log in with your new password."});
      }
    }
    const session = await currentSession(req);
    if(!session) return json({error:"Please log in to continue."},401);
    const user = session.user;
    if(path==="me" && req.method==="GET") return json(safeUser(user));
    if(path==="auth/logout" && req.method==="POST") {
      await db.session.delete({where:{id:session.id}});
      const response=json({ok:true});
      if(cookieAuth()) response.cookies.set(sessionCookie,"",{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:0});
      return response;
    }
    if(path==="onboarding" && req.method==="POST") {
      const data = profileSchema.extend({goal:z.string().trim().min(5,"Add a short learning goal.").max(300),firstTopics:z.array(z.string().max(100)).max(12).default([])}).parse(await req.json());
      const updated = await db.$transaction(async tx=>{
        await tx.learningPath.upsert({where:{userId:user.id},create:{userId:user.id,goal:data.goal,firstTopics:JSON.stringify(data.firstTopics),status:"active"},update:{goal:data.goal,firstTopics:JSON.stringify(data.firstTopics)}});
        return tx.user.update({where:{id:user.id},data:{name:data.name,level:data.level,interests:JSON.stringify(data.interests),onboarded:true}});
      });
      return json(safeUser(updated));
    }
    if(!user.onboarded) return json({error:"Set up your learning path first.",redirect:"/onboarding"},403);
    if(path==="profile" && req.method==="PATCH") {
      const data = profileSchema.parse(await req.json());
      if(data.email) {
        const existing = await db.user.findUnique({where:{email:data.email}});
        if(existing && existing.id!==user.id) return json({error:"That email is already used by another account."},409);
      }
      const updated = await db.user.update({where:{id:user.id},data:{...data,interests:JSON.stringify(data.interests)}});
      return json(safeUser(updated));
    }
    if(path==="profile/password" && req.method==="POST") {
      const data = z.object({current:z.string(),password:passwordSchema}).parse(await req.json());
      if(!await compare(data.current,user.passwordHash)) return json({error:"Your current password doesn’t match."},400);
      await db.$transaction([db.user.update({where:{id:user.id},data:{passwordHash:await hash(data.password,12)}}),db.session.deleteMany({where:{userId:user.id,id:{not:session.id}}}),db.resetToken.updateMany({where:{userId:user.id,usedAt:null},data:{usedAt:new Date()}})]);
      return json({message:"Password updated. Other sessions have been signed out."});
    }
    if(path==="path" && req.method==="GET") {
      const data = await db.learningPath.findUnique({where:{userId:user.id},include:{items:{include:{lesson:{include:{attachments:{select:{filename:true,kind:true,size:true}}}}},orderBy:{lesson:{createdAt:"desc"}}}}});
      return json(data?{...data,firstTopics:JSON.parse(data.firstTopics),items:data.items.map(item=>({...item,lesson:publicLesson(item.lesson)}))}:{goal:"",status:"active",firstTopics:[],items:[]});
    }
    if(path==="institution" && req.method==="GET") {
      if(!institutionEnabled()) return json({error:"Institution preview is not enabled."},404);
      const ada = await db.user.findUnique({where:{email:"ada@manthan.education"},include:{path:{include:{items:{include:{lesson:{select:{title:true}}}}}}}});
      return json({name:ada?.name || "Ada",items:ada?.path?.items || []});
    }
    if(path==="generate" && req.method==="POST") {
      throttle(req,"generation",process.env.NODE_ENV==="production"?20:100);
      const length = Number(req.headers.get("content-length") || 0);
      if(length>21*1024*1024) return json({error:"That file is over 10 MB. Try a smaller PDF."},413);
      const form = await req.formData();
      const prompt = z.string().max(2500,"Keep your prompt under 2,500 characters.").parse(form.get("prompt") || "").trim();
      const level = z.enum(LEVELS).parse(form.get("level"));
      const uploadEntries = ["notes","assignment"].flatMap(kind=>form.getAll(kind).filter(f=>f instanceof File).map(f=>({kind:kind as "notes"|"assignment",file:f as File})));
      if(uploadEntries.length>2) return json({error:"Attach one notes PDF and one assignment at a time."},400);
      if(!prompt && !uploadEntries.length) return json({error:"Add a question or attach a file to begin."},400);
      for(const {kind,file} of uploadEntries) {
        if(file.size>10*1024*1024) return json({error:"That file is over 10 MB. Try a smaller PDF."},413);
        if(!(/\.pdf$/i.test(file.name) && ["application/pdf",""].includes(file.type)) && !(kind==="assignment" && /\.txt$/i.test(file.name) && ["text/plain",""].includes(file.type))) return json({error:kind==="notes"?"Notes must be a PDF.":"Assignments must be a PDF or plain-text (.txt) file."},400);
      }
      const stream = new ReadableStream({
        async start(controller) {
          const emit=(data:unknown)=>controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
          try {
            emit({stage:"Reading your prompt"});
            const files: AttachmentInfo[] = [];
            if(uploadEntries.length) emit({stage:"Reading the attachment"});
            for(const {kind,file} of uploadEntries) {
              const buffer = Buffer.from(await file.arrayBuffer());
              let text = "";
              if(/\.pdf$/i.test(file.name)) {
                if(!buffer.subarray(0,5).equals(Buffer.from("%PDF-"))) throw new Error("That file isn't a valid PDF. Try exporting it again.");
                // The library entrypoint tries to load a test file; use its parser directly.
                const pdf = require("pdf-parse/lib/pdf-parse.js") as (b:Uint8Array)=>Promise<{text:string}>;
                // PDF.js expects a standalone Uint8Array, not Buffer's pooled/slice semantics.
                try { text=(await pdf(new Uint8Array(buffer))).text; } catch { throw new Error("We couldn't read that PDF. Try a text-based, unencrypted PDF."); }
              } else {
                if(buffer.includes(0)) throw new Error("That assignment isn't a plain-text file.");
                text=buffer.toString("utf8");
              }
              if(text.replace(/\s/g,"").length<40) throw new Error("We found almost no text in that file. Please attach a text-based PDF or a longer plain-text assignment.");
              files.push({kind,filename:file.name.slice(0,200),size:file.size,text:text.slice(0,100000)});
            }
            emit({stage:"Writing the script"});
            const result = await generateLesson(prompt,level,files);
            emit({stage:"Storyboarding scenes"});
            if(result.content.scenes.length<4) throw new Error("The storyboard is incomplete. Try again.");
            result.content.scenes.forEach(s=>{s.durationSec=Math.max(12,Math.ceil(s.narration.split(/\s+/).length/2.4));});
            emit({stage:"Preparing narration"});
            result.content.script=result.content.scenes.map(s=>s.narration).join("\n\n");
            const pathRecord = await db.learningPath.findUniqueOrThrow({where:{userId:user.id}});
            const lesson = await db.lesson.create({data:{userId:user.id,title:result.content.title,level,pillar:result.content.pillar,prompt,content:JSON.stringify(result.content),generator:result.generator,attachments:{create:files.map(f=>({filename:f.filename,kind:f.kind,size:f.size,extractedText:f.text}))},pathItem:{create:{pathId:pathRecord.id,status:"in_progress"}}}});
            emit({done:true,id:lesson.id});
          } catch(err) {emit({error:err instanceof z.ZodError?"The lesson format needs another pass. Please retry.":err instanceof Error?err.message:"Couldn't generate this lesson. Your draft is safe. Try again."});}
          finally {controller.close();}
        }
      });
      return new Response(stream,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache, no-transform","X-Accel-Buffering":"no"}});
    }
    if(route[0]==="lessons" && route[1]) {
      const lesson = await ownLesson(route[1],user.id);
      if(!lesson) return json({error:"We couldn't find that tutorial."},404);
      if(req.method==="GET" && route.length===2) return json(publicLesson(lesson));
      if(req.method==="POST" && route[2]==="narration") {
        throttle(req,"narration",240);
        const body=z.object({sceneId:z.string().max(100),voice:z.enum(["warm","clear"]).default("warm")}).parse(await req.json());
        const content:LessonJSON=JSON.parse(lesson.content);
        const scene=content.scenes.find(s=>s.id===body.sceneId);
        if(!scene) return json({error:"That scene couldn't be found."},404);
        try {
          const response=await fetch(`${process.env.NARRATION_URL || "http://127.0.0.1:8101"}/synthesize`,{
            method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({text:scene.narration,voice:body.voice}),
            signal:AbortSignal.timeout(120000),
          });
          if(!response.ok) throw new Error("Voice worker unavailable");
          return new Response(await response.arrayBuffer(),{headers:{
            "Content-Type":"audio/wav","Cache-Control":"private, no-store",
            "X-Content-Type-Options":"nosniff",
          }});
        } catch {
          return json({error:"The natural voice couldn't load. Retry, read silently, or choose Device voice."},503);
        }
      }
      if(req.method==="POST" && route[2]==="watched") {
        await db.lesson.update({where:{id:lesson.id},data:{watched:true}});
        return json({watched:true});
      }
      if(req.method==="POST" && (route[2]==="quiz" || route[2]==="answer")) {
        if(!lesson.watched) return json({error:"Finish the tutorial before taking its quiz."},403);
        const content:LessonJSON=JSON.parse(lesson.content);
        const body=await req.json();
        if(route[2]==="answer") {
          const q=content.quiz.find(q=>q.id===body.questionId);
          if(!q) return json({error:"Question not found."},404);
          return json({correct:grade(q,body.answer),explanation:q.explanation,correctOption:q.type==="choice"?q.options?.[q.correct!]:undefined});
        }
        const answers=z.record(z.union([z.string().max(4000),z.number().int().min(0).max(3)])).parse(body.answers);
        if(content.quiz.some(q=>answers[q.id]===undefined || answers[q.id]==="")) return json({error:"Answer every question before submitting."},400);
        const results=content.quiz.map(q=>({id:q.id,correct:grade(q,answers[q.id]),explanation:q.explanation}));
        const score=Math.round(100*results.filter(r=>r.correct).length/content.quiz.length);
        const passed=score>=60;
        await db.$transaction(async tx=>{
          await tx.quizAttempt.create({data:{lessonId:lesson.id,score,answers:JSON.stringify(answers)}});
          const pathRecord=await tx.learningPath.findUniqueOrThrow({where:{userId:user.id}});
          const existing=await tx.pathItem.findUnique({where:{lessonId:lesson.id}});
          await tx.pathItem.upsert({where:{lessonId:lesson.id},create:{pathId:pathRecord.id,lessonId:lesson.id,status:passed?"completed":"in_progress",latestScore:score,completedAt:passed?new Date():null},update:{latestScore:score,...(passed?{status:"completed",completedAt:existing?.completedAt || new Date()}: {})}});
        });
        return json({score,passed,results,message:passed?"Added to your learning path.":"Not quite yet. Review the explanations and give it another try."});
      }
    }
    return json({error:"That page couldn't be found."},404);
  } catch(err) {
    if(err instanceof z.ZodError) return json({error:err.errors[0]?.message || "Check your input.",fields:err.flatten().fieldErrors},400);
    console.error("API request failed",err instanceof Error?err.message:"Unknown");
    return json({error:err instanceof Error && /Too many|link has/.test(err.message)?err.message:"Something went wrong. Please try again."},400);
  }
}
export const GET=handler;
export const POST=handler;
export const PATCH=handler;
