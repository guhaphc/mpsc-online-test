"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const subjects = [
  { icon:"🏛️", name:"Indian Polity & Governance", key:"polity" },
  { icon:"📜", name:"Ancient History", key:"ancient-history" },
  { icon:"🏰", name:"Medieval History", key:"medieval-history" },
  { icon:"🇮🇳", name:"Modern Indian History", key:"modern-history" },
  { icon:"🌍", name:"World History", key:"world-history" },
  { icon:"🎭", name:"Indian Culture", key:"indian-culture" },
  { icon:"🗺️", name:"Physical Geography", key:"physical-geography" },
  { icon:"🌏", name:"Indian Geography", key:"indian-geography" },
  { icon:"👥", name:"Indian Society", key:"indian-society" },
  { icon:"🌾", name:"Agriculture", key:"agriculture" },
  { icon:"💹", name:"Indian Economy", key:"economy" },
  { icon:"🏭", name:"Industry & Infrastructure", key:"industry-infrastructure" },
  { icon:"🔬", name:"Science & Technology", key:"science-technology" },
  { icon:"🛡️", name:"Defence & Security", key:"defence-security" },
  { icon:"☢️", name:"Nuclear Energy & Technology", key:"nuclear-energy" },
  { icon:"🧬", name:"Nano Technology", key:"nanotechnology" },
  { icon:"📚", name:"Intellectual Property Rights", key:"ipr" },
  { icon:"🌱", name:"Environment & Ecology", key:"environment-ecology" },
  { icon:"🌡️", name:"Climate Change", key:"climate-change" },
  { icon:"🚨", name:"Internal Security", key:"internal-security" },
  { icon:"🌪️", name:"Disaster Management", key:"disaster-management" },
  { icon:"⚖️", name:"Ethics, Integrity & Aptitude", key:"ethics" },
  { icon:"🧠", name:"Applied Ethics", key:"applied-ethics" },
  { icon:"📝", name:"Essay", key:"essay" },
];

export default function StudyMaterialPage() {
  const router = useRouter();
  const [loading,setLoading]=useState(true);

  useEffect(() => {
    (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){router.replace("/");return;}
      const {data:profile}=await supabase.from("mpsc_profiles").select("role,access_status").eq("id",user.id).single();
      if(profile?.role==="admin" && profile?.access_status==="approved"){router.replace("/admin");return;}
      if(profile?.access_status!=="approved"){router.replace("/pending");return;}
      setLoading(false);
    })();
  },[router]);

  if(loading) return <main className="page"><section className="card"><p>Checking your access...</p></section></main>;

  return (
    <main className="page">
      <section className="card">
        <div className="admin-head">
          <div>
            <div className="brand">MPSC / UPSC</div>
            <h1>Study Material</h1>
            <p className="muted">Select a UPSC subject to access subject-wise study material.</p>
          </div>
          <button type="button" className="secondary" onClick={()=>router.push("/student")}>Dashboard</button>
        </div>

        <div className="dashboard-grid">
          {subjects.map(subject=>(
            <button
              type="button"
              className="dashboard-item"
              key={subject.key}
              onClick={()=>router.push(`/study-material/${subject.key}`)}
            >
              <strong>{subject.icon} {subject.name}</strong>
              <span>Open subject study material</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
