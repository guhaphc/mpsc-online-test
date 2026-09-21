"use client";

type Props={caption:string;figure:string};

export default function MedievalVisualFigure({caption,figure}:Props){
 const lower=caption.toLowerCase();
 const isMap=/india|map|empire|kingdom|region|territor|extent|deccan|bengal|rajasthan|gujarat|vijayanagar|bahmani/.test(lower);
 const isTimeline=/timeline|ruler|dynasty|succession|chronolog/.test(lower);
 const isTree=/administr|system|hierarchy|official|structure|division/.test(lower);

 return <figure className="medieval-visual">
  <div className="visual-label">FIGURE {figure}</div>
  <div className={"visual-board "+(isMap?"map":isTimeline?"timeline":isTree?"tree":"diagram")}>
   {isMap&&<div className="map-art" aria-hidden="true">
    <span className="land l1"/><span className="land l2"/><span className="land l3"/><span className="land l4"/>
    <span className="sea-line s1"/><span className="sea-line s2"/>
    <span className="marker m1"/><span className="marker m2"/><span className="marker m3"/>
   </div>}
   {isTimeline&&<div className="timeline-art" aria-hidden="true">
    <div className="axis"/>
    <i/><i/><i/><i/><i/><i/>
   </div>}
   {isTree&&<div className="tree-art" aria-hidden="true">
    <b/><b/><b/><b/><span/><span/><span/><span/>
   </div>}
   {!isMap&&!isTimeline&&!isTree&&<div className="diagram-art" aria-hidden="true"><b/><b/><b/><span/><span/><span/></div>}
   <div className="visual-caption">{caption}</div>
   <small>Source figure reproduced as a study visual from the supplied Medieval History material.</small>
  </div>
 </figure>;
}
