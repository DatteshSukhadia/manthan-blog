import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { localLesson } from "../lib/generator";
import { Level } from "../lib/types";
const db = new PrismaClient();
async function main() {
  if (await db.user.findUnique({where:{email:"ada@manthan.education"}})) return;
  const user = await db.user.create({data:{name:"Ada",email:"ada@manthan.education",passwordHash:await hash("ManthanDemo!",12),level:"University",interests:JSON.stringify(["Artificial intelligence","Fintech","Medtech"]),onboarded:true,bio:"Connecting the dots, one big idea at a time.",path:{create:{goal:"Understand how AI connects to the world around me.",status:"active"}}},include:{path:true}});
  const seeds: [string,Level,number|null,number][] = [["How a transformer pays attention","University",80,3],["How algorithmic trading works, in plain English","Working professional",100,2],["Digital biomarkers as the new lab tests","University",null,1]];
  for (const [prompt,level,score,days] of seeds) {
    const content = localLesson(prompt,level,[]);
    const createdAt = new Date(Date.now()-days*86400000);
    const lesson = await db.lesson.create({data:{userId:user.id,title:content.title,level,pillar:content.pillar,prompt,content:JSON.stringify(content),watched:true,createdAt}});
    await db.pathItem.create({data:{pathId:user.path!.id,lessonId:lesson.id,status:score===null?"in_progress":"completed",latestScore:score,completedAt:score===null?null:createdAt}});
    if(score!==null) await db.quizAttempt.create({data:{lessonId:lesson.id,score,answers:JSON.stringify({seed:true}),createdAt}});
  }
  console.log("Demo learner ready: ada@manthan.education");
}
main().finally(()=>db.$disconnect());
