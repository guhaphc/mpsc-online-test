"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { STUDY_MATERIAL_SUBJECTS } from "@/lib/study-material-subjects";

const subjects = STUDY_MATERIAL_SUBJECTS;

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
