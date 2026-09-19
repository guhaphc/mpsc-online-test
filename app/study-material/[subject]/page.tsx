"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const subjects:Record<string,string>={
 "polity":"Indian Polity & Governance",
 "ancient-history":"Ancient History",
 "medieval-history":"Medieval History",
 "modern-history":"Modern Indian History",
 "world-history":"World History",
 "indian-culture":"Indian Culture",
 "physical-geography":"Physical Geography",
 "indian-geography":"Indian Geography",
 "indian-society":"Indian Society",
 "agriculture":"Agriculture",
 "economy":"Indian Economy",
 "industry-infrastructure":"Industry & Infrastructure",
 "science-technology":"Science & Technology",
 "defence-security":"Defence & Security",
 "nuclear-energy":"Nuclear Energy & Technology",
 "nanotechnology":"Nano Technology",
 "ipr":"Intellectual Property Rights",
 "environment-ecology":"Environment & Ecology",
 "climate-change":"Climate Change",
 "internal-security":"Internal Security",
 "disaster-management":"Disaster Management",
 "ethics":"Ethics, Integrity & Aptitude",
 "applied-ethics":"Applied Ethics",
 "essay":"Essay"
};

export default function StudyMaterialSubjectPage(){
 const router=useRouter();
 const params=useParams<{subject:string}>();
 const [loading,setLoading]=useState(true);
 const title=subjects[params?.subject||""]||"Study Material";

 useEffect(()=>{(async()=>{
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/");return;}
  const {data:profile}=await supabase.from("mpsc_profiles").select("role,access_status").eq("id",user.id).single();
  if(profile?.role==="admin"&&profile?.access_status==="approved"){router.replace("/admin");return;}
  if(profile?.access_status!=="approved"){router.replace("/pending");return;}
  setLoading(false);
 })()},[router]);

 if(loading)return <main className="page"><section className="card"><p>Checking your access...</p></section></main>;

 return <main className="page"><section className="card">
  <div className="admin-head"><div><div className="brand">MPSC / UPSC</div><h1>{title}</h1><p className="muted">Subject-wise study material</p></div><button className="secondary" onClick={()=>router.push("/study-material")}>All Subjects</button></div>
  <div className="empty-box"><strong>Study material will appear here.</strong><span>This subject section is ready for the next module.</span></div>
 </section></main>;
}
