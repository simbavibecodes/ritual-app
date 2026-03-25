import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const DEFAULT_SKIN = [
  { id: "tretinoin",    label: "Tretinoin",          emoji: "🔬" },
  { id: "spf",          label: "SPF",                emoji: "☀️" },
  { id: "alpyn_serum",  label: "Alpyn Serum",        emoji: "🌿" },
  { id: "el_serum",     label: "Estee Lauder Serum", emoji: "✨" },
  { id: "sleeping_mask",label: "Sleeping Mask",      emoji: "🌙" },
  { id: "lash_serum",   label: "Eyelash Serum",      emoji: "👁️" },
];
const DEFAULT_HAIR = [
  { id: "rosemary_oil", label: "Rosemary Oil", emoji: "🌿" },
  { id: "minoxidil",    label: "Minoxidil",    emoji: "💊" },
  { id: "biotin",       label: "Biotin",       emoji: "🌱" },
];
const MOODS = ["✨ Glowing", "😊 Good", "😐 Okay", "😞 Bad"];
const EMOJI_OPTIONS = [
  // Skincare & beauty
  "🫧","💧","✨","🌿","☀️","👁️","🔬","🎭","🪨","🧴","🧼","💄","💋","👄","🪞","🪥","🧹","🫦","💅","🪷",
  // Hair
  "🚿","🫙","💆","🌺","🔥","🌱","☁️","💇","🪮","✂️","🎀","🪢","🧖","💈",
  // Nature & plants
  "🌸","🍃","🌷","🌼","🌻","🌹","🍀","🌴","🌵","🎋","🎍","🍂","🍁","🌾","🪸","🪴","🌊","🫚",
  // Food & wellness
  "🍋","🥥","🫐","🍓","🥑","🫒","🍯","🧃","🫖","🍵","🧊","🫧","🫐","🍇","🥦",
  // Health & wellness  
  "🧘","💊","🩺","🩹","🩻","💉","🧪","🫀","🧠","🦷","👃","🌡️","⚕️","🏃","🧗","🤸",
  // Gems, stars & magic
  "💎","🌙","⭐","🌟","💫","✨","🌞","🌈","⚡","🔮","🪄","💜","🩵","🩷","❤️","🧡","💛","💚",
  // Objects & tools
  "🪨","🫶","🧁","🕯️","🛁","🪣","🧺","🎁","🪬","📿","🧿","🪩","💌","🫧","🧋","🥤"
];
const DOW = ["Mo","Tu","We","Th","Fr","Sa","Su"]; // Week starts Monday

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);

const HamburgerBtn = ({onClick}) => (
  <button className="hamburger-btn" onClick={onClick}><span/><span/><span/></button>
);

const fmt      = d => d.toLocaleDateString("en-CA");
const parse    = s => { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const dispLong = s => parse(s).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
const uid      = () => crypto.randomUUID();
// Platform-agnostic URL opener — swap body for Capacitor Browser plugin when going native
const openUrl  = (url, target = "_blank") => window.open(url, target);
// String similarity via normalised Levenshtein (0 = nothing in common, 1 = identical)
const strSimilarity = (a="", b="") => {
  a = a.toLowerCase().trim(); b = b.toLowerCase().trim();
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const m = a.length, n = b.length;
  let prev = Array.from({length:n+1},(_,j)=>j);
  for (let i=1;i<=m;i++){
    const cur=[i];
    for(let j=1;j<=n;j++) cur[j]=a[i-1]===b[j-1]?prev[j-1]:1+Math.min(prev[j],cur[j-1],prev[j-1]);
    prev=cur;
  }
  return 1 - prev[n]/Math.max(m,n);
};
function daysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function dateRange(start, end) {
  const dates=[], s=parse(start), e=parse(end);
  if(s>e) return dates;
  const cur=new Date(s);
  while(cur<=e){ dates.push(fmt(new Date(cur))); cur.setDate(cur.getDate()+1); }
  return dates;
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#fdf6f0;min-height:100vh;color:#3a2e27}
.app{max-width:680px;margin:0 auto;padding:0 16px max(100px,calc(68px + env(safe-area-inset-bottom)))}
.header{text-align:center;padding:calc(36px + env(safe-area-inset-top)) 0 28px;border-bottom:1px solid #e8d8cc;margin-bottom:24px}
.header-title{font-family:'Cormorant Garamond',serif;font-size:2.4rem;font-weight:300;letter-spacing:.04em;color:#3a2e27;line-height:1.1}
.header-title span{font-style:italic;color:#b07a5e}
.header-sub{font-size:.78rem;letter-spacing:.15em;text-transform:uppercase;color:#a08070;margin-top:7px}
.top-tabs{display:flex;gap:0;margin-bottom:24px;background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:30px;padding:4px}
.top-tab{flex:1;background:none;border:none;border-radius:26px;padding:9px 4px;font-family:'DM Sans',sans-serif;font-size:.76rem;letter-spacing:.1em;text-transform:uppercase;color:#a08070;cursor:pointer;transition:all .2s;white-space:nowrap;text-align:center}
.top-tab.active{background:#b07a5e;color:#fff;box-shadow:0 1px 6px rgba(176,122,94,.3)}
.top-tab:hover:not(.active){color:#7a5c48}
.sub-tabs{display:flex;gap:8px;margin-bottom:20px}
.sub-tab{flex:1;background:none;border:1.5px solid #e8d8cc;border-radius:30px;padding:8px 0;font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;color:#a08070;cursor:pointer;transition:all .2s}
.sub-tab.active{background:#7a9e7a;border-color:#7a9e7a;color:#fff}
.sub-tab:hover:not(.active){background:#f0f5f0}
.date-nav{display:flex;align-items:center;justify-content:space-between;background:#fff8f3;border:1px solid #e8d8cc;border-radius:14px;padding:13px 16px;margin-bottom:20px}
.dnb{background:none;border:none;cursor:pointer;font-size:1.2rem;color:#b07a5e;padding:4px 10px;border-radius:8px;transition:background .15s;line-height:1}
.dnb:hover{background:#f0e0d4}
.dnb:disabled{opacity:.3;cursor:default}
.date-label{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:400;color:#3a2e27;text-align:center}
.date-label.is-today{color:#b07a5e;font-style:italic}
.sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.sec-title{font-family:'Cormorant Garamond',serif;font-size:1.35rem;font-weight:300;font-style:italic;color:#7a5c48}
.ghost-btn{background:none;border:1.5px solid #e8d8cc;border-radius:20px;padding:5px 13px;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#a08070;cursor:pointer;transition:all .18s}
.ghost-btn:hover{background:#f7ece4;border-color:#c89a7e;color:#7a5c48}
.routine-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:24px}
.r-item{display:flex;align-items:center;gap:9px;background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:12px;padding:11px 13px;cursor:pointer;transition:all .28s;user-select:none;overflow:hidden}
.r-item:hover:not(.on){border-color:#c89a7e;background:#fef2ea}
.r-item.on{background:#eef4ee;border-color:#6a9e6a;padding:7px 12px;border-radius:20px;gap:6px;opacity:.78}
.r-emoji{font-size:1rem;flex-shrink:0;transition:all .28s}
.r-item.on .r-emoji{font-size:.78rem;opacity:.6}
.r-label{font-size:.8rem;color:#8a6858;flex:1;line-height:1.3;transition:all .28s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.r-item.on .r-label{font-size:.72rem;color:#3a5a3a;text-decoration:line-through;text-decoration-color:#3a5a3a;text-decoration-thickness:1.5px}
.r-check{width:17px;height:17px;border-radius:50%;border:1.5px solid #d0b0a0;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .28s}
.r-item.on .r-check{width:15px;height:15px;background:#2d4a2d;border-color:#2d4a2d}
.r-check svg{display:none}
.r-item.on .r-check svg{display:block}
.add-card{background:#fff8f3;border:1.5px dashed #d0b8aa;border-radius:12px;padding:11px 13px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;transition:all .18s;color:#b07a5e;font-size:.8rem}
.add-card:hover{background:#fef2ea;border-color:#b07a5e}
.mood-row{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:24px}
.mood-chip{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:30px;padding:6px 13px;font-size:.78rem;cursor:pointer;transition:all .18s;color:#8a6858}
.mood-chip.on{background:#f7e8de;border-color:#b07a5e;color:#3a2e27;font-weight:500}
.mood-chip:hover:not(.on){background:#fef2ea;border-color:#c89a7e}
.notes-wrap{margin-bottom:24px}
.notes-area{width:100%;min-height:80px;background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:12px 12px 0 0;padding:13px;font-family:'DM Sans',sans-serif;font-size:.86rem;color:#3a2e27;resize:vertical;outline:none;transition:border .18s;line-height:1.6;border-bottom:none}
.notes-area:focus{border-color:#b07a5e}
.notes-area::placeholder{color:#c0a898;font-style:italic}
.notes-toolbar{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:0 0 12px 12px;border-top:1px solid #f0e0d4;padding:8px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.photo-upload-btn{display:flex;align-items:center;gap:6px;background:none;border:1px solid #e8d8cc;border-radius:16px;padding:5px 12px;font-size:.74rem;color:#a08070;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.photo-upload-btn:hover{background:#f0e0d4;border-color:#c89a7e;color:#7a5c48}
.photo-input{display:none}
.photo-thumbs{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.photo-thumb{position:relative;width:72px;height:72px;border-radius:10px;overflow:hidden;border:1.5px solid #e8d8cc;flex-shrink:0}
.photo-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.photo-remove{position:absolute;top:3px;right:3px;width:18px;height:18px;border-radius:50%;background:rgba(58,46,39,.75);border:none;color:#fff;font-size:.75rem;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}
.photo-full{width:100%;border-radius:12px;overflow:hidden;margin-bottom:10px;border:1.5px solid #e8d8cc}
.photo-full img{width:100%;display:block;max-height:280px;object-fit:cover}
.prog-wrap{background:#eedad2;border-radius:10px;height:5px;overflow:hidden}
.prog-bar{height:100%;background:#b07a5e;border-radius:10px;transition:width .3s ease}
.save-btn{width:100%;background:#b07a5e;color:#fff;border:none;border-radius:12px;padding:14px;font-family:'DM Sans',sans-serif;font-size:.83rem;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:background .2s;margin-top:4px}
.save-btn:hover{background:#9a6248}
.save-btn:disabled{opacity:.4;cursor:not-allowed}
.cal-wrap{background:#fff8f3;border:1px solid #e8d8cc;border-radius:16px;overflow:hidden;margin-bottom:16px}
.cal-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #eedad2}
.cal-month{font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-weight:400;color:#3a2e27}
.cal-nav{background:none;border:none;cursor:pointer;font-size:1.1rem;color:#b07a5e;padding:4px 10px;border-radius:8px;transition:background .15s;line-height:1}
.cal-nav:hover{background:#f0e0d4}
.cal-dow{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;padding:8px 10px 4px}
.cal-dow-cell{font-size:.68rem;letter-spacing:.06em;text-transform:uppercase;color:#b09080;font-weight:500}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);padding:4px 10px 12px;gap:2px}
.cal-cell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:.82rem;cursor:pointer;transition:all .12s;position:relative;color:#3a2e27}
.cal-cell:hover:not(.empty){background:#f0e0d4}
.cal-cell.empty{cursor:default}
.cal-cell.has-entry{font-weight:600}
.cal-cell.today-cell{color:#b07a5e;font-weight:600}
.cal-cell.selected-cell{background:#b07a5e !important;color:#fff !important}
.cal-cell.range-mode-cell{background:#b07a5e !important;color:#fff !important;box-shadow:0 0 0 2px #fff,0 0 0 4px #b07a5e;border-radius:50%}
.cal-cell.future-cell{color:#c8b0a0}
.cal-cell.in-range{background:#f7e8de;border-radius:0}
.cal-cell.range-start{background:#b07a5e !important;color:#fff !important;border-radius:50% 0 0 50%}
.cal-cell.range-end{background:#b07a5e !important;color:#fff !important;border-radius:0 50% 50% 0}
.cal-cell.range-start.range-end{border-radius:50%}
.cal-dot{width:4px;height:4px;border-radius:50%;background:#b07a5e;position:absolute;bottom:3px}
.cal-cell.selected-cell .cal-dot,.cal-cell.range-start .cal-dot,.cal-cell.range-end .cal-dot{background:#fff}
.range-toggle{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#fff8f3;border:1px solid #e8d8cc;border-radius:12px;margin-bottom:14px}
.range-toggle-lbl{font-size:.8rem;color:#7a5c48;font-weight:500}
.range-hint{font-size:.71rem;color:#a08070;margin-top:2px}
.day-panel{background:#fff8f3;border:1px solid #e8d8cc;border-radius:16px;padding:18px;margin-bottom:24px}
.day-panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px}
.day-panel-date{font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:#3a2e27;font-style:italic;flex:1}
.day-edit-btn{background:#b07a5e;color:#fff;border:none;border-radius:20px;padding:6px 14px;font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:background .18s;white-space:nowrap}
.day-edit-btn:hover{background:#9a6248}
.dp-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.dp-pill{background:#f7e8de;border-radius:20px;padding:4px 10px;font-size:.74rem;color:#7a5c48}
.dp-pill.h{background:#e8f0e8;color:#4a6848}
.dp-note{font-size:.82rem;color:#6a5848;font-style:italic;line-height:1.5;margin-top:6px}
.dp-mood{font-size:.76rem;color:#a08070;margin-top:5px}
.dp-empty{font-size:.86rem;color:#b09080;font-style:italic;text-align:center;padding:12px 0}
.dp-scheduled{font-size:.78rem;color:#7a9e7a;font-weight:500;margin-bottom:8px}
.freq-card{background:#fff8f3;border:1px solid #e8d8cc;border-radius:14px;padding:16px;margin-bottom:10px}
.freq-top{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.freq-emoji{font-size:1.2rem}
.freq-label{flex:1;font-size:.9rem;color:#3a2e27;font-weight:500}
.freq-count{font-size:.78rem;color:#b07a5e;font-weight:500;white-space:nowrap}
.freq-bar-bg{background:#eedad2;border-radius:8px;height:7px;overflow:hidden}
.freq-bar-fill{height:100%;background:linear-gradient(90deg,#c89a7e,#b07a5e);border-radius:8px;transition:width .4s ease}
.freq-sub{font-size:.72rem;color:#a08070;margin-top:5px}
.period-row{display:flex;gap:8px;margin-bottom:18px}
.period-chip{flex:1;background:none;border:1.5px solid #e8d8cc;border-radius:20px;padding:7px 0;font-size:.76rem;text-align:center;color:#a08070;cursor:pointer;transition:all .15s}
.period-chip.on{background:#b07a5e;border-color:#b07a5e;color:#fff}
.sched-card{background:linear-gradient(135deg,#f7ece4 0%,#fdf0e8 100%);border:1.5px solid #d4a888;border-radius:14px;padding:14px;margin-bottom:10px}
.sched-card.treatment-card{background:linear-gradient(135deg,#fde8e0 0%,#fdf4f0 100%);border-color:#e8a898}
.sched-top{display:flex;align-items:center;gap:10px}
.sched-label{flex:1;font-size:.84rem;color:#5a3a27;font-weight:500}
.sched-reminder{font-size:.7rem;color:#9a7a5a;margin-top:3px;padding-left:28px}
.add-sched-btn{width:100%;background:none;border:1.5px dashed #d0b8aa;border-radius:12px;padding:12px;font-size:.82rem;color:#b07a5e;cursor:pointer;transition:all .18s;margin-top:4px;font-family:'DM Sans',sans-serif}
.add-sched-btn:hover{background:#fef2ea;border-color:#b07a5e}
.treatment-banner{background:#fde8e0;border:1.5px solid #e8a898;border-radius:12px;padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .25s}
.treatment-banner:hover{background:#fad8cc}
.treatment-banner.done{background:#eef4ee;border-color:#6a9e6a;opacity:.75}
.treatment-banner.done .tb-text{color:#2d4a2d;text-decoration:line-through;text-decoration-color:#2d4a2d}
.tb-text{flex:1;font-size:.82rem;color:#c05040;font-weight:500;line-height:1.4}
.tb-dot{width:8px;height:8px;border-radius:50%;background:#e06050;flex-shrink:0;transition:background .25s}
.treatment-banner.done .tb-dot{background:#2d4a2d}
.overlay{position:fixed;inset:0;background:rgba(58,46,39,.42);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(2px);padding:16px}
.modal{background:#fdf6f0;border-radius:24px;padding:26px 22px 36px;width:100%;max-width:500px;max-height:88vh;overflow-y:auto}
.modal-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}
.modal-title{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:300;font-style:italic;color:#3a2e27}
.modal-x{background:none;border:none;font-size:1.5rem;cursor:pointer;color:#a08070;line-height:1;padding:0}
.modal-x:hover{color:#3a2e27}
.modal-sub{font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:#a08070;margin-bottom:10px}
.modal-hr{border:none;border-top:1px solid #e8d8cc;margin:18px 0}
.row{display:flex;gap:9px;align-items:stretch}
.ifield{flex:1;background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:10px;padding:9px 13px;font-family:'DM Sans',sans-serif;font-size:.86rem;color:#3a2e27;outline:none;transition:border .18s}
.ifield::placeholder{color:#c0a898;font-style:italic}
.ifield:focus{border-color:#b07a5e}
.epick-btn{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:10px;width:46px;flex-shrink:0;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border .18s}
.epick-btn:hover{border-color:#b07a5e}
.confirm-btn{background:#b07a5e;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:background .2s;white-space:nowrap;flex-shrink:0}
.confirm-btn:hover{background:#9a6248}
.confirm-btn:disabled{opacity:.35;cursor:not-allowed}
.egrid{display:flex;flex-wrap:wrap;gap:5px;background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:10px;padding:10px}
.eopt{font-size:1.2rem;cursor:pointer;padding:4px 6px;border-radius:6px;transition:background .12s}
.eopt:hover{background:#f0e0d4}
.eopt.on{background:#f7e8de;outline:2px solid #b07a5e}
.m-item{display:flex;align-items:center;gap:11px;background:#fff8f3;border:1px solid #e8d8cc;border-radius:10px;padding:9px 13px;margin-bottom:7px}
.m-item-lbl{flex:1;font-size:.83rem;color:#3a2e27}
.m-rem-btn{background:none;border:1px solid #e8c0b0;border-radius:6px;padding:3px 9px;font-size:.72rem;color:#c07060;cursor:pointer;transition:all .15s}
.m-rem-btn:hover{background:#fde8e0;border-color:#c07060}
.dow-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.dow-chip{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:20px;padding:5px 11px;font-size:.76rem;color:#8a6858;cursor:pointer;transition:all .15s}
.dow-chip.on{background:#7a9e7a;border-color:#7a9e7a;color:#fff}
.toggle-row{display:flex;align-items:center;justify-content:space-between;background:#fff8f3;border:1px solid #e8d8cc;border-radius:10px;padding:10px 14px;margin-bottom:10px}
.toggle-lbl{font-size:.84rem;color:#3a2e27}
.toggle-sub{font-size:.72rem;color:#a08070;margin-top:2px}
.toggle-switch{width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;transition:background .2s;position:relative;flex-shrink:0}
.toggle-switch.on{background:#7a9e7a}
.toggle-switch.off{background:#d0b8aa}
.toggle-knob{position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.15)}
.toggle-switch.on .toggle-knob{left:21px}
.toggle-switch.off .toggle-knob{left:3px}
.time-input{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:10px;padding:8px 13px;font-family:'DM Sans',sans-serif;font-size:.86rem;color:#3a2e27;outline:none;transition:border .18s;width:130px}
.time-input:focus{border-color:#7a9e7a}
.del-btn{background:none;border:1px solid #e8c0b0;border-radius:6px;padding:3px 9px;font-size:.72rem;color:#c07060;cursor:pointer;transition:all .15s}
.del-btn:hover{background:#fde8e0;border-color:#c07060}
.freq-toggle-item{display:flex;align-items:center;gap:11px;background:#fff8f3;border:1px solid #e8d8cc;border-radius:10px;padding:9px 13px;margin-bottom:7px;cursor:pointer;transition:all .15s}
.freq-toggle-item.on{border-color:#b07a5e;background:#fef2ea}
.fti-check{width:18px;height:18px;border-radius:4px;border:1.5px solid #d0b0a0;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .18s}
.freq-toggle-item.on .fti-check{background:#b07a5e;border-color:#b07a5e}
.reminder-banner{background:#fde8e0;border:1.5px solid #e8b0a0;border-radius:12px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .25s;user-select:none}
.reminder-banner:hover{background:#fad8cc}
.reminder-banner.done{background:#eef4ee;border-color:#6a9e6a;opacity:.7;padding:7px 14px}
.rb-text{flex:1;font-size:.82rem;color:#c05040;line-height:1.5;font-weight:500;transition:color .25s}
.reminder-banner.done .rb-text{color:#2d4a2d;text-decoration:line-through;text-decoration-color:#2d4a2d;font-weight:400}
.rb-dot{width:8px;height:8px;border-radius:50%;background:#e06050;flex-shrink:0;transition:background .25s}
.reminder-banner.done .rb-dot{background:#2d4a2d}
.name-prompt-overlay{position:fixed;inset:0;background:rgba(58,46,39,.5);display:flex;align-items:center;justify-content:center;z-index:300;backdrop-filter:blur(3px);padding:24px}
.name-prompt{background:#fdf6f0;border-radius:24px;padding:36px 28px;width:100%;max-width:360px;text-align:center}
.name-prompt-title{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:300;color:#3a2e27;margin-bottom:6px}
.name-prompt-title span{font-style:italic;color:#b07a5e}
.name-prompt-sub{font-size:.8rem;color:#a08070;margin-bottom:24px;line-height:1.5}
.hair-length-card{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:14px;padding:16px 18px;margin-bottom:20px}
.hair-length-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-style:italic;color:#7a5c48;margin-bottom:4px}
.hair-length-sub{font-size:.74rem;color:#a08070;margin-bottom:14px}
.hair-length-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.hair-length-month{font-size:.8rem;color:#7a5c48;font-weight:500;min-width:80px}
.hair-length-input{flex:1;background:#fdf6f0;border:1.5px solid #e8d8cc;border-radius:10px;padding:8px 12px;font-family:'DM Sans',sans-serif;font-size:.86rem;color:#3a2e27;outline:none;transition:border .18s}
.hair-length-input:focus{border-color:#7a9e7a}
.hair-length-input::placeholder{color:#c0a898;font-style:italic}
.hair-length-save{background:#7a9e7a;color:#fff;border:none;border-radius:10px;padding:8px 14px;font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:background .18s;font-family:'DM Sans',sans-serif;white-space:nowrap}
.hair-length-save:hover{background:#5a7e5a}
.hair-history-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f0e0d4}
.hair-history-row:last-child{border-bottom:none}
.hair-history-month{font-size:.8rem;color:#7a5c48}
.hair-history-val{font-size:.9rem;color:#3a2e27;font-weight:500}
.hair-growth-badge{font-size:.72rem;color:#7a9e7a;margin-left:8px}
.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#3a2e27;color:#fff;padding:11px 22px;border-radius:30px;font-size:.8rem;letter-spacing:.08em;animation:fiu .3s ease,fout .3s ease 1.7s forwards;z-index:300;white-space:nowrap}
.hamburger-btn{position:absolute;top:36px;right:16px;background:none;border:none;cursor:pointer;padding:6px;display:flex;flex-direction:column;gap:5px;z-index:10}
.hamburger-btn span{display:block;width:22px;height:2px;background:#b07a5e;border-radius:2px;transition:all .2s}
.side-menu{position:fixed;top:0;right:0;bottom:0;width:260px;background:#fdf6f0;border-left:1.5px solid #e8d8cc;z-index:400;padding:calc(48px + env(safe-area-inset-top)) 24px max(32px,calc(16px + env(safe-area-inset-bottom)));display:flex;flex-direction:column;gap:0;box-shadow:-4px 0 20px rgba(58,46,39,.1);transform:translateX(100%);transition:transform .28s ease}
.side-menu.open{transform:translateX(0)}
.side-menu-overlay{position:fixed;inset:0;z-index:399;background:rgba(58,46,39,.25)}
.side-menu-title{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:300;font-style:italic;color:#3a2e27;margin-bottom:28px}
.side-menu-item{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #f0e0d4;font-size:.88rem;color:#5a3a27;cursor:pointer;transition:color .15s;background:none;border-left:none;border-right:none;border-top:none;width:100%;text-align:left;font-family:'DM Sans',sans-serif}
.side-menu-item:hover{color:#b07a5e}
.side-menu-item:last-child{border-bottom:none}
.purch-card{background:linear-gradient(135deg,#fff8f3 0%,#fdf2ec 100%);border:1.5px solid #e8d8cc;border-radius:14px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px}
.purch-info{flex:1}
.purch-name{font-size:.88rem;color:#3a2e27;font-weight:500}
.purch-meta{font-size:.72rem;color:#a08070;margin-top:2px}
.purch-price{font-size:1rem;color:#b07a5e;font-weight:600;white-space:nowrap}
.spend-card{background:linear-gradient(135deg,#f7ece4 0%,#fdf0e8 100%);border:1.5px solid #d4a888;border-radius:14px;padding:16px;margin-bottom:10px}
.spend-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f0e0d4;font-size:.84rem}
.spend-row:last-child{border-bottom:none}
.spend-label{color:#7a5c48}
.spend-val{color:#b07a5e;font-weight:600}
@keyframes fiu{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.bottom-sheet-overlay{position:fixed;inset:0;background:rgba(58,46,39,.38);z-index:250;backdrop-filter:blur(2px)}
.bottom-sheet{position:fixed;left:max(0px,calc(50% - 340px));right:max(0px,calc(50% - 340px));bottom:0;z-index:251;background:#fdf6f0;border-radius:22px 22px 0 0;padding:22px 20px max(28px,calc(16px + env(safe-area-inset-bottom)));box-shadow:0 -6px 32px rgba(58,46,39,.14);max-height:88vh;overflow-y:auto;animation:sheetUp .26s cubic-bezier(.4,0,.2,1)}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fout{to{opacity:0}}
`;

function CheckIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button className={`toggle-switch ${on?"on":"off"}`} onClick={()=>onChange(!on)}>
      <div className="toggle-knob"/>
    </button>
  );
}

function Lightbox({ photo, onClose, onDelete }) {
  const download = () => {
    const a = document.createElement("a");
    a.href = photo.src;
    a.download = photo.name || "photo.jpg";
    a.click();
  };
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:9999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:500,display:"flex",flexDirection:"column",gap:12}}>
        <img src={photo.src} alt={photo.name} style={{width:"100%",maxHeight:"70vh",objectFit:"contain",borderRadius:14}}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={download}
            style={{flex:1,background:"#b07a5e",border:"none",borderRadius:12,padding:"13px",color:"#fff",fontSize:".86rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:".04em"}}>
            ↓ Download
          </button>
          <button onClick={()=>{onDelete(photo.id);onClose();}}
            style={{flex:1,background:"#c07060",border:"none",borderRadius:12,padding:"13px",color:"#fff",fontSize:".86rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:".04em"}}>
            Delete
          </button>
          <button onClick={onClose}
            style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:12,padding:"13px 18px",color:"#fff",fontSize:".86rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoNotes({ notes, photos, onNotesChange, onPhotosChange, hidePhotos }) {
  const fileRef = useRef();
  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = e => {
        onPhotosChange(prev => [...(Array.isArray(prev)?prev:[]), { id: uid(), src: e.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };
  const removePhoto = (id) => onPhotosChange(prev => prev.filter(p => p.id !== id));
  return (
    <div className="notes-wrap">
      <textarea className="notes-area" placeholder="Any reactions, new products, skin concerns…"
        value={notes} onChange={e=>onNotesChange(e.target.value)}/>
      <div className="notes-toolbar">
        <button className="photo-upload-btn" onClick={()=>fileRef.current.click()}>
          📷 Add photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="photo-input"
          onChange={e=>handleFiles(e.target.files)}/>
        {photos.length>0&&<span style={{fontSize:".72rem",color:"#a08070"}}>{photos.length} photo{photos.length!==1?"s":""}</span>}
      </div>
      {photos.length>0&&!hidePhotos&&(
        <div className="photo-thumbs">
          {photos.map(p=>(
            <div key={p.id} className="photo-thumb">
              <img src={p.src} alt={p.name}/>
              <button className="photo-remove" onClick={()=>removePhoto(p.id)}>×</button>
            </div>
          ))}
        </div>
      )}
      {photos.length>0&&hidePhotos&&(
        <div style={{fontSize:".72rem",color:"#a08070",marginTop:6,fontStyle:"italic"}}>
          📎 {photos.length} photo{photos.length!==1?"s":""} attached — visible in history
        </div>
      )}
    </div>
  );
}

function ManageItemsModal({ type, items, onAdd, onRemove, onEdit, onClose }) {
  const [label,    setLabel]    = useState("");
  const [emoji,    setEmoji]    = useState("🌿");
  const [showPick, setShowPick] = useState(false);
  const [editingId,setEditingId]= useState(null); // id of item being edited
  const [editLabel,setEditLabel]= useState("");
  const [editEmoji,setEditEmoji]= useState("🌿");
  const [showEditPick,setShowEditPick]=useState(false);
  const ref = useRef();
  useEffect(()=>{ setTimeout(()=>ref.current?.focus(),80); },[]);

  const doAdd = () => {
    if (!label.trim()) return;
    onAdd({ id:uid(), label:label.trim(), emoji });
    setLabel(""); setEmoji("🌿"); setShowPick(false);
    ref.current?.focus();
  };

  const startEdit = (it) => {
    setEditingId(it.id); setEditLabel(it.label); setEditEmoji(it.emoji); setShowEditPick(false);
  };
  const saveEdit = () => {
    if (!editLabel.trim()) return;
    onEdit(editingId, { label: editLabel.trim(), emoji: editEmoji });
    setEditingId(null); setShowEditPick(false);
  };
  const cancelEdit = () => { setEditingId(null); setShowEditPick(false); };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-top">
          <div className="modal-title">Manage {type==="skin"?"Skin":"Hair"} Steps</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>

        <div className="modal-sub">Add a new step</div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
          <div className="row">
            <button className="epick-btn" onClick={()=>setShowPick(p=>!p)}>{emoji}</button>
            <input ref={ref} className="ifield" placeholder="e.g. Vitamin C Serum" value={label}
              onChange={e=>setLabel(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAdd()}/>
            <button className="confirm-btn" onClick={doAdd} disabled={!label.trim()}>+ Add</button>
          </div>
          {showPick&&<div className="egrid">{EMOJI_OPTIONS.flat().map(em=>(
            <span key={em} className={`eopt ${emoji===em?"on":""}`}
              onClick={()=>{setEmoji(em);setShowPick(false)}}>{em}</span>
          ))}</div>}
        </div>

        <hr className="modal-hr"/>
        <div className="modal-sub">Current steps ({items.length})</div>
        {!items.length&&<div style={{textAlign:"center",color:"#b09080",fontStyle:"italic",padding:"12px 0",fontSize:".86rem"}}>None yet</div>}
        {items.map(it=>(
          <div key={it.id}>
            {editingId===it.id ? (
              <div style={{background:"#fff8f3",border:"1.5px solid #b07a5e",borderRadius:12,padding:"10px 13px",marginBottom:8}}>
                <div className="row" style={{marginBottom:8}}>
                  <button className="epick-btn" onClick={()=>setShowEditPick(p=>!p)}>{editEmoji}</button>
                  <input className="ifield" value={editLabel} onChange={e=>setEditLabel(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&saveEdit()} autoFocus/>
                </div>
                {showEditPick&&<div className="egrid" style={{marginBottom:8}}>{EMOJI_OPTIONS.flat().map(em=>(
                  <span key={em} className={`eopt ${editEmoji===em?"on":""}`}
                    onClick={()=>{setEditEmoji(em);setShowEditPick(false)}}>{em}</span>
                ))}</div>}
                <div style={{display:"flex",gap:8}}>
                  <button className="confirm-btn" onClick={saveEdit} disabled={!editLabel.trim()} style={{flex:1}}>Save</button>
                  <button onClick={cancelEdit} style={{background:"none",border:"1.5px solid #e8d8cc",borderRadius:10,padding:"9px 16px",fontSize:".78rem",color:"#a08070",cursor:"pointer",flex:1}}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="m-item" style={{marginBottom:8}}>
                <span style={{fontSize:"1rem"}}>{it.emoji}</span>
                <span className="m-item-lbl">{it.label}</span>
                <button className="ghost-btn" style={{fontSize:".7rem",padding:"3px 9px"}} onClick={()=>startEdit(it)}>Edit</button>
                <button className="m-rem-btn" onClick={()=>onRemove(it.id)}>Remove</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanDetailPage({ plan, type, allItems, schedules, treatments, onSave, onSaveMany, onDelete, onSaveTreatment, onDeleteTreatment, onBack }) {
  // Reuse PlanModal internals but as a full page
  if (type==="plan") {
    return <PlanModal allItems={allItems} schedules={schedules} treatments={treatments}
      onSave={onSave} onSaveMany={onSaveMany} onDelete={onDelete}
      onSaveTreatment={onSaveTreatment} onDeleteTreatment={onDeleteTreatment}
      onClose={onBack} initialPlan={plan}/>;
  }
  return <PlanModal allItems={allItems} schedules={schedules} treatments={treatments}
    onSave={onSave} onSaveMany={onSaveMany} onDelete={onDelete}
    onSaveTreatment={onSaveTreatment} onDeleteTreatment={onDeleteTreatment}
    onClose={onBack} initialTreatment={plan}/>;
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" style={{maxWidth:320,textAlign:"center",padding:"32px 24px"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:"1.5rem",marginBottom:12}}>🗑️</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.2rem",color:"#3a2e27",marginBottom:8}}>Are you sure?</div>
        <div style={{fontSize:".84rem",color:"#a08070",marginBottom:24,lineHeight:1.5}}>{message}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,background:"none",border:"1.5px solid #e8d8cc",borderRadius:12,padding:"11px",fontSize:".82rem",color:"#a08070",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
          <button onClick={onConfirm} style={{flex:1,background:"#c07060",border:"none",borderRadius:12,padding:"11px",fontSize:".82rem",color:"#fff",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",letterSpacing:".06em"}}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function SpendingSummary({ purchases, period, onGoToPurchases }) {
  const now = new Date();
  const fmt2 = d => d.toLocaleDateString("en-CA");

  const getRange = (p) => {
    if(p==="week"){ const d=new Date(now); d.setDate(now.getDate()-now.getDay()); return fmt2(d); }
    if(p==="month"){ return fmt2(new Date(now.getFullYear(),now.getMonth(),1)); }
    return fmt2(new Date(now.getFullYear(),0,1));
  };

  const startStr = getRange(period);
  const filtered = purchases.filter(p=>p.date>=startStr);
  const total = filtered.reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);
  const skin  = filtered.filter(p=>p.category==="skin").reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);
  const hair  = filtered.filter(p=>p.category==="hair").reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);
  const treatment = filtered.filter(p=>p.category==="treatment").reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);
  const count = filtered.length;
  const skinPct = total>0?Math.round((skin/total)*100):0;
  const hairPct = total>0?Math.round((hair/total)*100):0;
  const treatmentPct = total>0?Math.round((treatment/total)*100):0;

  return (
    <div>
      <div className="sec-head" style={{marginBottom:12}}>
        <div className="sec-title">Spending Summary</div>
        <button className="ghost-btn" onClick={onGoToPurchases}>View All</button>
      </div>
      <div style={{fontSize:".72rem",color:"#a08070",marginBottom:12}}>This {period==="week"?"Week":period==="month"?"Month":"Year"}</div>
      {count===0?(
        <div style={{textAlign:"center",padding:"20px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem"}}>No purchases recorded yet</div>
      ):(
        <div className="spend-card">
          <div className="spend-row" style={{fontWeight:600,fontSize:".92rem"}}>
            <span className="spend-label">Total spent</span>
            <span className="spend-val">${total.toFixed(2)}</span>
          </div>
          <div className="spend-row">
            <span className="spend-label">🌿 Skin</span>
            <span style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:".72rem",color:"#a08070"}}>{skinPct}%</span>
              <span className="spend-val">${skin.toFixed(2)}</span>
            </span>
          </div>
          <div className="spend-row">
            <span className="spend-label">✨ Hair</span>
            <span style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:".72rem",color:"#a08070"}}>{hairPct}%</span>
              <span className="spend-val">${hair.toFixed(2)}</span>
            </span>
          </div>
          {treatment>0&&<div className="spend-row">
            <span className="spend-label">💉 Treatment</span>
            <span style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:".72rem",color:"#a08070"}}>{treatmentPct}%</span>
              <span className="spend-val">${treatment.toFixed(2)}</span>
            </span>
          </div>}
          <div className="spend-row" style={{borderBottom:"none",paddingBottom:0}}>
            <span className="spend-label" style={{color:"#a08070",fontSize:".78rem"}}>{count} purchase{count!==1?"s":""}</span>
          </div>
          {total>0&&<div style={{marginTop:10,height:8,background:"#f0e0d4",borderRadius:8,overflow:"hidden",display:"flex"}}>
            <div style={{width:`${skinPct}%`,background:"#b07a5e",transition:"width .4s"}}/>
            <div style={{width:`${hairPct}%`,background:"#7a9e7a",transition:"width .4s"}}/>
          </div>}
          {total>0&&<div style={{display:"flex",gap:12,marginTop:6,fontSize:".7rem",color:"#a08070"}}>
            <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:"#b07a5e",display:"inline-block"}}/> Skin</span>
            <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:"#7a9e7a",display:"inline-block"}}/> Hair</span>
          </div>}
        </div>
      )}
    </div>
  );
}

// ProductSearch removed — Open Beauty Facts data was low quality.
// Global product autofill will be re-introduced when the in-house catalog has sufficient data.

function PurchasesPage({ purchases, products, wishlist, prefill, onClearPrefill, onSave, onDelete, onBack, onHome, onMenuOpen }) {
  const today = fmt(new Date());
  const thisYear = new Date().getFullYear().toString();
  const [addMode, setAddMode] = useState(null); // null | "source" | "picker" | "form"
  const [pickerType, setPickerType] = useState(null); // "products" | "wishlist"
  const [pickerSearch, setPickerSearch] = useState("");
  const [editP, setEditP] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [openMonths, setOpenMonths] = useState({[today.slice(0,7)]:true});
  const [openYears, setOpenYears] = useState({});
  const [historyItem, setHistoryItem] = useState(null);

  const blank = (cat, extra={}) => ({ id:uid(), name:"", brand:"", category:cat, price:"", quantity:"1", date:today, notes:"", tags:[], image:"", link:"", treatment_type:"", product_id:null, ...extra });

  useEffect(()=>{
    if (prefill) { setEditP({...prefill, price:String(prefill.price||""), quantity:String(prefill.quantity||1), treatment_type:prefill.treatment_type||"", product_id:prefill.product_id||null}); setAddMode("form"); onClearPrefill&&onClearPrefill(); }
  }, [prefill]);

  const startEdit = p => { setEditP({...p, price:String(p.price), quantity:String(p.quantity||1), treatment_type:p.treatment_type||""}); setAddMode("form"); };
  const save = () => { if(!editP.name.trim()||!editP.date) return; onSave(editP); setAddMode(null); setEditP(null); };
  const cancelForm = () => { setAddMode(null); setEditP(null); setPickerType(null); setPickerSearch(""); };
  const toggleMonth = m => setOpenMonths(s=>({...s,[m]:!s[m]}));
  const toggleYear = y => setOpenYears(s=>({...s,[y]:!s[y]}));

  const filtered = purchases.filter(p=>filterCat==="all"||p.category===filterCat);
  const grandTotal = filtered.reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);

  const currentYearPurchases = filtered.filter(p=>p.date.startsWith(thisYear));
  const pastPurchases = filtered.filter(p=>!p.date.startsWith(thisYear));
  const monthGroups = {};
  currentYearPurchases.forEach(p=>{ const m=p.date.slice(0,7); if(!monthGroups[m]) monthGroups[m]=[]; monthGroups[m].push(p); });
  const currentMonths = Object.keys(monthGroups).sort((a,b)=>b.localeCompare(a));
  const yearGroups = {};
  pastPurchases.forEach(p=>{ const y=p.date.slice(0,4); if(!yearGroups[y]) yearGroups[y]=[]; yearGroups[y].push(p); });
  const pastYears = Object.keys(yearGroups).sort((a,b)=>b.localeCompare(a));

  const getProductHistory = (p) => {
    const key = p.name.toLowerCase().trim()+"|"+(p.brand||"").toLowerCase().trim();
    return purchases.filter(x=>x.name.toLowerCase().trim()+"|"+(x.brand||"").toLowerCase().trim()===key).sort((a,b)=>a.date.localeCompare(b.date));
  };

  const pickerItems = pickerType==="products"
    ? (products||[]).filter(p=>!pickerSearch||p.name.toLowerCase().includes(pickerSearch.toLowerCase())||(p.brand||"").toLowerCase().includes(pickerSearch.toLowerCase()))
    : (wishlist||[]).filter(p=>!pickerSearch||p.name.toLowerCase().includes(pickerSearch.toLowerCase())||(p.brand||"").toLowerCase().includes(pickerSearch.toLowerCase()));

  const YearSplit = ({ps}) => {
    const skin=ps.filter(p=>p.category==="skin").reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);
    const hair=ps.filter(p=>p.category==="hair").reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);
    const tx=ps.filter(p=>p.category==="treatment").reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);
    const total=skin+hair+tx||1;
    return (
      <div style={{marginTop:8}}>
        <div style={{display:"flex",height:6,borderRadius:4,overflow:"hidden",marginBottom:6}}>
          {skin>0&&<div style={{flex:skin/total,background:"#b07a5e"}}/>}
          {hair>0&&<div style={{flex:hair/total,background:"#d4a0c0"}}/>}
          {tx>0&&<div style={{flex:tx/total,background:"#e8a898"}}/>}
        </div>
        <div style={{display:"flex",gap:10,fontSize:".68rem",color:"#a08070"}}>
          {skin>0&&<span>🌿 ${skin.toFixed(0)}</span>}
          {hair>0&&<span>✨ ${hair.toFixed(0)}</span>}
          {tx>0&&<span>💉 ${tx.toFixed(0)}</span>}
        </div>
      </div>
    );
  };

  const PURCH_STYLES = `
    .purch-form{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:16px;padding:18px;margin-bottom:16px}
    .purch-month-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:12px;cursor:pointer;margin-bottom:6px;transition:background .15s}
    .purch-month-header:hover{background:#fdf0e8}
    .year-tile{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:16px;padding:16px 18px;margin-bottom:10px;cursor:pointer;transition:all .15s}
    .year-tile:hover{background:#fdf0e8}
  `;

  // ── Purchase history deep-dive ───────────────────────────────────────────
  if (historyItem) {
    const history = getProductHistory(historyItem);
    const totalSpent = history.reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);
    const dates = history.map(p=>p.date).sort();
    let avgDays = null;
    if (dates.length>1) {
      const gaps=dates.slice(1).map((d,i)=>(parse(d)-parse(dates[i]))/(86400000));
      avgDays=Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length);
    }
    return (
      <div className="app">
        <style>{PURCH_STYLES}</style>
        <div className="header" style={{position:"relative"}}>
          <button onClick={()=>setHistoryItem(null)} style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#b07a5e",padding:"8px",fontFamily:"'DM Sans',sans-serif",fontSize:".82rem"}}>← Back</button>
          <div className="header-title"><span>{historyItem.name}</span></div>
          {onMenuOpen&&<HamburgerBtn onClick={onMenuOpen}/>}
        </div>
        {historyItem.brand&&<div style={{fontSize:".78rem",color:"#a08070",marginBottom:16,marginTop:-4}}>{historyItem.brand}</div>}
        <div style={{display:"flex",gap:10,marginBottom:20}}>
          {[
            [history.length, history.length===1?"purchase":"purchases"],
            ["$"+totalSpent.toFixed(0),"total spent"],
            avgDays?["~"+avgDays+"d","avg. frequency"]:null
          ].filter(Boolean).map(([val,lbl],i)=>(
            <div key={i} style={{flex:1,background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:14,padding:"14px 10px",textAlign:"center"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.7rem",color:"#3a2e27",lineHeight:1}}>{val}</div>
              <div style={{fontSize:".64rem",color:"#a08070",marginTop:4,letterSpacing:".08em",textTransform:"uppercase"}}>{lbl}</div>
            </div>
          ))}
        </div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",color:"#5a3a27",marginBottom:10,fontStyle:"italic"}}>Purchase history</div>
        {history.slice().reverse().map(p=>(
          <div key={p.id} style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:12,padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:".86rem",color:"#3a2e27"}}>{parse(p.date).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
              {p.quantity>1&&<div style={{fontSize:".72rem",color:"#a08070",marginTop:1}}>qty {p.quantity}</div>}
              {p.notes&&<div style={{fontSize:".72rem",color:"#a08070",fontStyle:"italic",marginTop:1}}>{p.notes}</div>}
            </div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",color:"#b07a5e"}}>${((parseFloat(p.price)||0)*(parseInt(p.quantity)||1)).toFixed(2)}</div>
          </div>
        ))}
      </div>
    );
  }

  const PurchaseCard = ({p}) => (
    <div className="purch-card" style={{cursor:"pointer"}} onClick={()=>setHistoryItem(p)}>
      {p.image
        ?<img src={p.image} alt="" style={{width:40,height:40,objectFit:"cover",borderRadius:8,flexShrink:0}}/>
        :<div style={{fontSize:"1.1rem",flexShrink:0}}>{p.category==="skin"?"🌿":p.category==="treatment"?"💉":"✨"}</div>
      }
      <div className="purch-info">
        <div className="purch-name">{p.name}</div>
        <div className="purch-meta">{p.brand&&`${p.brand} · `}{p.category==="treatment"&&p.treatment_type?`${p.treatment_type} · `:""}{p.category} · {parse(p.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}{p.quantity>1&&` · qty ${p.quantity}`}</div>
        {p.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>{p.tags.map(t=><span key={t} style={{fontSize:".68rem",background:"#f7ece4",border:"1px solid #e8d8cc",borderRadius:20,padding:"2px 8px",color:"#8a6858"}}>{t}</span>)}</div>}
        {p.notes&&<div style={{fontSize:".72rem",color:"#a08070",marginTop:2,fontStyle:"italic"}}>{p.notes}</div>}
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}} onClick={e=>e.stopPropagation()}>
        <div className="purch-price">${((parseFloat(p.price)||0)*(parseInt(p.quantity)||1)).toFixed(2)}</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {p.link&&<button className="ghost-btn" style={{fontSize:".68rem",padding:"2px 7px",color:"#b07a5e"}} onClick={()=>openUrl(p.link)}>Buy Now</button>}
          <button className="ghost-btn" style={{fontSize:".68rem",padding:"2px 7px"}} onClick={()=>startEdit(p)}>Edit</button>
          <button className="del-btn" style={{fontSize:".68rem"}} onClick={()=>onDelete(p.id)}>✕</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app">
      <style>{PURCH_STYLES}</style>
      <div className="header" style={{position:"relative"}}>
        <button onClick={onHome||onBack} style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#b07a5e",padding:"8px",lineHeight:1}}><HomeIcon/></button>
        <div className="header-title">My <span>Purchases</span></div>
        {onMenuOpen&&<HamburgerBtn onClick={onMenuOpen}/>}
      </div>

      {grandTotal>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:".68rem",letterSpacing:".12em",textTransform:"uppercase",color:"#a08070",marginBottom:4}}>All Time Spending</div>
          <div style={{display:"flex",alignItems:"baseline",gap:10}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"2.4rem",color:"#3a2e27",lineHeight:1}}>${grandTotal.toFixed(2)}</div>
            <div style={{fontSize:".76rem",color:"#b07a5e"}}>{filtered.length} purchase{filtered.length!==1?"s":""}</div>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["all","All"],["skin","🌿 Skin"],["hair","✨ Hair"],["treatment","💉 Treatment"]].map(([v,l])=>(
          <button key={v} className={`period-chip ${filterCat===v?"on":""}`} style={{flex:1,fontSize:".74rem",padding:"6px 4px"}} onClick={()=>setFilterCat(v)}>{l}</button>
        ))}
      </div>

      {/* ── Source picker ── */}
      {addMode==="source"&&(
        <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:16,padding:"18px",marginBottom:16}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic",color:"#7a5c48",marginBottom:14}}>What did you purchase?</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              ["📦","From My Products","Pick a product you already track",()=>{setPickerType("products");setAddMode("picker");}],
              ["💫","From My Wishlist","Pick something from your wishlist",()=>{setPickerType("wishlist");setAddMode("picker");}],
              ["💉","Treatment","Facial, microneedling, and more",()=>{setEditP(blank("treatment"));setAddMode("form");}],
              ["✏️","Add New","Enter a product manually",()=>{setEditP(blank("skin"));setAddMode("form");}],
            ].map(([emoji,label,sub,fn])=>(
              <button key={label} onClick={fn}
                style={{display:"flex",alignItems:"center",gap:12,background:"#fdf6f0",border:"1.5px solid #e8d8cc",borderRadius:12,padding:"12px 16px",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
                <span style={{fontSize:"1.3rem"}}>{emoji}</span>
                <div>
                  <div style={{fontSize:".88rem",color:"#3a2e27",fontWeight:500}}>{label}</div>
                  <div style={{fontSize:".72rem",color:"#a08070",marginTop:1}}>{sub}</div>
                </div>
              </button>
            ))}
            <button onClick={cancelForm} style={{background:"none",border:"none",fontSize:".78rem",color:"#a08070",cursor:"pointer",marginTop:4}}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Picker (products or wishlist) ── */}
      {addMode==="picker"&&(
        <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:16,padding:"18px",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <button className="ghost-btn" style={{fontSize:".75rem",padding:"4px 10px"}} onClick={()=>setAddMode("source")}>← Back</button>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontStyle:"italic",color:"#7a5c48"}}>{pickerType==="products"?"My Products":"My Wishlist"}</div>
            <button onClick={cancelForm} style={{background:"none",border:"none",fontSize:"1.2rem",cursor:"pointer",color:"#a08070"}}>×</button>
          </div>
          <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Search…" value={pickerSearch} onChange={e=>setPickerSearch(e.target.value)}/>
          <div style={{maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
            {pickerItems.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:"#b09080",fontStyle:"italic",fontSize:".86rem"}}>Nothing found</div>}
            {pickerItems.map(item=>(
              <div key={item.id} onClick={()=>{
                setEditP(blank(item.category||"skin",{name:item.name,brand:item.brand||"",image:item.image||"",link:item.link||"",price:String(item.price||""),product_id:pickerType==="products"?item.id:null}));
                setPickerSearch(""); setAddMode("form");
              }} style={{display:"flex",alignItems:"center",gap:10,background:"#fdf6f0",border:"1px solid #e8d8cc",borderRadius:10,padding:"10px 12px",cursor:"pointer"}}>
                {item.image
                  ?<img src={item.image} alt="" style={{width:36,height:36,objectFit:"cover",borderRadius:7,flexShrink:0}}/>
                  :<div style={{width:36,height:36,borderRadius:7,background:"#f0e0d4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0}}>{item.category==="skin"?"🌿":"✨"}</div>
                }
                <div style={{minWidth:0}}>
                  <div style={{fontSize:".86rem",fontWeight:500,color:"#3a2e27",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
                  {item.brand&&<div style={{fontSize:".72rem",color:"#a08070"}}>{item.brand}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Purchase form ── */}
      {addMode==="form"&&editP&&(
        <div className="purch-form">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic",color:"#7a5c48"}}>{purchases.find(p=>p.id===editP.id)?"Edit":"Add"} Purchase</div>
            <button onClick={cancelForm} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"#a08070"}}>×</button>
          </div>

          {editP.category==="treatment"?(
            <>
              <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Treatment name *" value={editP.name} onChange={e=>setEditP(p=>({...p,name:e.target.value}))} autoFocus/>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                {["skin","hair"].map(tp=>(
                  <button key={tp} className={`dow-chip ${editP.treatment_type===tp?"on":""}`} style={{flex:1,textAlign:"center",fontSize:".78rem"}}
                    onClick={()=>setEditP(p=>({...p,treatment_type:tp}))}>
                    {tp==="skin"?"🌿 Skin":"✨ Hair"}
                  </button>
                ))}
              </div>
            </>
          ):(
            <>
              <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Product name *" value={editP.name} onChange={e=>setEditP(p=>({...p,name:e.target.value}))} autoFocus/>
              <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Brand" value={editP.brand||""} onChange={e=>setEditP(p=>({...p,brand:e.target.value}))}/>
              <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Product URL — enables Buy Now" value={editP.link||""} onChange={e=>setEditP(p=>({...p,link:e.target.value}))}/>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                {["skin","hair","treatment"].map(cat=>(
                  <button key={cat} className={`dow-chip ${editP.category===cat?"on":""}`} style={{flex:1,textAlign:"center",fontSize:".74rem"}}
                    onClick={()=>setEditP(p=>({...p,category:cat}))}>
                    {cat==="skin"?"🌿 Skin":cat==="treatment"?"💉 Treat":"✨ Hair"}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                {["Moisturizer","Serum","Cleanser","Toner","SPF","Oil","Mask","Shampoo","Conditioner","Treatment","Supplement","Other"].map(tag=>(
                  <button key={tag} className={`dow-chip ${(editP.tags||[]).includes(tag)?"on":""}`} style={{fontSize:".74rem",padding:"4px 10px"}}
                    onClick={()=>setEditP(p=>({...p,tags:(p.tags||[]).includes(tag)?(p.tags||[]).filter(t=>t!==tag):[...(p.tags||[]),tag]}))}>
                    {tag}
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:".7rem",color:"#a08070",marginBottom:4,letterSpacing:".08em",textTransform:"uppercase"}}>Price ($)</div>
              <input className="ifield" style={{width:"100%"}} type="number" placeholder="0.00" value={editP.price} onChange={e=>setEditP(p=>({...p,price:e.target.value}))}/>
            </div>
            {editP.category!=="treatment"&&<div style={{width:70}}>
              <div style={{fontSize:".7rem",color:"#a08070",marginBottom:4,letterSpacing:".08em",textTransform:"uppercase"}}>Qty</div>
              <input className="ifield" style={{width:"100%"}} type="number" min="1" value={editP.quantity} onChange={e=>setEditP(p=>({...p,quantity:e.target.value}))}/>
            </div>}
            <div style={{flex:1}}>
              <div style={{fontSize:".7rem",color:"#a08070",marginBottom:4,letterSpacing:".08em",textTransform:"uppercase"}}>Date</div>
              <input className="ifield" style={{width:"100%"}} type="date" value={editP.date} onChange={e=>setEditP(p=>({...p,date:e.target.value}))}/>
            </div>
          </div>
          <input className="ifield" style={{width:"100%",marginBottom:12}} placeholder="Notes" value={editP.notes||""} onChange={e=>setEditP(p=>({...p,notes:e.target.value}))}/>
          <button className="save-btn" onClick={save} disabled={!editP.name.trim()} style={{opacity:editP.name.trim()?1:.4}}>Save Purchase</button>
        </div>
      )}

      {!addMode&&<button className="add-sched-btn" style={{marginBottom:16}} onClick={()=>setAddMode("source")}>+ Add Purchase</button>}

      {filtered.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>No purchases yet</div>}

      {currentMonths.map(m=>{
        const ps=monthGroups[m];
        const mTotal=ps.reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);
        const label=new Date(m+"-15").toLocaleDateString("en-US",{month:"long",year:"numeric"});
        const isOpen=!!openMonths[m];
        return (
          <div key={m} style={{marginBottom:8}}>
            <div className="purch-month-header" onClick={()=>toggleMonth(m)}>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.3rem",fontStyle:"italic",color:"#5a3a27"}}>{label}</span>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:"1.1rem",color:"#b07a5e",fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic"}}>${mTotal.toFixed(2)}</span>
                <span style={{color:"#b07a5e",fontSize:".8rem"}}>{isOpen?"▲":"▼"}</span>
              </div>
            </div>
            {isOpen&&<div style={{paddingLeft:4}}>{ps.sort((a,b)=>b.date.localeCompare(a.date)).map(p=><PurchaseCard key={p.id} p={p}/>)}</div>}
          </div>
        );
      })}

      {pastYears.map(y=>{
        const ps=yearGroups[y];
        const yTotal=ps.reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);
        const isOpen=!!openYears[y];
        const yMonths={};
        ps.forEach(p=>{ const m=p.date.slice(0,7); if(!yMonths[m]) yMonths[m]=[]; yMonths[m].push(p); });
        const sortedYMonths=Object.keys(yMonths).sort((a,b)=>b.localeCompare(a));
        return (
          <div key={y} className="year-tile" onClick={()=>toggleYear(y)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.3rem",color:"#3a2e27"}}>{y}</div>
                <div style={{fontSize:".72rem",color:"#a08070",marginTop:2}}>{ps.length} purchase{ps.length!==1?"s":""}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.2rem",color:"#b07a5e"}}>${yTotal.toFixed(2)}</div>
                <div style={{fontSize:".72rem",color:"#b07a5e",marginTop:2}}>{isOpen?"▲ hide":"▼ show"}</div>
              </div>
            </div>
            <YearSplit ps={ps}/>
            {isOpen&&<div style={{marginTop:14}} onClick={e=>e.stopPropagation()}>
              {sortedYMonths.map(m=>{
                const mps=yMonths[m];
                const mTotal=mps.reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);
                const label=new Date(m+"-15").toLocaleDateString("en-US",{month:"long"});
                const isMonthOpen=!!openMonths[m];
                return (
                  <div key={m} style={{marginBottom:6}}>
                    <div className="purch-month-header" onClick={()=>toggleMonth(m)}>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:".9rem",fontStyle:"italic",color:"#7a5c48"}}>{label}</span>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:".78rem",color:"#b07a5e"}}>${mTotal.toFixed(2)}</span>
                        <span style={{color:"#b07a5e",fontSize:".75rem"}}>{isMonthOpen?"▲":"▼"}</span>
                      </div>
                    </div>
                    {isMonthOpen&&<div style={{paddingLeft:4}}>{mps.sort((a,b)=>b.date.localeCompare(a.date)).map(p=><PurchaseCard key={p.id} p={p}/>)}</div>}
                  </div>
                );
              })}
            </div>}
          </div>
        );
      })}
    </div>
  );
}


// ── WISHLIST PAGE ──────────────────────────────────────────────
function WishlistPage({ wishlist, products, plannedPurchases, onSave, onDelete, onSavePlanned, onDeletePlanned, onMovePlannedToPurchase, onMoveToCart, onBack, onHome, onMenuOpen }) {
  const today = fmt(new Date());
  const [tab, setTab] = useState("wishlist"); // "wishlist" | "staples" | "planned"
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [chooseCat, setChooseCat] = useState(false);
  const [purchasingItem, setPurchasingItem] = useState(null);
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [showPlannedForm, setShowPlannedForm] = useState(false);
  const [newPlanned, setNewPlanned] = useState(null);

  const blankWish = (cat) => ({ id:uid(), name:"", brand:"", category:cat, image:"", link:"", notes:"", tags:[], priority:0 });
  const blankPlanned = () => ({ id:uid(), name:"", brand:"", category:"skin", image:"", link:"", price:"", notes:"", product_id:null, wishlist_id:null });
  const saveWish = () => { if(!editItem.name.trim()) return; onSave(editItem); setShowForm(false); setEditItem(null); };
  const savePlanned = () => { if(!newPlanned.name.trim()) return; onSavePlanned(newPlanned); setShowPlannedForm(false); setNewPlanned(null); };

  const staples = (products||[]).filter(p=>p.is_staple);
  const sortedWish = [...wishlist].sort((a,b)=>(b.priority||0)-(a.priority||0));

  const WISH_STYLES = `
    .wish-card{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:14px;padding:14px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start}
    .wish-card:hover{background:#fdf0e8}
    .wish-name{font-size:.9rem;font-weight:500;color:#3a2e27;margin-bottom:2px}
    .wish-meta{font-size:.72rem;color:#a08070}
    .plan-carousel{display:flex;gap:12px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none}
    .plan-carousel::-webkit-scrollbar{display:none}
    .plan-card{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:16px;padding:14px 12px;min-width:152px;max-width:152px;display:flex;flex-direction:column;align-items:center;gap:8px;flex-shrink:0;position:relative}
    .staple-card{background:#fff8f3;border:1.5px solid #e8c8a0;border-radius:14px;padding:14px;margin-bottom:10px;display:flex;gap:12px;align-items:center}
    .tab-bar{display:flex;gap:0;background:#f0e4d8;border-radius:12px;padding:3px;margin-bottom:18px}
    .tab-btn{flex:1;padding:7px 4px;border:none;background:transparent;border-radius:9px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.76rem;color:#a08070;transition:all .15s;font-weight:400}
    .tab-btn.on{background:#fff;color:#3a2e27;font-weight:500;box-shadow:0 1px 4px rgba(0,0,0,.08)}
  `;

  return (
    <div className="app">
      <style>{WISH_STYLES}</style>
      <div className="header" style={{position:"relative"}}>
        <button onClick={onHome||onBack} style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#b07a5e",padding:"8px",lineHeight:1}}><HomeIcon/></button>
        <div className="header-title">My <span>Wishlist</span></div>
        {onMenuOpen&&<HamburgerBtn onClick={onMenuOpen}/>}
      </div>

      <div className="tab-bar">
        {[["wishlist","Wishlist"],["staples","⭐ Staples"],["planned","📋 Planned"]].map(([v,l])=>(
          <button key={v} className={`tab-btn${tab===v?" on":""}`} onClick={()=>setTab(v)}>{l}</button>
        ))}
      </div>

      {/* ── WISHLIST TAB ── */}
      {tab==="wishlist"&&<>
        {chooseCat&&(
          <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:16,padding:"18px",marginBottom:16}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic",color:"#7a5c48",marginBottom:14}}>What are you wishing for?</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[["🌿","Skin","skin"],["✨","Hair","hair"],["💉","Treatment","treatment"]].map(([emoji,label,cat])=>(
                <button key={cat} onClick={()=>{setEditItem(blankWish(cat));setShowForm(true);setChooseCat(false);}}
                  style={{display:"flex",alignItems:"center",gap:12,background:"#fdf6f0",border:"1.5px solid #e8d8cc",borderRadius:12,padding:"12px 16px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                  <span style={{fontSize:"1.3rem"}}>{emoji}</span>
                  <span style={{fontSize:".88rem",color:"#3a2e27",fontWeight:500}}>{label} Product</span>
                </button>
              ))}
              <button onClick={()=>setChooseCat(false)} style={{background:"none",border:"none",fontSize:".78rem",color:"#a08070",cursor:"pointer",marginTop:4}}>Cancel</button>
            </div>
          </div>
        )}

        {showForm&&editItem&&(
          <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:16,padding:"18px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic",color:"#7a5c48"}}>{wishlist.find(w=>w.id===editItem.id)?"Edit":"Add to"} Wishlist</div>
              <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"#a08070"}}>×</button>
            </div>
            <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Product name *" value={editItem.name} onChange={e=>setEditItem(p=>({...p,name:e.target.value}))}/>
            <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Brand" value={editItem.brand||""} onChange={e=>setEditItem(p=>({...p,brand:e.target.value}))}/>
            <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Product URL" value={editItem.link||""} onChange={e=>setEditItem(p=>({...p,link:e.target.value}))}/>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {["skin","hair","treatment"].map(cat=>(
                <button key={cat} className={`dow-chip ${editItem.category===cat?"on":""}`} style={{flex:1,fontSize:".74rem",textAlign:"center"}}
                  onClick={()=>setEditItem(p=>({...p,category:cat}))}>
                  {cat==="skin"?"🌿 Skin":cat==="treatment"?"💉 Treat":"✨ Hair"}
                </button>
              ))}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {["Moisturizer","Serum","Cleanser","Toner","SPF","Oil","Mask","Shampoo","Conditioner","Treatment","Supplement","Other"].map(tag=>(
                <button key={tag} className={`dow-chip ${(editItem.tags||[]).includes(tag)?"on":""}`} style={{fontSize:".74rem",padding:"4px 10px"}}
                  onClick={()=>setEditItem(p=>({...p,tags:(p.tags||[]).includes(tag)?(p.tags||[]).filter(t=>t!==tag):[...(p.tags||[]),tag]}))}>
                  {tag}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[["0","Low"],["1","Medium"],["2","🔥 High"]].map(([v,l])=>(
                <button key={v} className={`dow-chip ${String(editItem.priority||0)===v?"on":""}`} style={{flex:1,fontSize:".74rem",textAlign:"center"}}
                  onClick={()=>setEditItem(p=>({...p,priority:parseInt(v)}))}>
                  {l}
                </button>
              ))}
            </div>
            <input className="ifield" style={{width:"100%",marginBottom:12}} placeholder="Notes" value={editItem.notes||""} onChange={e=>setEditItem(p=>({...p,notes:e.target.value}))}/>
            <button className="save-btn" onClick={saveWish} disabled={!editItem.name.trim()} style={{opacity:editItem.name.trim()?1:.4}}>Save to Wishlist</button>
          </div>
        )}

        {!showForm&&!chooseCat&&<button className="add-sched-btn" style={{marginBottom:16}} onClick={()=>setChooseCat(true)}>+ Add to Wishlist</button>}
        {sortedWish.length===0&&!showForm&&<div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>Your wishlist is empty ✨</div>}

        {sortedWish.map(item=>(
          <div key={item.id} className="wish-card">
            {item.image
              ?<img src={item.image} alt="" style={{width:52,height:52,objectFit:"cover",borderRadius:10,flexShrink:0}}/>
              :<div style={{width:52,height:52,borderRadius:10,background:"#f0e0d4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",flexShrink:0}}>{item.category==="skin"?"🌿":item.category==="treatment"?"💉":"✨"}</div>
            }
            <div style={{flex:1,minWidth:0}}>
              <div className="wish-name">{item.name}</div>
              <div className="wish-meta">{item.brand&&`${item.brand} · `}{item.category}{item.priority>0&&<span style={{color:item.priority===2?"#c06050":"#b07a5e",marginLeft:4}}>{item.priority===2?"🔥 High":"Medium"}</span>}</div>
              {item.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>{item.tags.map(t=><span key={t} style={{fontSize:".68rem",background:"#f7ece4",border:"1px solid #e8d8cc",borderRadius:20,padding:"2px 8px",color:"#8a6858"}}>{t}</span>)}</div>}
              {item.notes&&<div style={{fontSize:".72rem",color:"#a08070",marginTop:4,fontStyle:"italic"}}>{item.notes}</div>}
              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                {item.link&&<button onClick={()=>openUrl(item.link)} style={{background:"#b07a5e",border:"none",borderRadius:8,padding:"5px 12px",color:"#fff",cursor:"pointer",fontSize:".76rem",fontFamily:"'DM Sans',sans-serif"}}>Buy Now</button>}
                <button className="ghost-btn" style={{fontSize:".74rem",padding:"4px 10px"}} onClick={()=>onMoveToCart(item)}>✓ Purchased</button>
                <button className="ghost-btn" style={{fontSize:".74rem",padding:"4px 10px"}} onClick={()=>{setNewPlanned({...blankPlanned(),name:item.name,brand:item.brand||"",category:item.category||"skin",image:item.image||"",link:item.link||"",notes:item.notes||"",wishlist_id:item.id});setShowPlannedForm(true);setTab("planned");}}>📋 Plan</button>
                <button className="ghost-btn" style={{fontSize:".74rem",padding:"4px 10px"}} onClick={()=>{setEditItem({...item});setShowForm(true);}}>Edit</button>
                <button className="del-btn" style={{fontSize:".74rem"}} onClick={()=>onDelete(item.id)}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </>}

      {/* ── STAPLES TAB ── */}
      {tab==="staples"&&<>
        {staples.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>No staples yet — mark a product as ⭐ Staple in My Products</div>}
        {staples.map(p=>(
          <div key={p.id} className="staple-card">
            {p.image
              ?<img src={p.image} alt="" style={{width:52,height:52,objectFit:"cover",borderRadius:10,flexShrink:0}}/>
              :<div style={{width:52,height:52,borderRadius:10,background:"#f7ece4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",flexShrink:0}}>{p.category==="skin"?"🌿":"✨"}</div>
            }
            <div style={{flex:1,minWidth:0}}>
              <div className="wish-name">⭐ {p.name}</div>
              <div className="wish-meta">{p.brand&&`${p.brand} · `}{p.category}{p.price&&` · $${p.price}`}</div>
              {p.notes&&<div style={{fontSize:".72rem",color:"#a08070",marginTop:2,fontStyle:"italic"}}>{p.notes}</div>}
              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                {p.link&&<button onClick={()=>openUrl(p.link)} style={{background:"#b07a5e",border:"none",borderRadius:8,padding:"5px 12px",color:"#fff",cursor:"pointer",fontSize:".76rem",fontFamily:"'DM Sans',sans-serif"}}>Buy Now</button>}
                <button className="ghost-btn" style={{fontSize:".74rem",padding:"4px 10px"}} onClick={()=>{setNewPlanned({...blankPlanned(),name:p.name,brand:p.brand||"",category:p.category||"skin",image:p.image||"",link:p.link||"",price:String(p.price||""),product_id:p.id});setShowPlannedForm(true);setTab("planned");}}>📋 Plan to Buy</button>
              </div>
            </div>
          </div>
        ))}
      </>}

      {/* ── PLANNED PURCHASES TAB ── */}
      {tab==="planned"&&<>
        {purchasingItem&&(
          <div style={{background:"#fff8f3",border:"1.5px solid #b07a5e",borderRadius:16,padding:"18px",marginBottom:16}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic",color:"#3a2e27",marginBottom:4}}>Mark as purchased?</div>
            <div style={{fontSize:".8rem",color:"#5a3a27",fontWeight:500,marginBottom:12}}>{purchasingItem.name}</div>
            <input type="date" className="time-input" style={{width:"100%",marginBottom:14}} value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)}/>
            <div style={{display:"flex",gap:8}}>
              <button className="save-btn" style={{flex:1}} onClick={()=>{onMovePlannedToPurchase(purchasingItem,purchaseDate);setPurchasingItem(null);setPurchaseDate(today);}}>✓ Confirm</button>
              <button className="ghost-btn" style={{flex:1,padding:"10px 0",fontSize:".82rem"}} onClick={()=>{setPurchasingItem(null);setPurchaseDate(today);}}>Cancel</button>
            </div>
          </div>
        )}

        {showPlannedForm&&newPlanned&&(
          <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:16,padding:"18px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic",color:"#7a5c48"}}>Plan to Buy</div>
              <button onClick={()=>{setShowPlannedForm(false);setNewPlanned(null);}} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"#a08070"}}>×</button>
            </div>
            <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Product name *" value={newPlanned.name} onChange={e=>setNewPlanned(p=>({...p,name:e.target.value}))} autoFocus/>
            <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Brand" value={newPlanned.brand||""} onChange={e=>setNewPlanned(p=>({...p,brand:e.target.value}))}/>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {["skin","hair","treatment"].map(cat=>(
                <button key={cat} className={`dow-chip ${newPlanned.category===cat?"on":""}`} style={{flex:1,fontSize:".74rem",textAlign:"center"}}
                  onClick={()=>setNewPlanned(p=>({...p,category:cat}))}>
                  {cat==="skin"?"🌿 Skin":cat==="treatment"?"💉 Treat":"✨ Hair"}
                </button>
              ))}
            </div>
            <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="💰 Estimated price" value={newPlanned.price||""} onChange={e=>setNewPlanned(p=>({...p,price:e.target.value}))}/>
            <input className="ifield" style={{width:"100%",marginBottom:12}} placeholder="Notes" value={newPlanned.notes||""} onChange={e=>setNewPlanned(p=>({...p,notes:e.target.value}))}/>
            <button className="save-btn" onClick={savePlanned} disabled={!newPlanned.name.trim()} style={{opacity:newPlanned.name.trim()?1:.4}}>Save Plan</button>
          </div>
        )}

        {!showPlannedForm&&!purchasingItem&&<button className="add-sched-btn" style={{marginBottom:16}} onClick={()=>{setNewPlanned(blankPlanned());setShowPlannedForm(true);}}>+ Plan to Buy</button>}

        {(plannedPurchases||[]).length===0&&!showPlannedForm&&<div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>Nothing planned yet</div>}

        {(plannedPurchases||[]).length>0&&<div className="plan-carousel">
          {(plannedPurchases||[]).map(item=>(
            <div key={item.id} className="plan-card">
              <button onClick={()=>onDeletePlanned(item.id)} style={{position:"absolute",top:6,right:6,background:"none",border:"none",cursor:"pointer",color:"#c09080",fontSize:".76rem",padding:"2px 5px",lineHeight:1,zIndex:1}}>✕</button>
              {item.image
                ?<img src={item.image} alt="" style={{width:72,height:72,borderRadius:12,objectFit:"cover"}}/>
                :<div style={{width:72,height:72,borderRadius:12,background:"#f0e0d4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem"}}>{item.category==="skin"?"🌿":item.category==="treatment"?"💉":"✨"}</div>
              }
              <div style={{textAlign:"center",width:"100%"}}>
                <div style={{fontSize:".82rem",fontWeight:500,color:"#3a2e27",lineHeight:1.3,marginBottom:2,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{item.name}</div>
                {item.brand&&<div style={{fontSize:".68rem",color:"#a08070",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.brand}</div>}
                {item.price&&<div style={{fontSize:".78rem",color:"#b07a5e",marginTop:2,fontWeight:500}}>${item.price}</div>}
              </div>
              <button className="save-btn" style={{width:"100%",padding:"7px 0",fontSize:".76rem",marginTop:2}} onClick={()=>{if(!purchasingItem){setPurchasingItem(item);setPurchaseDate(today);}}}>✓ Purchased</button>
            </div>
          ))}
        </div>}
      </>}
    </div>
  );
}

// ── MY PRODUCTS PAGE ───────────────────────────────────────────
function RoutineAnalysis({ products, snapProducts, entries, dateRange, onClose, isCurrent, onFetchIngredients }) {
  const [status, setStatus] = useState(() => isCurrent ? "confirm_entries" : "loading_auto");
  const [result, setResult] = useState(null);
  const [includeEntries, setIncludeEntries] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const productList = snapProducts
    .map(sp => products.find(p => p.id === (sp.product_id || sp.id)))
    .filter(Boolean);

  const skinProds = productList.filter(p => p.category === "skin");
  const hairProds = productList.filter(p => p.category === "hair");
  const txProds   = productList.filter(p => p.category === "treatment");
  const formatList = arr => arr.map(p => `${p.name}${p.brand ? " by " + p.brand : ""}${p.frequency ? " (" + p.frequency + ")" : ""}`).join(", ");

  const stripCitations = text => text ? text.replace(/<cite[^>]*>|<\/cite>/g, "").replace(/\[[\d,\s-]+\]/g, "").trim() : text;

  const getNotes = () => {
    if (!entries || !dateRange) return "";
    const endDate = dateRange.end || new Date().toISOString().slice(0,10);
    return Object.entries(entries)
      .filter(([d]) => d >= dateRange.start && d <= endDate)
      .map(([d, e]) => {
        const parts = [];
        if (e.skin_notes) parts.push("Skin (" + d + "): " + e.skin_notes);
        if (e.hair_notes) parts.push("Hair (" + d + "): " + e.hair_notes);
        if (e.skin_mood) parts.push("Skin mood (" + d + "): " + e.skin_mood);
        if (e.hair_mood) parts.push("Hair mood (" + d + "): " + e.hair_mood);
        return parts.join(" | ");
      })
      .filter(Boolean)
      .slice(0, 30)
      .join("\n");
  };

  const journalEntryCount = () => {
    if (!entries || !dateRange) return 0;
    const endDate = dateRange.end || new Date().toISOString().slice(0,10);
    return Object.entries(entries).filter(([d]) => d >= dateRange.start && d <= endDate).filter(([,e]) => e.skin_notes || e.hair_notes).length;
  };

  const doAnalyze = async (useNotes) => {
    // ── Step 1: Prefetch missing ingredients, collect results locally ──
    const missingIngredients = productList.filter(p => !p.ingredients?.length);
    const fetchedMap = {}; // id -> {ingredients, ...}

    if (missingIngredients.length > 0 && onFetchIngredients) {
      setStatus("fetching_ingredients");
      const results = await Promise.all(missingIngredients.map(async p => {
        const data = await onFetchIngredients(p);
        return { id: p.id, data };
      }));
      results.forEach(({ id, data }) => { if (data?.ingredients?.length) fetchedMap[id] = data; });
    }

    setStatus("loading");

    // Merge fetched ingredients into product list locally (don't wait for state update)
    const freshList = productList.map(p =>
      fetchedMap[p.id] ? { ...p, ingredients: fetchedMap[p.id].ingredients } : p
    );
    const freshSkin = freshList.filter(p => p.category === "skin");
    const freshHair = freshList.filter(p => p.category === "hair");
    const freshTx   = freshList.filter(p => p.category === "treatment");
    console.log("=== ANALYSIS DEBUG ===");
    console.log("Total products:", freshList.length, freshList.map(p => p.name + " [" + p.category + "]"));
    console.log("Skin:", freshSkin.length, "Hair:", freshHair.length, "Treatments:", freshTx.length);

    const allHaveIngredients = freshList.every(p => p.ingredients?.length > 0);
    const notes = useNotes ? getNotes() : "";

    const formatDetailed = (arr) => arr.map(p => {
      const freq = p.frequency ? ` — used ${p.frequency}` : "";
      const ings = p.ingredients?.length
        ? `\n    Key ingredients: ${p.ingredients.slice(0, 20).join(", ")}`
        : "";
      return `  • ${p.name}${p.brand ? " by " + p.brand : ""}${freq}${ings}`;
    }).join("\n");

    const prompt = [
      "You are a cosmetic formulation expert and dermatologist. Give a sharp, specific, actionable analysis of this routine.",
      "IMPORTANT: You must analyze ALL products listed below — skin, hair, and treatments. Do not skip any category.",
      "Base your analysis on the actual ingredients listed. Do not be vague — name specific ingredients and explain exactly why they matter.",
      "Be direct and opinionated. If something is redundant, a conflict, or missing — say it clearly.",
      "",
      freshSkin.length > 0 ? "SKIN ROUTINE:\n" + formatDetailed(freshSkin) : "",
      freshHair.length > 0 ? "HAIR ROUTINE:\n" + formatDetailed(freshHair) : "",
      freshTx.length > 0   ? "TREATMENTS:\n"   + formatDetailed(freshTx)   : "",
      notes ? "\nJOURNAL NOTES (real-world observations):\n" + notes : "",
      "",
      "Respond ONLY with this exact JSON (no markdown, no citations, no preamble):",
      JSON.stringify({
        strengths: "2-3 sentences. Name the specific actives or ingredient combinations that make this routine strong. E.g. 'The combination of niacinamide and zinc in X product effectively controls sebum while...'",
        conflicts: "Name any ingredient conflicts or overuse risks with exact product names. E.g. 'Using X and Y together risks over-exfoliation because both contain AHAs.' If none, say 'No significant conflicts found.'",
        gaps: "What is this routine missing? Name specific ingredients or product types that would improve results. Be direct: 'This routine lacks a dedicated SPF...' or 'No occlusives present to lock in moisture...'",
        synergies: "Name 1-2 specific ingredient combinations that work especially well together in this routine and why.",
        journal_insights: notes ? "What do the journal notes reveal about how this routine is actually performing? Note any patterns." : null,
        recommendation: "The single most impactful change this person should make. Be specific — name the product to add, remove, or swap and exactly why."
      }, null, 2)
    ].filter(Boolean).join("\n");

    try {
      const body = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1800,
        messages: [{ role: "user", content: prompt }],
        action: "analysis"
      };
      if (!allHaveIngredients) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) { console.error("API error", res.status, await res.text()); setStatus("error"); return; }
      const data = await res.json();
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      const clean = text.replace(/<cite[^>]*>[\s\S]*?<\/cite>/g, "").replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "");
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          Object.keys(parsed).forEach(k => { if (typeof parsed[k] === "string") parsed[k] = stripCitations(parsed[k]); });
          setResult(parsed);
        } catch { setResult({ raw: stripCitations(clean) }); }
      } else { setResult({ raw: stripCitations(clean) }); }
      setStatus("done");
      setChatHistory([{ role: "assistant", content: "I've analyzed your routine. What would you like to dig into?" }]);
    } catch(e) { console.error("Analysis error:", e); setStatus("error"); }
  };

  // Auto-analyze for historic snapshots
  if (status === "loading_auto") { setTimeout(() => doAnalyze(true), 0); return (
    <div style={{background:"#fdf6f0",border:"1.5px solid #e8d8cc",borderRadius:14,padding:"16px",marginTop:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontStyle:"italic",color:"#5a3a27"}}>Routine Analysis</div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:"1.2rem",cursor:"pointer",color:"#a08070"}}>×</button>
      </div>
      <div style={{textAlign:"center",padding:"24px 0"}}>
        <div style={{fontSize:"1.4rem",marginBottom:10,animation:"spin 1.5s linear infinite",display:"inline-block"}}>✦</div>
        <div style={{fontSize:".8rem",color:"#a08070",fontStyle:"italic"}}>Analyzing your routine…</div>
        <style>{".spin-anim{animation:spin 1.5s linear infinite}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}"}</style>
      </div>
    </div>
  ); }

  if (status === "fetching_ingredients") return (
    <div style={{background:"#fdf6f0",border:"1.5px solid #e8d8cc",borderRadius:14,padding:"16px",marginTop:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontStyle:"italic",color:"#5a3a27"}}>Routine Analysis</div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:"1.2rem",cursor:"pointer",color:"#a08070"}}>×</button>
      </div>
      <div style={{textAlign:"center",padding:"24px 0"}}>
        <div style={{fontSize:"1.4rem",marginBottom:10,animation:"spin 1.5s linear infinite",display:"inline-block"}}>🔍</div>
        <div style={{fontSize:".84rem",color:"#5a3a27",marginBottom:4}}>Looking up ingredients…</div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatLoading(true);
    const newHistory = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(newHistory);
    try {
      const formatWithIngs = (arr) => arr.map(p => {
        const ings = p.ingredients?.length ? ` [${p.ingredients.slice(0,10).join(", ")}]` : "";
        return `${p.name}${p.brand?" by "+p.brand:""}${ings}`;
      }).join("; ");
      const context = "You are a skincare and haircare formulation expert answering follow-up questions. Be specific, concise, and practical. Use plain text only — no markdown asterisks, no bullet symbols, no citation brackets.\n\n" +
        "FULL ROUTINE:\n" +
        (skinProds.length > 0 ? "Skin: " + formatWithIngs(skinProds) + "\n" : "") +
        (hairProds.length > 0 ? "Hair: " + formatWithIngs(hairProds) + "\n" : "") +
        (txProds.length > 0 ? "Treatments: " + formatWithIngs(txProds) + "\n" : "") +
        (result && !result.raw ? "\nPrevious analysis:\nStrengths: " + (result.strengths||"") + "\nConflicts: " + (result.conflicts||"") + "\nGaps: " + (result.gaps||"") + "\nRecommendation: " + (result.recommendation||"") : "");
      const messages = [
        { role: "user", content: context + "\n\nQuestion: " + userMsg }
      ];
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages })
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Chat API error", res.status, errText);
        setChatHistory([...newHistory, { role: "assistant", content: "Error " + res.status + ": " + errText.slice(0, 120) }]);
        setChatLoading(false);
        return;
      }
      const data = await res.json();
      if (data.error) {
        console.error("Claude error", data.error);
        setChatHistory([...newHistory, { role: "assistant", content: "API error: " + (data.error.message || JSON.stringify(data.error)) }]);
        setChatLoading(false);
        return;
      }
      const text = stripCitations((data.content || []).filter(b => b.type === "text").map(b => b.text).join(""));
      setChatHistory([...newHistory, { role: "assistant", content: text || "(no response)" }]);
    } catch(e) {
      console.error("Chat fetch error:", e);
      setChatHistory([...newHistory, { role: "assistant", content: "Network error: " + e.message }]);
    }
    setChatLoading(false);
  };

  const Section = ({ emoji, label, color, text }) => {
    if (!text || text === "null") return null;
    return (
      <div style={{marginBottom:14}}>
        <div style={{fontSize:".68rem",letterSpacing:".1em",textTransform:"uppercase",color,fontWeight:600,marginBottom:5}}>{emoji} {label}</div>
        <div style={{fontSize:".84rem",color:"#3a2e27",lineHeight:1.6}}>{stripCitations(text)}</div>
      </div>
    );
  };

  return (
    <div style={{background:"#fdf6f0",border:"1.5px solid #e8d8cc",borderRadius:14,padding:"16px",marginTop:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontStyle:"italic",color:"#5a3a27"}}>Routine Analysis</div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:"1.2rem",cursor:"pointer",color:"#a08070"}}>×</button>
      </div>

      {status==="confirm_entries"&&(
        <div style={{padding:"4px 0 8px"}}>
          <div style={{fontSize:".84rem",color:"#5a3a27",marginBottom:14,lineHeight:1.6}}>
            Include journal entries since <strong>{new Date(dateRange.start+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</strong>?
            {journalEntryCount() > 0
              ? <span style={{color:"#a08070"}}> ({journalEntryCount()} entries with notes)</span>
              : <span style={{color:"#c0a890"}}> (no notes found for this period)</span>}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>doAnalyze(true)}
              style={{flex:1,background:"#3a2e27",border:"none",borderRadius:10,padding:"10px",color:"#f7ece4",fontSize:".8rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
              Yes, include entries
            </button>
            <button onClick={()=>doAnalyze(false)}
              style={{flex:1,background:"none",border:"1.5px solid #e8d8cc",borderRadius:10,padding:"10px",color:"#a08070",fontSize:".8rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              Just products
            </button>
          </div>
        </div>
      )}

      {status==="loading"&&(
        <div style={{textAlign:"center",padding:"24px 0"}}>
          <div style={{fontSize:"1.4rem",marginBottom:10,display:"inline-block",animation:"spin 1.5s linear infinite"}}>✦</div>
          <div style={{fontSize:".8rem",color:"#a08070",fontStyle:"italic"}}>Analyzing your routine…</div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {status==="error"&&(
        <div style={{textAlign:"center",padding:"12px 0"}}>
          <div style={{fontSize:".8rem",color:"#c07060",marginBottom:8}}>Something went wrong. Please try again.</div>
          <button onClick={()=>setStatus(isCurrent?"confirm_entries":"loading_auto")} className="ghost-btn">Try Again</button>
        </div>
      )}

      {status==="done"&&result&&(
        <div>
          {result.raw
            ? <div style={{fontSize:".84rem",color:"#3a2e27",lineHeight:1.7}}>{result.raw}</div>
            : <div>
                <Section emoji="✨" label="What this routine does well" color="#5a8a5a" text={result.strengths}/>
                <Section emoji="⚠️" label="Conflicts & risks" color="#c07060" text={result.conflicts}/>
                <Section emoji="🔍" label="What's missing" color="#b07a30" text={result.gaps}/>
                <Section emoji="🤝" label="Ingredient synergies" color="#5a6a9a" text={result.synergies}/>
                <Section emoji="📓" label="What your journal reveals" color="#7a6a4a" text={result.journal_insights}/>
                <Section emoji="💡" label="Top recommendation" color="#7a5c48" text={result.recommendation}/>
              </div>
          }

          {/* Chatbot */}
          <div style={{marginTop:16,borderTop:"1px solid #f0e0d4",paddingTop:14}}>
            <div style={{fontSize:".68rem",letterSpacing:".08em",textTransform:"uppercase",color:"#a08070",marginBottom:10}}>Ask a follow-up</div>
            {chatHistory.slice(1).map((m,i)=>(
              <div key={i} style={{marginBottom:10,display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"85%",background:m.role==="user"?"#3a2e27":"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:12,padding:"8px 12px",fontSize:".8rem",color:m.role==="user"?"#f7ece4":"#3a2e27",lineHeight:1.6}}>
                  {m.role==="assistant"
                    ? m.content.split("\n").map((line,j) => {
                        const bold = line.replace(/\*\*(.+?)\*\*/g, (_,t) => `<b>${t}</b>`);
                        return <div key={j} style={{marginBottom:line===""?6:2}} dangerouslySetInnerHTML={{__html:bold||"&nbsp;"}}/>
                      })
                    : m.content}
                </div>
              </div>
            ))}
            {chatLoading&&<div style={{fontSize:".76rem",color:"#a08070",fontStyle:"italic",marginBottom:8}}>Thinking…</div>}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <input
                className="ifield"
                style={{flex:1,fontSize:".8rem",padding:"8px 12px"}}
                placeholder="e.g. Why do these conflict? What helps with redness?"
                value={chatInput}
                onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendChat()}
              />
              <button onClick={sendChat} disabled={!chatInput.trim()||chatLoading}
                style={{background:"#3a2e27",border:"none",borderRadius:10,padding:"8px 14px",color:"#f7ece4",fontSize:".8rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:chatInput.trim()?1:.4}}>
                →
              </button>
            </div>
          </div>

          <button onClick={()=>{setStatus(isCurrent?"confirm_entries":"loading_auto");setResult(null);setChatHistory([]);}} className="ghost-btn" style={{marginTop:12,fontSize:".74rem"}}>Run Again</button>
        </div>
      )}
    </div>
  );
}

function CompareRoutines({ snapshots, products, entries, onClose }) {
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  const allSnaps = [...snapshots].sort((a,b) => b.started_at.localeCompare(a.started_at));

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);

  const getSnapLabel = (snap) => {
    const start = new Date(snap.started_at+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
    const end = snap.ended_at ? new Date(snap.ended_at+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "Present";
    return `${start} — ${end}`;
  };

  const getSnapNotes = (snap) => {
    if (!entries) return "";
    const endDate = snap.ended_at || new Date().toISOString().slice(0,10);
    const relevant = Object.entries(entries)
      .filter(([d]) => d >= snap.started_at && d <= endDate)
      .map(([d, e]) => {
        const parts = [];
        if (e.skin_notes) parts.push(`Skin (${d}): ${e.skin_notes}`);
        if (e.hair_notes) parts.push(`Hair (${d}): ${e.hair_notes}`);
        return parts.join(" | ");
      }).filter(Boolean);
    return relevant.slice(0, 15).join("\n");
  };

  const compare = async () => {
    if (selected.length < 2) return;
    setStatus("loading");

    const selectedSnaps = selected.map(id => allSnaps.find(s=>s.id===id)).filter(Boolean);

    const routineBlocks = selectedSnaps.map((snap, i) => {
      const prods = snap.products.map(sp => products.find(p=>p.id===sp.product_id)).filter(Boolean);
      const skin = prods.filter(p=>p.category==="skin").map(p=>`${p.name}${p.brand?` by ${p.brand}`:""}`).join(", ");
      const hair = prods.filter(p=>p.category==="hair").map(p=>`${p.name}${p.brand?` by ${p.brand}`:""}`).join(", ");
      const tx   = prods.filter(p=>p.category==="treatment").map(p=>`${p.name}${p.brand?` by ${p.brand}`:""}`).join(", ");
      const notes = getSnapNotes(snap);
      return [
        "ROUTINE " + (i+1) + " (" + getSnapLabel(snap) + "):",
        skin ? "Skin: " + skin : "",
        hair ? "Hair: " + hair : "",
        tx ? "Treatments: " + tx : "",
        notes ? "Journal notes:\n" + notes : "No journal notes for this period."
      ].filter(Boolean).join("\n");
    }).join("\n\n---\n\n");

    const prompt = [
      "You are a skincare and haircare expert. Compare these " + selectedSnaps.length + " beauty routines and give a practical, insightful comparison. Use journal notes to assess how each routine performed in practice.",
      "",
      routineBlocks,
      "",
      "Respond in exactly this JSON structure (no markdown, pure JSON):",
      "{",
      '  "routines": [{ "label": "Routine 1 (date range)", "summary": "2 sentences on what this routine was optimized for and how it performed based on journal notes if available" }],',
      '  "what_improved": "2-3 sentences on positive trends or changes across the routines over time",',
      '  "common_thread": "1-2 sentences on products or ingredients appearing across multiple routines",',
      '  "best_period": "1-2 sentences on which routine period seemed to work best and why, based on products and journal evidence",',
      '  "recommendation": "2-3 sentences of actionable advice based on everything you see across all routines"',
      "}"
    ].join("\n");

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { setResult(JSON.parse(jsonMatch[0])); } catch { setResult({ raw: text }); }
        setStatus("done");
      } else {
        setResult({ raw: text });
        setStatus("done");
      }
    } catch(e) {
      setStatus("error");
    }
  };

  const Section = ({ emoji, label, color, text }) => {
    if (!text) return null;
    return (
      <div style={{marginBottom:16}}>
        <div style={{fontSize:".7rem",letterSpacing:".1em",textTransform:"uppercase",color,fontWeight:600,marginBottom:6}}>{emoji} {label}</div>
        <div style={{fontSize:".84rem",color:"#3a2e27",lineHeight:1.6}}>{text}</div>
      </div>
    );
  };

  return (
    <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:16,padding:"18px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic",color:"#5a3a27"}}>Compare Routines</div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"#a08070"}}>×</button>
      </div>

      {status==="idle"&&(
        <div>
          <div style={{fontSize:".78rem",color:"#a08070",marginBottom:12}}>Select any routines to compare — journal notes from each period will be included.</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {allSnaps.map(snap => {
              const prods = snap.products.map(sp=>products.find(p=>p.id===sp.product_id)).filter(Boolean);
              const noteCount = Object.entries(entries||{}).filter(([d])=>d>=snap.started_at&&d<=(snap.ended_at||new Date().toISOString().slice(0,10))).filter(([,e])=>e.skin_notes||e.hair_notes).length;
              const isSelected = selected.includes(snap.id);
              return (
                <div key={snap.id} onClick={()=>toggle(snap.id)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,border:`1.5px solid ${isSelected?"#b07a5e":"#e8d8cc"}`,background:isSelected?"#fdf0e8":"#fdf6f0",cursor:"pointer"}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${isSelected?"#b07a5e":"#d0b8a8"}`,background:isSelected?"#b07a5e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {isSelected&&<span style={{color:"#fff",fontSize:".7rem",lineHeight:1}}>✓</span>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:".82rem",color:"#3a2e27",fontWeight:500}}>{getSnapLabel(snap)}</div>
                    <div style={{fontSize:".7rem",color:"#a08070",marginTop:2}}>{prods.length} products{noteCount>0?` · ${noteCount} journal entries`:""}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={compare} disabled={selected.length < 2}
            style={{width:"100%",background:selected.length>=2?"#3a2e27":"#d0b8a8",border:"none",borderRadius:12,padding:"12px",color:"#f7ece4",fontSize:".84rem",cursor:selected.length>=2?"pointer":"default",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
            Compare {selected.length >= 2 ? `${selected.length} Routines` : "— Select at least 2"}
          </button>
        </div>
      )}

      {status==="loading"&&(
        <div style={{textAlign:"center",padding:"32px 0"}}>
          <div style={{fontSize:"1.4rem",marginBottom:12,animation:"spin 1.5s linear infinite",display:"inline-block"}}>✦</div>
          <div style={{fontSize:".82rem",color:"#a08070",fontStyle:"italic"}}>Comparing your routines…</div>
        </div>
      )}

      {status==="error"&&(
        <div style={{textAlign:"center",padding:"16px 0"}}>
          <div style={{fontSize:".82rem",color:"#c07060",marginBottom:12}}>Something went wrong. Please try again.</div>
          <button onClick={()=>setStatus("idle")} className="ghost-btn">Try Again</button>
        </div>
      )}

      {status==="done"&&result&&(
        <div>
          {result.raw ? (
            <div style={{fontSize:".84rem",color:"#3a2e27",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{result.raw}</div>
          ) : (
            <div>
              {result.routines?.map((r,i)=>(
                <div key={i} style={{marginBottom:16,paddingBottom:16,borderBottom:i<result.routines.length-1?"1px solid #f0e0d4":"none"}}>
                  <div style={{fontSize:".7rem",letterSpacing:".08em",textTransform:"uppercase",color:"#b07a5e",fontWeight:600,marginBottom:6}}>📅 {r.label}</div>
                  <div style={{fontSize:".84rem",color:"#3a2e27",lineHeight:1.6}}>{r.summary}</div>
                </div>
              ))}
              <Section emoji="📈" label="What improved over time" color="#5a8a5a" text={result.what_improved}/>
              <Section emoji="🔗" label="Common thread" color="#5a6a9a" text={result.common_thread}/>
              <Section emoji="🏆" label="Best performing period" color="#b07a30" text={result.best_period}/>
              <Section emoji="💡" label="Recommendation" color="#7a5c48" text={result.recommendation}/>
            </div>
          )}
          <button onClick={()=>{setStatus("idle");setSelected([]);}} className="ghost-btn" style={{marginTop:4,fontSize:".74rem"}}>Compare Again</button>
        </div>
      )}
    </div>
  );
}

function ProductForm({ initialData, isEditingProd, onSave, onClose }) {
  // Own internal state — never re-mounts on parent re-render, so focus is never lost
  const [p, setP] = useState(initialData);
  return (
    <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:16,padding:"18px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic",color:"#7a5c48"}}>{isEditingProd?"Edit Product":"Add Product"}</div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"#a08070"}}>×</button>
      </div>
      <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Product name" value={p.name} onChange={e=>setP(prev=>({...prev,name:e.target.value}))} autoFocus/>
      <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Brand" value={p.brand||""} onChange={e=>setP(prev=>({...prev,brand:e.target.value}))}/>
      {isEditingProd&&<div style={{fontSize:".64rem",color:"#c0a898",fontStyle:"italic",marginTop:-6,marginBottom:10}}>Name and brand changes apply across your routine history.</div>}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <input className="ifield" style={{flex:1}} placeholder="Product URL" value={p.link||""} onChange={e=>setP(prev=>({...prev,link:e.target.value}))}/>
        <input className="ifield" style={{width:88}} placeholder="Price" type="number" min="0" step="0.01" value={p.price||""} onChange={e=>setP(prev=>({...prev,price:e.target.value}))}/>
      </div>
      {isEditingProd
        ? <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{background:"#f0e8f4",borderRadius:8,padding:"6px 14px",fontSize:".74rem",color:"#7a6a8a",fontWeight:500}}>
              {p.category==="skin"?"🌿 Skin":p.category==="treatment"?"💉 Treatment":"✨ Hair"}
            </div>
            <div style={{fontSize:".64rem",color:"#c0a898",fontStyle:"italic"}}>Category can't be changed — remove and re-add to change.</div>
          </div>
        : <div style={{display:"flex",gap:8,marginBottom:10}}>
            {["skin","hair","treatment"].map(cat=>(
              <button key={cat} className={`dow-chip ${p.category===cat?"on":""}`} style={{flex:1,fontSize:".74rem",textAlign:"center"}}
                onClick={()=>setP(prev=>({...prev,category:cat}))}>
                {cat==="skin"?"🌿 Skin":cat==="treatment"?"💉 Treat":"✨ Hair"}
              </button>
            ))}
          </div>
      }
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {["Moisturizer","Serum","Cleanser","Toner","SPF","Oil","Mask","Shampoo","Conditioner","Treatment","Supplement","Other"].map(tag=>(
          <button key={tag} className={`dow-chip ${(p.tags||[]).includes(tag)?"on":""}`}
            style={{fontSize:".74rem",padding:"4px 10px"}}
            onClick={()=>setP(prev=>({...prev,tags:(prev.tags||[]).includes(tag)?(prev.tags||[]).filter(t=>t!==tag):[...(prev.tags||[]),tag]}))}>
            {tag}
          </button>
        ))}
      </div>
      {(()=>{
        const raw = p.frequency||"";
        const isDaily = raw==="Daily";
        const match = raw.match(/^(\d+)x (week|month)$/);
        const count = match?parseInt(match[1]):1;
        const period = match?match[2]:(isDaily?"day":"week");
        const enabled = !!raw;
        const setFreq = (c,per) => {
          if (per==="day") setP(prev=>({...prev,frequency:"Daily"}));
          else setP(prev=>({...prev,frequency:c+"x "+per}));
        };
        const bump = delta => setFreq(Math.min(7,Math.max(1,count+delta)), period==="day"?"week":period);
        return (
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,background:"#f7f2ee",borderRadius:10,padding:"8px 12px"}}>
            <span style={{fontSize:".62rem",color:"#a08070",letterSpacing:".08em",textTransform:"uppercase",flexShrink:0}}>Freq</span>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
              {enabled&&period!=="day"&&(
                <>
                  <button onClick={()=>bump(-1)} disabled={count<=1}
                    style={{width:24,height:24,borderRadius:"50%",border:"1px solid #e0cfc4",background:"#fff",color:count<=1?"#d0c0b8":"#7a5c48",cursor:count<=1?"default":"pointer",fontSize:".9rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>−</button>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",color:"#3a2e27",minWidth:14,textAlign:"center"}}>{count}</span>
                  <span style={{fontSize:".62rem",color:"#a08070"}}>×</span>
                  <button onClick={()=>bump(1)} disabled={count>=7}
                    style={{width:24,height:24,borderRadius:"50%",border:"1px solid #e0cfc4",background:"#fff",color:count>=7?"#d0c0b8":"#7a5c48",cursor:count>=7?"default":"pointer",fontSize:".9rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>+</button>
                </>
              )}
              <div style={{display:"flex",gap:4}}>
                {["day","week","month"].map(per=>(
                  <button key={per} onClick={()=>setFreq(per==="day"?1:count,per)}
                    style={{padding:"4px 10px",borderRadius:7,border:"1px solid",cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif",fontSize:".68rem",fontWeight:500,
                      background:enabled&&period===per?"#b07a5e":"transparent",
                      color:enabled&&period===per?"#fff":"#a08070",
                      borderColor:enabled&&period===per?"#b07a5e":"#ddd0c4",transition:"all .12s"}}>
                    {per==="day"?"Daily":per==="week"?"Wkly":"Mnth"}
                  </button>
                ))}
                {enabled&&<button onClick={()=>setP(prev=>({...prev,frequency:""}))}
                  style={{padding:"4px 6px",borderRadius:7,border:"1px solid #ddd0c4",cursor:"pointer",background:"transparent",color:"#c0a898",fontSize:".68rem"}}>✕</button>}
              </div>
            </div>
          </div>
        );
      })()}
      <input className="ifield" style={{width:"100%",marginBottom:12}} placeholder="Notes" value={p.notes||""} onChange={e=>setP(prev=>({...prev,notes:e.target.value}))}/>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,background:"#f7f2ee",borderRadius:10,padding:"8px 12px"}}>
        <span style={{fontSize:".62rem",color:"#a08070",letterSpacing:".08em",textTransform:"uppercase",flex:1}}>⭐ Staple</span>
        <span style={{fontSize:".7rem",color:"#a08070",marginRight:6}}>{p.is_staple?"Yes — go-to repurchase":"No"}</span>
        <Toggle on={!!p.is_staple} onChange={v=>setP(prev=>({...prev,is_staple:v}))}/>
      </div>
      <button className="save-btn" onClick={()=>onSave(p)} disabled={!p.name.trim()} style={{opacity:p.name.trim()?1:.4}}>
        {isEditingProd?"Save Changes":"Add to My Routine"}
      </button>
    </div>
  );
}

function SlimEditForm({ initialData, onSave, onClose }) {
  const [p, setP] = useState(initialData);
  const fileRef = useRef(null);
  const raw = p.frequency||"";
  const isDaily = raw==="Daily";
  const match = raw.match(/^(\d+)x (week|month)$/);
  const count = match?parseInt(match[1]):1;
  const period = match?match[2]:(isDaily?"day":"week");
  const enabled = !!raw;
  const setFreq = (c,per) => {
    if (per==="day") setP(prev=>({...prev,frequency:"Daily"}));
    else setP(prev=>({...prev,frequency:c+"x "+per}));
  };
  const bump = delta => setFreq(Math.min(7,Math.max(1,count+delta)), period==="day"?"week":period);
  const catLabel = p.category==="skin"?"Skin":p.category==="treatment"?"Treatment":"Hair";
  const handleImageFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 900;
        let w = img.width, h = img.height;
        if (w > max || h > max) { if (w>h){h=Math.round(h*max/w);w=max;}else{w=Math.round(w*max/h);h=max;} }
        canvas.width=w; canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        setP(prev=>({...prev, userImage: canvas.toDataURL('image/jpeg',0.78)}));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };
  const displayImage = p.userImage || p.image;
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{padding:"24px 22px 28px"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:20}}>
          {displayImage&&<img src={displayImage} alt="" style={{width:52,height:52,borderRadius:9,objectFit:"cover",flexShrink:0,border:"1px solid #f0e0d4"}}/>}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.3rem",color:"#3a2e27",lineHeight:1.1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
            {p.brand&&<div style={{fontSize:".74rem",color:"#a08070",marginTop:1}}>{p.brand}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
            <button onClick={onClose} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"#c0a898",lineHeight:1,padding:0}}>×</button>
            <div style={{background:"#f7f0ea",borderRadius:5,padding:"2px 8px",fontSize:".6rem",color:"#b07a5e",letterSpacing:".06em",textTransform:"uppercase",fontWeight:600}}>{catLabel}</div>
          </div>
        </div>

        {/* Fields */}
        <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:16}}>
          <input className="ifield" style={{width:"100%"}} placeholder="Product name" value={p.name} onChange={e=>setP(prev=>({...prev,name:e.target.value}))} autoFocus/>
          <input className="ifield" style={{width:"100%"}} placeholder="Brand" value={p.brand||""} onChange={e=>setP(prev=>({...prev,brand:e.target.value}))}/>
          <div style={{display:"flex",gap:8}}>
            <input className="ifield" style={{flex:1}} placeholder="Product URL" value={p.link||""} onChange={e=>setP(prev=>({...prev,link:e.target.value}))}/>
            <input className="ifield" style={{width:80}} placeholder="Price" type="number" min="0" step="0.01" value={p.price||""} onChange={e=>setP(prev=>({...prev,price:e.target.value}))}/>
          </div>
        </div>

        {/* Frequency — single compact row */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,background:"#f7f2ee",borderRadius:10,padding:"8px 12px"}}>
          <span style={{fontSize:".62rem",color:"#a08070",letterSpacing:".08em",textTransform:"uppercase",flexShrink:0}}>Frequency</span>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
            {enabled&&period!=="day"&&(
              <>
                <button onClick={()=>bump(-1)} disabled={count<=1}
                  style={{width:24,height:24,borderRadius:"50%",border:"1px solid #e0cfc4",background:"#fff",color:count<=1?"#d0c0b8":"#7a5c48",cursor:count<=1?"default":"pointer",fontSize:".9rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>−</button>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",color:"#3a2e27",minWidth:14,textAlign:"center"}}>{count}</span>
                <span style={{fontSize:".62rem",color:"#a08070"}}>×</span>
                <button onClick={()=>bump(1)} disabled={count>=7}
                  style={{width:24,height:24,borderRadius:"50%",border:"1px solid #e0cfc4",background:"#fff",color:count>=7?"#d0c0b8":"#7a5c48",cursor:count>=7?"default":"pointer",fontSize:".9rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>+</button>
              </>
            )}
            <div style={{display:"flex",gap:4}}>
              {["day","week","month"].map(per=>(
                <button key={per} onClick={()=>setFreq(per==="day"?1:count,per)}
                  style={{padding:"4px 10px",borderRadius:7,border:"1px solid",cursor:"pointer",
                    fontFamily:"'DM Sans',sans-serif",fontSize:".68rem",fontWeight:500,
                    background:enabled&&period===per?"#b07a5e":"transparent",
                    color:enabled&&period===per?"#fff":"#a08070",
                    borderColor:enabled&&period===per?"#b07a5e":"#ddd0c4",transition:"all .12s"}}>
                  {per==="day"?"Daily":per==="week"?"Wkly":"Mnth"}
                </button>
              ))}
              {enabled&&<button onClick={()=>setP(prev=>({...prev,frequency:""}))}
                style={{padding:"4px 6px",borderRadius:7,border:"1px solid #ddd0c4",cursor:"pointer",background:"transparent",color:"#c0a898",fontSize:".68rem"}}>✕</button>}
            </div>
          </div>
        </div>

        {/* Photo attachment */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,background:"#f7f2ee",borderRadius:10,padding:"8px 12px"}}>
          {displayImage
            ?<img src={displayImage} alt="" style={{width:36,height:36,borderRadius:6,objectFit:"cover",border:"1px solid #e8d8cc",flexShrink:0}}/>
            :<div style={{width:36,height:36,borderRadius:6,background:"#ede4dc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0}}>📷</div>
          }
          <div style={{flex:1}}>
            <div style={{fontSize:".66rem",color:"#a08070",letterSpacing:".06em",textTransform:"uppercase",marginBottom:2}}>Product Photo</div>
            <div style={{fontSize:".62rem",color:"#c0a898"}}>Used if no image from link</div>
          </div>
          <button onClick={()=>fileRef.current.click()}
            style={{background:"none",border:"1px solid #e0cfc4",borderRadius:7,padding:"5px 10px",fontSize:".68rem",color:"#7a5c48",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>
            {displayImage?"Change":"Add"}
          </button>
          {p.userImage&&<button onClick={()=>setP(prev=>({...prev,userImage:null}))}
            style={{background:"none",border:"none",color:"#c0a898",fontSize:".8rem",cursor:"pointer",padding:"4px",flexShrink:0}}>✕</button>}
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleImageFile(e.target.files[0])}/>
        </div>

        <input className="ifield" style={{width:"100%",marginBottom:12}} placeholder="Notes" value={p.notes||""} onChange={e=>setP(prev=>({...prev,notes:e.target.value}))}/>

        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,background:"#f7f2ee",borderRadius:10,padding:"8px 12px"}}>
          <span style={{fontSize:".62rem",color:"#a08070",letterSpacing:".08em",textTransform:"uppercase",flex:1}}>⭐ Staple</span>
          <span style={{fontSize:".7rem",color:"#a08070",marginRight:6}}>{p.is_staple?"Yes — go-to repurchase":"No"}</span>
          <Toggle on={!!p.is_staple} onChange={v=>setP(prev=>({...prev,is_staple:v}))}/>
        </div>

        <button onClick={()=>onSave(p)} disabled={!p.name.trim()}
          style={{width:"100%",padding:"12px",background:p.name.trim()?"#b07a5e":"#e8d8cc",border:"none",borderRadius:12,
            color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:".84rem",fontWeight:600,cursor:p.name.trim()?"pointer":"default",
            letterSpacing:".04em",transition:"background .15s"}}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

function MyProductsPage({ products, snapshots, entries, onSaveProduct, onDeleteProduct, onOpenSnapshot, onAddToSnapshot, onUpdateSnapProduct, onUpdateSnapProductName, onRemoveFromSnapshot, onFinalizeBase, onDeleteSnapshot, onFetchIngredients, onSaveProductOrder, onUpdateSnapProductTimeOfDay, onBack, onHome, onMenuOpen }) {
  const [tab, setTab] = useState("current");
  const [editMode, setEditMode] = useState(false); // draft edit mode on finalized routine
  const [showForm, setShowForm] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [chooseCat, setChooseCat] = useState(false);
  const [isEditingProd, setIsEditingProd] = useState(false);
  const [featuredView, setFeaturedView] = useState(null); // {category, index} — carousel detail view
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [routineSuccess, setRoutineSuccess] = useState(null); // {title, body}
  const [newProductAlert, setNewProductAlert] = useState(null); // {data, originalId}
  const [removeConfirm, setRemoveConfirm] = useState(null); // snapProdId pending removal
  const [showCompare, setShowCompare] = useState(false);
  const [draftChanges, setDraftChanges] = useState(null); // {added:[], removed:[], edited:[]} tracked during edit mode
  const [unsavedWarning, setUnsavedWarning] = useState(false);
  const [pendingNav, setPendingNav] = useState(null); // callback to run after discard/save
  const touchStartRef = useRef(null);
  const carouselScrollRef = useRef(null);
  const draftChangesRef = useRef(null);
  const dragItem = useRef(null);
  const [dragTargetId, setDragTargetId] = useState(null);
  const [showAmPm, setShowAmPm] = useState(false);

  // Scroll carousel to correct position when featured view opens or category changes
  useLayoutEffect(() => {
    if (featuredView && carouselScrollRef.current) {
      carouselScrollRef.current.scrollLeft = featuredView.index * 272;
    }
  }, [featuredView?.category]);

  const draftSnap    = snapshots.find(s=>!s.ended_at && s.is_base);
  const currentSnap  = snapshots.find(s=>!s.ended_at && !s.is_base);
  const activeSnap   = draftSnap || currentSnap;
  const isDraft      = !!draftSnap || editMode;
  const pastSnaps    = snapshots.filter(s=>s.ended_at).sort((a,b)=>b.started_at.localeCompare(a.started_at));

  const snapProducts = activeSnap
    ? activeSnap.products.map(sp=>{
        const prod = products.find(p=>p.id===sp.product_id);
        if (!prod) return null;
        return {
          snapProdId: sp.id,
          ...prod,
          // Prefer snapshot-captured values — fall back to live product for old data
          name:      sp.name_snapshot  || prod.name,
          brand:     sp.brand_snapshot || prod.brand,
          frequency: sp.frequency      || prod.frequency,
          time_of_day: sp.time_of_day  || 'all',
        };
      }).filter(Boolean)
    : [];
  const skinProds = snapProducts.filter(p=>p.category==="skin").sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  const hairProds = snapProducts.filter(p=>p.category==="hair").sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  const txProds   = snapProducts.filter(p=>p.category==="treatment").sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));

  const blank = (cat) => ({ id:crypto.randomUUID(), name:"", brand:"", category:cat, image:"", link:"", price:"", notes:"", tags:[], frequency:"", is_staple:false });

  const handleCloseForm = useCallback(() => { setShowForm(false); setEditProd(null); setIsEditingProd(false); }, []);
  const handleSetEditProd = useCallback((fn) => setEditProd(fn), []);

  const hasChanges = draftChanges && (draftChanges.added.length>0 || draftChanges.removed.length>0 || draftChanges.edited.length>0);

  const tryNavigateAway = (callback) => {
    if (editMode && hasChanges) {
      setPendingNav(()=>callback);
      setUnsavedWarning(true);
    } else {
      if (editMode) setEditMode(false);
      callback();
    }
  };

  const enterEditMode = () => {
    const initial = {added:[], removed:[], edited:[]};
    setEditMode(true);
    setDraftChanges(initial);
    draftChangesRef.current = initial;
  };

  const discardChanges = () => {
    setEditMode(false);
    setDraftChanges(null);
    draftChangesRef.current = null;
    setShowForm(false);
    setEditProd(null);
    setUnsavedWarning(false);
    if (pendingNav) { pendingNav(); setPendingNav(null); }
  };

  const saveDraft = async () => {
    // Save current state as a draft snapshot (is_base=true keeps it editable)
    if (!draftSnap && currentSnap) {
      // mark current as base/draft
      await onFinalizeBase(currentSnap.id, true); // pass true = convert to draft
    }
    setUnsavedWarning(false);
    if (pendingNav) { pendingNav(); setPendingNav(null); }
  };

  const openEditForm = (prod) => {
    setEditProd({...prod, _origName:prod.name, _origBrand:prod.brand||"", _origCategory:prod.category});
    setIsEditingProd(true);
    setShowForm(true);
    setChooseCat(false);
  };

  const save = async (prodData) => {
    const data = prodData || editProd;
    if (!data.name.trim()) return;

    if (isEditingProd) {
      const origName     = data._origName     || data.name;
      const origBrand    = data._origBrand    || "";
      const origCategory = data._origCategory || data.category;
      const nameChanged  = data.name !== origName;
      const brandChanged = (data.brand||"") !== origBrand;
      const catChanged   = data.category !== origCategory;

      // ── Rule 1: category change → always a new product ──
      if (catChanged) {
        setNewProductAlert({data, originalId:data.id});
        return;
      }

      // ── Rule 2: name or brand changed → run similarity ──
      if (nameChanged || brandChanged) {
        const nameSim  = strSimilarity(origName, data.name);
        const brandSim = strSimilarity(origBrand, data.brand||"");
        // Brand similarity only penalises when brand is actually set on both sides
        const brandPenalty = (origBrand && data.brand) ? brandSim : 1;
        if (nameSim < 0.85 || brandPenalty < 0.85) {
          // Looks like a different product
          setNewProductAlert({data, originalId:data.id});
          return;
        }
        // Typo fix — update library + propagate corrected name/brand to all snapshots
        await onSaveProduct(data);
        await onUpdateSnapProductName(data.id, data.name, data.brand||"");
      } else {
        await onSaveProduct(data);
      }

      // ── Always: update frequency on the current snapshot row ──
      const sp = activeSnap?.products.find(sp=>sp.product_id===data.id);
      if (sp) {
        const spUpdates = {};
        if ((data.frequency||null) !== (sp.frequency||null)) spUpdates.frequency = data.frequency||null;
        if (Object.keys(spUpdates).length) await onUpdateSnapProduct(sp.id, spUpdates);
      }

      const cur1 = draftChangesRef.current; if (cur1) { const u={...cur1,edited:[...cur1.edited,data.name]}; draftChangesRef.current=u; setDraftChanges(u); }
    } else {
      // ── Adding a new product ──
      await onSaveProduct(data);
      const meta = {name_snapshot:data.name, brand_snapshot:data.brand||"", frequency:data.frequency||null};
      if (activeSnap) {
        if (!activeSnap.products.find(p=>p.product_id===data.id)) {
          await onAddToSnapshot(activeSnap.id, data.id, meta);
          const cur2 = draftChangesRef.current; if (cur2) { const u={...cur2,added:[...cur2.added,data.name]}; draftChangesRef.current=u; setDraftChanges(u); }
        }
      } else {
        const newSnapId = await onOpenSnapshot(true);
        if (newSnapId) await onAddToSnapshot(newSnapId, data.id, meta);
      }
    }
    setShowForm(false); setEditProd(null); setIsEditingProd(false);
  };

  const removeProduct = async (snapProdId, prodName) => {
    if (!activeSnap) return;
    await onRemoveFromSnapshot(activeSnap.id, snapProdId);
    const cur = draftChangesRef.current;
    if (cur) {
      const updated = {...cur, removed:[...cur.removed, prodName]};
      draftChangesRef.current = updated;
      setDraftChanges(updated);
    }
  };

  const doFinalize = async () => {
    setConfirmFinalize(false);
    const changes = draftChangesRef.current;
    if (draftSnap) {
      // First time finalize
      await onFinalizeBase(draftSnap.id);
    } else if (editMode && currentSnap) {
      // Re-finalize after edit
      const productChanges = (changes?.added?.length||0) + (changes?.removed?.length||0);
      if (productChanges > 0) {
        // Products changed — close current snapshot, open new one with current products
        const newSnapId = await onOpenSnapshot(false);
        if (newSnapId) {
          for (const sp of activeSnap.products) {
            await onAddToSnapshot(newSnapId, sp.product_id, {
              name_snapshot:  sp.name_snapshot  || null,
              brand_snapshot: sp.brand_snapshot || null,
              frequency:      sp.frequency      || null,
            });
          }
        }
        // Notify
        const parts = [];
        if (changes.added.length) parts.push(`Added: ${changes.added.join(", ")}`);
        if (changes.removed.length) parts.push(`Removed: ${changes.removed.join(", ")}`);
        setRoutineSuccess({ title: "Routine updated", body: (parts.length ? parts.join(" · ") + ". " : "") + "Your previous routine has been preserved in Snapshot History." });
      }
      // Edits only (link/frequency/notes) — no new snapshot, already saved
    }
    setEditMode(false);
    setDraftChanges(null);
    draftChangesRef.current = null;
  };

  const catEmoji = (cat) => cat==="skin"?"🌿":cat==="treatment"?"💉":"✨";

  const SnapCard = ({snap}) => { // uses onDeleteSnapshot from closure
    const [open, setOpen] = useState(false);
    const [snapAnalysis, setSnapAnalysis] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const prods = snap.products.map(sp=>{
      const prod = products.find(p=>p.id===sp.product_id);
      if (!prod) return null;
      return {...prod, name:sp.name_snapshot||prod.name, brand:sp.brand_snapshot||prod.brand};
    }).filter(Boolean);
    const skinP=prods.filter(p=>p.category==="skin");
    const hairP=prods.filter(p=>p.category==="hair");
    const txP=prods.filter(p=>p.category==="treatment");
    const startLabel = new Date(snap.started_at+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
    const endLabel = snap.ended_at ? new Date(snap.ended_at+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "Present";
    const SnapCatRow = ({cat, label, catProds}) => {
      if (!catProds.length) return null;
      return (
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
            <div style={{fontSize:".64rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070"}}>{label}</div>
            <div style={{fontSize:".6rem",color:"#c0b0a8"}}>{catProds.length} product{catProds.length!==1?"s":""}</div>
          </div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none",WebkitOverflowScrolling:"touch",paddingRight:4}}>
            {catProds.map(p=>(
              <div key={p.id} style={{flexShrink:0,width:96,background:"#fdf6f0",border:"1.5px solid #e8d8cc",borderRadius:13,overflow:"hidden"}}>
                {p.image
                  ?<img src={p.image} alt="" style={{width:"100%",height:76,objectFit:"cover",display:"block"}}/>
                  :<div style={{width:"100%",height:76,background:"#f0e0d4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem"}}>{catEmoji(cat)}</div>
                }
                <div style={{padding:"7px 8px 8px"}}>
                  <div style={{fontSize:".7rem",fontWeight:500,color:"#3a2e27",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                  {p.brand&&<div style={{fontSize:".6rem",color:"#a08070",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.brand}</div>}
                  {p.frequency&&<div style={{fontSize:".56rem",background:"#f0e8f4",borderRadius:5,padding:"1px 5px",color:"#7a6a8a",display:"inline-block",marginTop:3}}>{p.frequency}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };
    return (
      <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:16,padding:"16px 18px",marginBottom:12,cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontStyle:"italic",color:"#5a3a27"}}>{startLabel} — {endLabel}</div>
            <div style={{fontSize:".72rem",color:"#a08070",marginTop:3}}>{prods.length} product{prods.length!==1?"s":""}{skinP.length>0?` · ${skinP.length} skin`:""}{ hairP.length>0?` · ${hairP.length} hair`:""}{ txP.length>0?` · ${txP.length} treatment`:""}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={e=>{e.stopPropagation();setSnapAnalysis(v=>!v);}} style={{background:"none",border:"1px solid #e8d8cc",borderRadius:8,padding:"4px 10px",color:"#a08070",fontSize:".7rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              {snapAnalysis?"Close":"Analyze"}
            </button>
            {open&&<button onClick={e=>{e.stopPropagation();setConfirmDel(true);}} style={{background:"none",border:"1px solid #f0c8c0",borderRadius:8,padding:"4px 10px",color:"#c07060",fontSize:".7rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              Delete
            </button>}
            <span style={{color:"#b07a5e",fontSize:".8rem"}}>{open?"▲":"▼"}</span>
          </div>
        </div>
        {snapAnalysis&&<div onClick={e=>e.stopPropagation()}>
          <RoutineAnalysis
            products={products}
            snapProducts={snap.products}
            entries={entries}
            dateRange={{start:snap.started_at, end:snap.ended_at}}
            isCurrent={false}
            onClose={()=>setSnapAnalysis(false)}
            onFetchIngredients={onFetchIngredients}/>
        </div>}
        {confirmDel&&<div style={{marginTop:12,background:"#fff8f3",border:"1.5px solid #f0c8c0",borderRadius:12,padding:"14px"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:".84rem",color:"#3a2e27",marginBottom:12,lineHeight:1.5}}>Delete this snapshot? This cannot be undone.</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setConfirmDel(false)} className="ghost-btn" style={{flex:1,fontSize:".78rem"}}>Cancel</button>
            <button onClick={()=>onDeleteSnapshot(snap.id)}
              style={{flex:1,background:"#c07060",border:"none",borderRadius:10,padding:"9px",color:"#fff",fontSize:".78rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              Yes, Delete
            </button>
          </div>
        </div>}
        {open&&<div style={{marginTop:14,borderTop:"1px solid #f0e0d4",paddingTop:14}} onClick={e=>e.stopPropagation()}>
          <SnapCatRow cat="skin" label="🌿 Skin" catProds={skinP}/>
          <SnapCatRow cat="hair" label="✨ Hair" catProds={hairP}/>
          <SnapCatRow cat="treatment" label="💉 Treatments" catProds={txP}/>
        </div>}
      </div>
    );
  };

  // ProductForm is defined outside MyProductsPage to prevent focus loss on re-render

  return (
    <div className="app">
      <div className="header" style={{position:"relative"}}>
        <button onClick={()=>tryNavigateAway(onHome||onBack)} style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#b07a5e",padding:"8px",lineHeight:1}}><HomeIcon/></button>
        <div className="header-title">My <span>Products</span></div>
        <div className="header-sub">{products.length} in library</div>
        {onMenuOpen&&<HamburgerBtn onClick={onMenuOpen}/>}
      </div>

      <div style={{display:"flex",gap:0,marginBottom:20,borderRadius:12,overflow:"hidden",border:"1.5px solid #e8d8cc"}}>
        {[["current","Current Routine"],["history","Snapshot History"]].map(([v,l])=>(
          <button key={v}
            onClick={()=>{
              if (showForm) {
                if (!window.confirm("You have unsaved changes. Leave without saving?")) return;
                handleCloseForm();
              }
              setTab(v);
              setFeaturedView(null);
              setShowAnalysis(false);
              setShowCompare(false);
              setChooseCat(false);
            }}
            style={{flex:1,padding:"10px",fontSize:".78rem",cursor:"pointer",border:"none",fontFamily:"'DM Sans',sans-serif",
              background:tab===v?"#b07a5e":"#fff8f3",color:tab===v?"#fff":"#a08070",transition:"all .15s"}}>
            {l}
          </button>
        ))}
      </div>

      {tab==="current"&&(
        <>
          {/* ── Screen 2: Featured Carousel ── */}
          {featuredView&&(()=>{
            const catProds = featuredView.category==="skin"?skinProds:featuredView.category==="hair"?hairProds:txProds;
            const idx = Math.min(featuredView.index, catProds.length-1);
            const curr = catProds[idx];
            const prevP = idx>0?catProds[idx-1]:null;
            const nextP = idx<catProds.length-1?catProds[idx+1]:null;
            const catLabel = featuredView.category==="skin"?"Skin":featuredView.category==="hair"?"Hair":"Treatments";
            const goTo = (i) => setFeaturedView(f=>({...f,index:i}));
            if (!curr) { setFeaturedView(null); return null; }
            return (
              <div>
                {/* Featured header */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"2px 0"}}>
                  <button onClick={()=>setFeaturedView(null)}
                    style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",color:"#a08070",fontFamily:"'DM Sans',sans-serif",fontSize:".76rem",padding:"4px 0",flexShrink:0}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
                    {catLabel}
                  </button>
                  <div style={{flex:1,fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontStyle:"italic",color:"#5a3a27",textAlign:"center"}}>My <em style={{color:"#b07a5e"}}>{catLabel}</em></div>
                  <div style={{fontSize:".66rem",color:"#c0b0a8",flexShrink:0}}>{catProds.length} products</div>
                </div>

                {/* Carousel — unified lookbook cards (image + details in one card) */}
                <div
                  ref={carouselScrollRef}
                  style={{display:"flex",gap:12,overflowX:"scroll",scrollSnapType:"x mandatory",
                    scrollbarWidth:"none",msOverflowStyle:"none",WebkitOverflowScrolling:"touch",
                    paddingLeft:"calc(50% - 130px)",paddingRight:"calc(50% - 130px)",paddingBottom:4}}
                  onScroll={e=>{
                    const i = Math.round(e.currentTarget.scrollLeft / 272);
                    const clamped = Math.max(0, Math.min(i, catProds.length-1));
                    if (clamped !== idx) setFeaturedView(f=>({...f,index:clamped}));
                  }}>
                  {catProds.map((p,i)=>(
                    <div key={p.id} style={{flexShrink:0,width:260,scrollSnapAlign:"center",
                      background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:20,overflow:"hidden",
                      opacity:i===idx?1:.45,transform:i===idx?"scale(1)":"scale(0.93)",
                      transition:"opacity .25s,transform .25s",
                      boxShadow:i===idx?"0 6px 28px rgba(90,50,30,.14)":"none"}}>
                      {/* Image */}
                      <div style={{position:"relative",height:220,background:"#f0e0d4",
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:"4rem",overflow:"hidden"}}>
                        {p.image
                          ?<img src={p.image} alt="" style={{width:"100%",height:220,objectFit:"cover",display:"block"}}/>
                          :<div>{catEmoji(featuredView.category)}</div>}
                        {i===idx&&<button onClick={e=>{e.stopPropagation();openEditForm(p);}}
                          style={{position:"absolute",top:10,right:10,width:30,height:30,borderRadius:"50%",
                            background:"rgba(253,246,240,.92)",border:"1px solid rgba(232,216,204,.8)",
                            display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
                            boxShadow:"0 1px 4px rgba(0,0,0,.1)"}}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7a5c48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>}
                      </div>
                      {/* Details — inside the card */}
                      <div style={{padding:"14px 16px 16px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                          {p.brand&&<div style={{fontSize:".6rem",color:"#a08070",letterSpacing:".1em",textTransform:"uppercase"}}>{p.brand}</div>}
                          {p.price&&<div style={{fontSize:".7rem",fontWeight:500,color:"#3a2e27"}}>${parseFloat(p.price).toFixed(2)}</div>}
                        </div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",color:"#3a2e27",lineHeight:1.3,marginBottom:6}}>{p.name}</div>
                        {p.frequency&&<div style={{fontSize:".6rem",background:"#f0e8f4",borderRadius:5,padding:"2px 7px",color:"#7a6a8a",display:"inline-block",marginBottom:6}}>{p.frequency}</div>}
                        {p.notes&&<div style={{fontSize:".7rem",color:"#8a6858",fontStyle:"italic",lineHeight:1.5,marginBottom:10}}>{p.notes}</div>}
                        {i===idx&&(p.link||isDraft)&&<div style={{marginTop:p.notes?0:8}}>
                          {p.link&&<button onClick={e=>{e.stopPropagation();openUrl(p.link);}}
                            style={{width:"100%",background:"#b07a5e",color:"#fff",border:"none",borderRadius:9,padding:"9px",fontSize:".74rem",fontFamily:"'DM Sans',sans-serif",cursor:"pointer",fontWeight:500,marginBottom:isDraft?6:0}}>Buy Now</button>}
                          {isDraft&&(
                            removeConfirm===p.snapProdId
                              ? <div style={{display:"flex",gap:6,alignItems:"center",background:"#fff0ee",borderRadius:9,padding:"8px 10px"}}>
                                  <span style={{flex:1,fontSize:".68rem",color:"#c07060"}}>Remove from routine?</span>
                                  <button onClick={async e=>{e.stopPropagation();await removeProduct(p.snapProdId,p.name);setFeaturedView(null);setRemoveConfirm(null);}}
                                    style={{background:"#c07060",border:"none",borderRadius:7,padding:"5px 10px",color:"#fff",fontSize:".7rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>Yes</button>
                                  <button onClick={e=>{e.stopPropagation();setRemoveConfirm(null);}}
                                    style={{background:"none",border:"1px solid #e8d8cc",borderRadius:7,padding:"5px 10px",color:"#a08070",fontSize:".7rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
                                </div>
                              : <button onClick={e=>{e.stopPropagation();setRemoveConfirm(p.snapProdId);}}
                                  style={{width:"100%",background:"none",color:"#c07060",border:"1.5px solid #f0c8c0",borderRadius:9,padding:"8px",fontSize:".74rem",fontFamily:"'DM Sans',sans-serif",cursor:"pointer",textAlign:"center"}}>Remove from routine</button>
                          )}
                        </div>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dots */}
                <div style={{display:"flex",gap:5,justifyContent:"center",marginTop:14}}>
                  {catProds.map((_,i)=>(
                    <div key={i}
                      onClick={()=>{
                        setFeaturedView(f=>({...f,index:i}));
                        carouselScrollRef.current?.scrollTo({left:i*272,behavior:"smooth"});
                      }}
                      style={{height:6,borderRadius:3,cursor:"pointer",transition:"all .2s",
                        background:i===idx?"#b07a5e":"#e8d8cc",width:i===idx?18:6}}/>
                  ))}
                </div>
                <div style={{textAlign:"center",marginTop:5,fontSize:".62rem",color:"#c0b0a8",letterSpacing:".06em"}}>{idx+1} of {catProds.length}</div>

                {/* Edit form rendered as bottom sheet — see below MyProductsPage return */}
              </div>
            );
          })()}

          {/* ── Screen 1: Category rows ── */}
          {!featuredView&&(
            <>
              {snapProducts.length===0&&!showForm&&!chooseCat&&!isDraft&&(
                <div style={{textAlign:"center",padding:"52px 16px 44px"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.9rem",fontWeight:300,fontStyle:"italic",color:"#b07a5e",marginBottom:10}}>Your ritual begins here</div>
                  <div style={{fontSize:".78rem",color:"#a08070",lineHeight:1.8,marginBottom:28,maxWidth:260,margin:"0 auto 28px"}}>Add your first product to start building a routine you can track, analyze, and look back on.</div>
                  <button onClick={()=>setChooseCat(true)}
                    style={{background:"#b07a5e",border:"none",borderRadius:12,padding:"11px 32px",color:"#fff",fontSize:".82rem",fontFamily:"'DM Sans',sans-serif",cursor:"pointer",fontWeight:500,letterSpacing:".04em"}}>
                    Begin my routine
                  </button>
                </div>
              )}

              {(snapProducts.length>0||isDraft||chooseCat)&&(
                <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:20,padding:"18px",marginBottom:16}}>

                  {/* Card header: date + action buttons */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                    <div>
                      {activeSnap&&<div style={{fontSize:".58rem",letterSpacing:".14em",textTransform:"uppercase",color:"#c0a898",marginBottom:3}}>Current Routine</div>}
                      {activeSnap&&<div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontStyle:"italic",color:"#5a3a27"}}>Since {new Date(activeSnap.started_at+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>}
                      {activeSnap&&<div style={{fontSize:".7rem",color:"#a08070",marginTop:3}}>{snapProducts.length} product{snapProducts.length!==1?"s":""}{skinProds.length>0?` · ${skinProds.length} skin`:""}{ hairProds.length>0?` · ${hairProds.length} hair`:""}{ txProds.length>0?` · ${txProds.length} treatment`:""}</div>}
                      {isDraft&&draftSnap&&<div style={{marginTop:4,fontSize:".72rem",fontWeight:500,color:"#c07a28",letterSpacing:".04em"}}>Building your routine</div>}
                      {isDraft&&!draftSnap&&<div style={{marginTop:4,fontSize:".72rem",fontWeight:500,color:"#7a8a5a",letterSpacing:".04em"}}>Editing your routine</div>}
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0,marginLeft:10}}>
                      {!isDraft&&<button onClick={()=>setShowAnalysis(v=>!v)} style={{background:"#3a2e27",border:"none",borderRadius:9,padding:"6px 12px",color:"#f7ece4",fontSize:".72rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,whiteSpace:"nowrap"}}>{showAnalysis?"Close":"Analyze My Routine"}</button>}
                      {!isDraft&&<button onClick={()=>setShowAmPm(v=>!v)} style={{background:"none",border:"1.5px solid #e8d8cc",borderRadius:9,padding:"6px 10px",color:"#a08070",fontSize:".72rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>🌅 AM/PM</button>}
                      {!isDraft&&<button onClick={enterEditMode} style={{background:"none",border:"1.5px solid #e8d8cc",borderRadius:9,padding:"6px 10px",color:"#a08070",fontSize:".72rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>Update Routine</button>}
                      {isDraft&&<button onClick={discardChanges} style={{background:"none",border:"1.5px solid #e8d8cc",borderRadius:9,padding:"6px 12px",color:"#a08070",fontSize:".72rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>Discard</button>}
                      {isDraft&&<button onClick={()=>setConfirmFinalize(true)} style={{background:"#b07a5e",border:"none",borderRadius:9,padding:"6px 14px",color:"#fff",fontSize:".76rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,whiteSpace:"nowrap"}}>Save Routine</button>}
                    </div>
                  </div>

                  {/* Analysis panel */}
                  {showAnalysis&&activeSnap&&!isDraft&&(
                    <div style={{marginBottom:16,borderBottom:"1px solid #f0e0d4",paddingBottom:16}}>
                      <RoutineAnalysis products={products} snapProducts={activeSnap.products} entries={entries} dateRange={{start:activeSnap.started_at,end:null}} isCurrent={true} onClose={()=>setShowAnalysis(false)} onFetchIngredients={onFetchIngredients}/>
                    </div>
                  )}

                  {/* AM/PM Routine Builder */}
                  {showAmPm&&activeSnap&&!isDraft&&(
                    <div style={{marginBottom:16,borderBottom:"1px solid #f0e0d4",paddingBottom:16}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontStyle:"italic",color:"#5a3a27"}}>Morning & Night Routine</div>
                        <button onClick={()=>setShowAmPm(false)} style={{background:"none",border:"none",fontSize:"1.2rem",cursor:"pointer",color:"#a08070"}}>×</button>
                      </div>
                      <div style={{fontSize:".72rem",color:"#a08070",marginBottom:12,lineHeight:1.6}}>Tag each product as AM, PM, or both. Helps you see your morning vs. night routine at a glance.</div>
                      {snapProducts.length===0&&<div style={{fontSize:".78rem",color:"#c0a898",fontStyle:"italic"}}>No products in your routine yet.</div>}
                      {[["skin","🌿 Skin",skinProds],["hair","✨ Hair",hairProds],["treatment","💉 Treatments",txProds]].filter(([,,p])=>p.length>0).map(([cat,label,prods])=>(
                        <div key={cat} style={{marginBottom:14}}>
                          <div style={{fontSize:".62rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:8}}>{label}</div>
                          {prods.map(p=>(
                            <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:7,padding:"8px 10px",background:"#fdf6f0",borderRadius:10}}>
                              {p.image
                                ?<img src={p.image} alt="" style={{width:32,height:32,objectFit:"cover",borderRadius:6,flexShrink:0}}/>
                                :<div style={{width:32,height:32,borderRadius:6,background:"#f0e0d4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".9rem",flexShrink:0}}>{catEmoji(cat)}</div>
                              }
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:".76rem",fontWeight:500,color:"#3a2e27",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                              </div>
                              <div style={{display:"flex",gap:4,flexShrink:0}}>
                                {[["am","🌅"],["all","🔁"],["pm","🌙"]].map(([val,emoji])=>(
                                  <button key={val} onClick={()=>onUpdateSnapProductTimeOfDay(p.snapProdId,val)}
                                    style={{width:32,height:28,borderRadius:7,border:"1px solid",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:".72rem",
                                      background:(p.time_of_day||'all')===val?"#b07a5e":"transparent",
                                      color:(p.time_of_day||'all')===val?"#fff":"#a08070",
                                      borderColor:(p.time_of_day||'all')===val?"#b07a5e":"#ddd0c4"}}>
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      {/* AM view */}
                      {snapProducts.some(p=>p.time_of_day==='am')&&(
                        <div style={{marginTop:12,padding:"10px 12px",background:"#fffbf5",border:"1px solid #f0e4d0",borderRadius:10}}>
                          <div style={{fontSize:".62rem",letterSpacing:".1em",textTransform:"uppercase",color:"#b07a5e",marginBottom:6}}>🌅 Morning Routine</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                            {snapProducts.filter(p=>p.time_of_day==='am'||p.time_of_day==='all').map(p=>(
                              <div key={p.id} style={{fontSize:".68rem",background:"#fdf0e4",border:"1px solid #e8d0b8",borderRadius:20,padding:"3px 10px",color:"#7a5c48"}}>{p.name}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      {snapProducts.some(p=>p.time_of_day==='pm')&&(
                        <div style={{marginTop:8,padding:"10px 12px",background:"#f5f4fb",border:"1px solid #dcd8f0",borderRadius:10}}>
                          <div style={{fontSize:".62rem",letterSpacing:".1em",textTransform:"uppercase",color:"#7a6a9a",marginBottom:6}}>🌙 Night Routine</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                            {snapProducts.filter(p=>p.time_of_day==='pm'||p.time_of_day==='all').map(p=>(
                              <div key={p.id} style={{fontSize:".68rem",background:"#ede8f8",border:"1px solid #c8c0e8",borderRadius:20,padding:"3px 10px",color:"#5a4a7a"}}>{p.name}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add product form */}
                  {showForm&&editProd&&<ProductForm key={editProd.id} initialData={editProd} isEditingProd={isEditingProd} onSave={save} onClose={handleCloseForm}/>}

                  {/* Add product button */}
                  {!showForm&&isDraft&&!chooseCat&&(
                    <button onClick={()=>setChooseCat(true)}
                      style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"1.5px dashed #e8d8cc",borderRadius:12,padding:"10px 16px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",color:"#a08070",fontSize:".82rem",width:"100%",marginBottom:14}}>
                      <span style={{fontSize:"1.1rem"}}>+</span> Add a product
                    </button>
                  )}

                  {/* Category picker */}
                  {!showForm&&isDraft&&chooseCat&&(
                    <div style={{background:"#fdf6f0",border:"1.5px solid #e8d8cc",borderRadius:14,padding:"16px",marginBottom:14}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontStyle:"italic",color:"#7a5c48",marginBottom:12}}>Add a product</div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {[["🌿","Skin","skin"],["✨","Hair","hair"],["💉","Treatment","treatment"]].map(([emoji,label,cat])=>(
                          <button key={cat} onClick={()=>{setEditProd(blank(cat));setIsEditingProd(false);setShowForm(true);setChooseCat(false);}}
                            style={{display:"flex",alignItems:"center",gap:12,background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                            <span style={{fontSize:"1.2rem"}}>{emoji}</span>
                            <span style={{fontSize:".86rem",color:"#3a2e27",fontWeight:500}}>{label} Product</span>
                          </button>
                        ))}
                        <button onClick={()=>setChooseCat(false)} style={{background:"none",border:"none",fontSize:".76rem",color:"#a08070",cursor:"pointer",marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Category rows */}
                  {[["skin","🌿 Skin",skinProds],["hair","✨ Hair",hairProds],["treatment","💉 Treatments",txProds]].filter(([,,p])=>p.length>0).map(([cat,label,prods],ri,arr)=>(
                    <div key={cat} style={{marginBottom:ri<arr.length-1?18:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                        <div style={{fontSize:".66rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070"}}>
                          {label}{isDraft&&<span style={{fontSize:".56rem",color:"#c0b0a8",marginLeft:6,fontStyle:"italic"}}>drag to reorder</span>}
                        </div>
                        <div style={{fontSize:".62rem",color:"#c0b0a8"}}>{prods.length} product{prods.length!==1?"s":""}</div>
                      </div>
                      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none",WebkitOverflowScrolling:"touch",paddingRight:18,marginRight:-18}}>
                        {prods.map((p,i)=>{
                          const isBeingDragged = dragItem.current?.id===p.id;
                          const isDropTarget = dragTargetId===p.id && dragItem.current?.cat===cat && dragItem.current?.id!==p.id;
                          return (
                            <div key={p.id}
                              draggable={isDraft}
                              onDragStart={isDraft ? e=>{e.dataTransfer.effectAllowed="move"; dragItem.current={id:p.id,cat,i}; setTimeout(()=>setDragTargetId(null),0);} : undefined}
                              onDragEnd={isDraft ? ()=>{dragItem.current=null; setDragTargetId(null);} : undefined}
                              onDragOver={isDraft ? e=>{e.preventDefault(); e.dataTransfer.dropEffect="move"; if(dragTargetId!==p.id) setDragTargetId(p.id);} : undefined}
                              onDragLeave={isDraft ? ()=>setDragTargetId(d=>d===p.id?null:d) : undefined}
                              onDrop={isDraft ? e=>{
                                e.preventDefault();
                                const from = dragItem.current;
                                if (!from||from.id===p.id||from.cat!==cat){setDragTargetId(null);return;}
                                const fromIdx = prods.findIndex(x=>x.id===from.id);
                                const reordered=[...prods];
                                const [moved]=reordered.splice(fromIdx,1);
                                reordered.splice(i,0,moved);
                                onSaveProductOrder(reordered.map((x,idx)=>({id:x.id,sort_order:idx})));
                                dragItem.current=null; setDragTargetId(null);
                              } : undefined}
                              onClick={()=>{ if(!dragItem.current) setFeaturedView({category:cat,index:i}); }}
                              style={{flexShrink:0,width:96,position:"relative",
                                background:isDropTarget?"#fdf0e8":"#fff8f3",
                                border:isDropTarget?"1.5px solid #b07a5e":"1.5px solid #e8d8cc",
                                borderRadius:13,overflow:"hidden",
                                cursor:isDraft?"grab":"pointer",
                                opacity:isBeingDragged?0.4:1,
                                transition:"opacity .15s,border-color .15s,background .15s"}}>
                              {isDraft&&<div style={{position:"absolute",top:4,left:4,fontSize:".65rem",color:"rgba(160,128,112,.6)",pointerEvents:"none",zIndex:1}}>⠿</div>}
                              {p.image
                                ?<img src={p.image} alt="" style={{width:"100%",height:76,objectFit:"cover",display:"block"}}/>
                                :<div style={{width:"100%",height:76,background:"#f0e0d4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem"}}>{catEmoji(cat)}</div>
                              }
                              <div style={{padding:"7px 8px 8px"}}>
                                <div style={{fontSize:".7rem",fontWeight:500,color:"#3a2e27",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                                {p.brand&&<div style={{fontSize:".6rem",color:"#a08070",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.brand}</div>}
                                {p.frequency&&<div style={{fontSize:".56rem",background:"#f0e8f4",borderRadius:5,padding:"1px 5px",color:"#7a6a8a",display:"inline-block",marginTop:3}}>{p.frequency}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                </div>
              )}
            </>
          )}
        </>
      )}

      {tab==="history"&&(
        <>
          {showCompare&&(
            <CompareRoutines
              snapshots={[...(activeSnap?[{...activeSnap,ended_at:null}]:[]),...pastSnaps]}
              products={products}
              entries={entries}
              onClose={()=>setShowCompare(false)}/>
          )}
          {!showCompare&&(
            <button onClick={()=>setShowCompare(true)}
              style={{width:"100%",background:"#3a2e27",border:"none",borderRadius:12,padding:"12px",color:"#f7ece4",fontSize:".82rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,marginBottom:16,letterSpacing:".04em"}}>
              ✦ Compare Routines
            </button>
          )}
          {pastSnaps.length===0&&!showCompare&&(
            <div style={{textAlign:"center",padding:"40px 16px"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.2rem",fontStyle:"italic",color:"#b09080",marginBottom:8}}>No history yet</div>
              <div style={{fontSize:".74rem",color:"#c0a898",lineHeight:1.7}}>Your past routines will appear here each time you update what you're using.</div>
            </div>
          )}
          {!showCompare&&pastSnaps.length>0&&(
            <div style={{position:"relative",paddingLeft:24}}>
              {/* Timeline spine */}
              <div style={{position:"absolute",left:6,top:20,bottom:20,width:1.5,background:"linear-gradient(to bottom,#e8d8cc,#f4ece6)"}}/>
              {pastSnaps.map((snap,i)=>(
                <div key={snap.id} style={{position:"relative",marginBottom:12}}>
                  {/* Timeline dot */}
                  <div style={{position:"absolute",left:-24,top:20,width:13,height:13,borderRadius:"50%",
                    background:i===0?"#b07a5e":"#fdf6f0",
                    border:`2px solid ${i===0?"#b07a5e":"#d0c0b8"}`,
                    boxShadow:i===0?"0 0 0 3px rgba(176,122,94,.12)":"none"}}/>
                  <SnapCard snap={snap} onDeleteSnapshot={onDeleteSnapshot}/>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      {showForm&&editProd&&isEditingProd&&(
        <SlimEditForm key={editProd.id} initialData={editProd} onSave={save} onClose={handleCloseForm}/>
      )}

      {/* Finalize confirmation */}
      {confirmFinalize&&(
        <div className="overlay" onClick={()=>setConfirmFinalize(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title" style={{marginBottom:12}}>Save Your Routine?</div>
            <div style={{fontSize:".84rem",color:"#6a5048",lineHeight:1.7,marginBottom:20}}>
              {draftSnap
                ? "This locks in your routine as a snapshot. Future changes will automatically create a new version so your history stays intact."
                : `This will save your changes${(draftChanges?.added?.length||0)+(draftChanges?.removed?.length||0)>0?" and create a new snapshot":""}.${(draftChanges?.added?.length||0)+(draftChanges?.removed?.length||0)>0?" Your current routine will be preserved in History.":""}`
              }
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmFinalize(false)} className="ghost-btn" style={{flex:1}}>Cancel</button>
              <button onClick={doFinalize}
                style={{flex:1,background:"#b07a5e",border:"none",borderRadius:12,padding:"12px",color:"#fff",fontSize:".84rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
                Save Routine
              </button>
            </div>
          </div>
        </div>
      )}

      {newProductAlert&&(
        <div className="overlay" onClick={()=>setNewProductAlert(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title" style={{marginBottom:12}}>Different product?</div>
            <div style={{fontSize:".84rem",color:"#6a5048",lineHeight:1.7,marginBottom:20}}>
              {newProductAlert.data.category !== (newProductAlert.data._origCategory||newProductAlert.data.category)
                ? "Changing the category means this is a different product in your routine."
                : `"${newProductAlert.data._origName}" → "${newProductAlert.data.name}" looks like a different product, not just a typo.`
              } To keep your history accurate, the old product will be removed and this will be added as new.
            </div>
            <div style={{display:"flex",gap:10,flexDirection:"column"}}>
              <button onClick={async()=>{
                const orig = newProductAlert.originalId;
                const newData = {...newProductAlert.data, id:crypto.randomUUID(), _origName:undefined, _origBrand:undefined, _origCategory:undefined};
                await onSaveProduct(newData);
                const meta = {name_snapshot:newData.name, brand_snapshot:newData.brand||"", frequency:newData.frequency||null};
                if (activeSnap) {
                  const oldSp = activeSnap.products.find(sp=>sp.product_id===orig);
                  if (oldSp) await onRemoveFromSnapshot(activeSnap.id, oldSp.id);
                  await onAddToSnapshot(activeSnap.id, newData.id, meta);
                  if (draftChanges) setDraftChanges(prev=>({...prev, added:[...prev.added,newData.name], removed:[...prev.removed,newProductAlert.data._origName||orig]}));
                }
                setNewProductAlert(null);
                setShowForm(false); setEditProd(null); setIsEditingProd(false);
              }} style={{background:"#b07a5e",border:"none",borderRadius:12,padding:"12px",color:"#fff",fontSize:".84rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
                Yes, it's a new product
              </button>
              <button onClick={()=>setNewProductAlert(null)} className="ghost-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {routineSuccess&&(
        <div className="overlay" onClick={()=>setRoutineSuccess(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:"1.6rem",marginBottom:8}}>✓</div>
              <div className="modal-title" style={{marginBottom:8}}>{routineSuccess.title}</div>
              <div style={{fontSize:".84rem",color:"#6a5048",lineHeight:1.7}}>{routineSuccess.body}</div>
            </div>
            <button onClick={()=>setRoutineSuccess(null)}
              style={{width:"100%",background:"#b07a5e",border:"none",borderRadius:12,padding:"12px",color:"#fff",fontSize:".84rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Unsaved changes warning */}
      {unsavedWarning&&(
        <div className="overlay" onClick={()=>setUnsavedWarning(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title" style={{marginBottom:12}}>Unsaved Changes</div>
            <div style={{fontSize:".84rem",color:"#6a5048",lineHeight:1.7,marginBottom:20}}>
              You have unsaved changes to your routine. What would you like to do?
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={saveDraft}
                style={{background:"#b07a5e",border:"none",borderRadius:12,padding:"12px",color:"#fff",fontSize:".84rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
                Save Draft
              </button>
              <button onClick={discardChanges}
                style={{background:"none",border:"1.5px solid #e8d8cc",borderRadius:12,padding:"12px",color:"#c07060",fontSize:".84rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                Discard Changes
              </button>
              <button onClick={()=>setUnsavedWarning(false)} className="ghost-btn">Stay on Page</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function TreatmentHistoryCard({ tx, doneDates }) {
  const [open, setOpen] = useState(false);
  const sorted = [...doneDates].sort((a,b)=>b.localeCompare(a));
  return (
    <div className="freq-card" style={{marginBottom:10}}>
      <div className="freq-top" style={{cursor:"pointer"}} onClick={()=>setOpen(p=>!p)}>
        <span className="freq-emoji">💉</span>
        <span className="freq-label">{tx.name}</span>
        <span className="freq-count">{doneDates.length}x done</span>
        <span style={{marginLeft:6,color:"#b07a5e",fontSize:".8rem"}}>{open?"▲":"▼"}</span>
      </div>
      <div style={{fontSize:".72rem",color:"#a08070",marginTop:2}}>{tx.type==="skin"?"🌿 Skin":"✨ Hair"}</div>
      {open&&sorted.length>0&&<div style={{marginTop:10,borderTop:"1px solid #f0e0d4",paddingTop:8}}>
        {sorted.map(d=>(
          <div key={d} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f7ece4",fontSize:".8rem",color:"#5a3a27"}}>
            <span>{parse(d).toLocaleDateString("en-US",{weekday:"short",month:"long",day:"numeric",year:"numeric"})}</span>
            <span style={{color:"#2d4a2d",fontWeight:500}}>✓</span>
          </div>
        ))}
      </div>}
      {open&&sorted.length===0&&<div style={{marginTop:8,fontSize:".8rem",color:"#b09080",fontStyle:"italic"}}>No completed sessions yet</div>}
    </div>
  );
}

function MiniCal({ selectedDates, onToggleDate, rangeStart, onRangeStart, onRangeEnd, needleDates=[] }) {
  const today=fmt(new Date());
  const [calM, setCalM]=useState({y:new Date().getFullYear(),m:new Date().getMonth()});
  const [hov, setHov]=useState(null);
  const [rangeMode, setRangeMode]=useState(false); // true = waiting for 2nd tap
  const [pendingStart, setPendingStart]=useState(null); // the first tapped date in range mode
  function daysInM(y,m){return new Date(y,m+1,0).getDate();}
  function getCells(){
    const {y,m}=calM;
    const rawFirst=new Date(y,m,1).getDay();
    const first=(rawFirst===0)?6:rawFirst-1;
    const days=daysInM(y,m);
    const cells=[];
    for(let i=0;i<first;i++) cells.push(null);
    for(let d=1;d<=days;d++) cells.push(fmt(new Date(y,m,d)));
    return cells;
  }
  const cells=getCells();
  const monthLabel=new Date(calM.y,calM.m,1).toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const inPreview=d=>{
    if(!rangeMode||!pendingStart||!hov||hov===pendingStart||!d) return false;
    const [lo,hi]=pendingStart<hov?[pendingStart,hov]:[hov,pendingStart];
    return d>lo&&d<hi;
  };
  const handleClick=d=>{
    if(rangeMode){
      if(d===pendingStart){
        // Tap same date again — cancel range mode, just select it
        setRangeMode(false); setPendingStart(null);
        if(!selectedDates.includes(d)) onToggleDate(d);
      } else {
        // Second tap on different date — complete the range
        const [lo,hi]=d>pendingStart?[pendingStart,d]:[d,pendingStart];
        const range=[];
        const cur=parse(lo); const end=parse(hi);
        while(cur<=end){range.push(fmt(new Date(cur)));cur.setDate(cur.getDate()+1);}
        onRangeEnd(range);
        setRangeMode(false); setPendingStart(null);
      }
    } else if(selectedDates.includes(d)){
      // Already selected — second tap on selected date enters range mode
      setRangeMode(true); setPendingStart(d);
      onRangeStart&&onRangeStart(d);
    } else {
      // First tap — just select/toggle the date
      onToggleDate(d);
    }
  };
  return (
    <div style={{background:"#fff8f3",border:"1px solid #e8d8cc",borderRadius:12,overflow:"hidden",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #eedad2"}}>
        <button onClick={()=>setCalM(p=>{const d=new Date(p.y,p.m-1,1);return{y:d.getFullYear(),m:d.getMonth()};})} style={{background:"none",border:"none",cursor:"pointer",color:"#b07a5e",fontSize:"1rem",padding:"2px 8px"}}>‹</button>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",color:"#3a2e27"}}>{monthLabel}</span>
        <button onClick={()=>setCalM(p=>{const d=new Date(p.y,p.m+1,1);return{y:d.getFullYear(),m:d.getMonth()};})} style={{background:"none",border:"none",cursor:"pointer",color:"#b07a5e",fontSize:"1rem",padding:"2px 8px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",textAlign:"center",padding:"6px 8px 2px"}}>
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=><div key={d} style={{fontSize:".62rem",color:"#b09080",fontWeight:500,letterSpacing:".04em"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"2px 8px 10px",gap:2}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={`e${i}`} style={{aspectRatio:1}}/>;
          const sel=selectedDates.includes(d);
          const isPending=d===pendingStart&&rangeMode;
          const prev=inPreview(d);
          const isNeedle=needleDates.includes(d);
          return (
            <div key={d} onClick={()=>handleClick(d)}
              onMouseEnter={()=>rangeMode&&setHov(d)}
              onMouseLeave={()=>setHov(null)}
              style={{aspectRatio:1,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",fontSize:".78rem",cursor:"pointer",position:"relative",
                background:sel?"#b07a5e":isPending?"#c08870":prev?"#f7e8de":"transparent",
                color:sel||isPending?"#fff":"#3a2e27",fontWeight:sel?600:400,
                border:d===today&&!sel?"1.5px solid #b07a5e":"none",
                boxShadow:isPending?"0 0 0 2px #fff,0 0 0 4px #b07a5e":"none"}}>
              {parse(d).getDate()}
              {isNeedle&&<span style={{position:"absolute",bottom:1,right:1,fontSize:".42rem",lineHeight:1,pointerEvents:"none"}}>💉</span>}
            </div>
          );
        })}
      </div>
      {rangeMode&&<div style={{padding:"4px 14px 8px",fontSize:".72rem",color:"#b07a5e",fontStyle:"italic"}}>Tap another date to select a range</div>}
      {selectedDates.length>0&&!rangeMode&&<div style={{padding:"6px 14px 10px",fontSize:".72rem",color:"#b07a5e"}}>
        {selectedDates.length} date{selectedDates.length!==1?"s":""} selected
      </div>}
    </div>
  );
}

function PlanModal({ allItems, skinItems: skinItemsProp, hairItems: hairItemsProp, schedules, treatments, onSave, onSaveMany, onDelete, onSaveTreatment, onDeleteTreatment, onClose, onAddItem, initialPlan, initialTreatment }) {
  const [screen, setScreen]=useState(initialPlan?"editPlan":initialTreatment?"editTreatment":"chooseType"); // chooseType | editPlan | editTreatment
  const [editing, setEditing]=useState(initialPlan?{...initialPlan,itemIds:initialPlan.itemIds||[initialPlan.itemId].filter(Boolean),dates:initialPlan.dates||[],startDate:initialPlan.startDate||fmt(new Date())}:{id:uid(),itemIds:[],days:[],dates:[],startDate:fmt(new Date()),reminder:false,time:"08:00",location:""});
  const [editTx, setEditTx]=useState(initialTreatment?{...initialTreatment}:{id:uid(),name:"",type:"skin",dates:[],completedDates:[],location:"",price:"",notes:""});
  const [txMode, setTxMode]=useState(initialTreatment?"upcoming":null); // null | "past" | "upcoming"
  const [pastDate, setPastDate]=useState(fmt(new Date()));
  const [showItemPick, setShowItemPick]=useState(false);
  const [calRangeStart, setCalRangeStart]=useState(null);
  const [newStepLabel, setNewStepLabel]=useState("");
  const [newStepEmoji, setNewStepEmoji]=useState("🌿");
  const [showNewStepEmoji, setShowNewStepEmoji]=useState(false);

  const startNewPlan=()=>{ setEditing({id:uid(),itemIds:[],days:[],dates:[],startDate:fmt(new Date()),reminder:false,time:"08:00",location:""}); setScreen("editPlan"); };
  const startEditPlan=s=>{ setEditing({...s,itemIds:s.itemIds||[s.itemId].filter(Boolean),dates:s.dates||[],startDate:s.startDate||fmt(new Date())}); setScreen("editPlan"); };
  const startNewTx=()=>{ setEditTx({id:uid(),name:"",type:"skin",dates:[]}); setScreen("editTreatment"); };
  const startEditTx=t=>{ setEditTx({...t}); setScreen("editTreatment"); };

  const toggleDay=d=>setEditing(e=>({...e,days:e.days.includes(d)?e.days.filter(x=>x!==d):[...e.days,d]}));
  const skinItems=skinItemsProp||allItems;
  const hairItems=hairItemsProp||allItems;
  const getItem=id=>allItems.find(x=>x.id===id);

  const savePlan=()=>{
    if(!editing.itemIds?.length) return;
    // Create one plan object per selected item, save all at once
    const plans=editing.itemIds.map((itemId,i)=>({
      ...editing,
      id: i===0&&editing.itemIds.length===1 ? editing.id : uid(),
      itemId,
      itemIds: undefined,
      startDate: editing.startDate||fmt(new Date())
    }));
    onSaveMany(plans);
    setEditing(null); setScreen("list");
  };
  const saveTx=()=>{}; // replaced by inline handlers below

  if(screen==="chooseType"){
    return (
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
        <div className="modal" style={{textAlign:"center"}}>
          <div className="modal-top" style={{justifyContent:"flex-end"}}>
            <button className="modal-x" onClick={onClose}>×</button>
          </div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.5rem",fontStyle:"italic",color:"#3a2e27",marginBottom:6}}>What are you planning?</div>
          <div style={{fontSize:".78rem",color:"#a08070",marginBottom:28}}>Choose a category to get started</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[["🌿","Skin Routine","Plan your skin care steps","skin"],["✨","Hair Routine","Plan your hair care steps","hair"],["💉","Treatment","Schedule a treatment session","treatment"]].map(([emoji,label,sub,type])=>(
              <button key={type} onClick={()=>{
                if(type==="treatment"){ setEditTx({id:uid(),name:"",type:"skin",dates:[]}); setScreen("editTreatment"); }
                else { setEditing(e=>({...e,itemIds:[],_category:type})); setScreen("editPlan"); }
              }} style={{display:"flex",alignItems:"center",gap:14,background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:14,padding:"14px 18px",cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:"'DM Sans',sans-serif"}}>
                <span style={{fontSize:"1.6rem"}}>{emoji}</span>
                <div>
                  <div style={{fontSize:".9rem",color:"#3a2e27",fontWeight:500}}>{label}</div>
                  <div style={{fontSize:".74rem",color:"#a08070",marginTop:2}}>{sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if(screen==="editPlan"&&editing){
    const canSave=editing.itemIds?.length>0&&(editing.days.length>0||editing.dates.length>0||!!editing.startDate);
    const toggleItemSel=id=>setEditing(e=>({...e,itemIds:e.itemIds.includes(id)?e.itemIds.filter(x=>x!==id):[...e.itemIds,id]}));
    return (
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
        <div className="modal">
          <div className="modal-top">
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {!schedules.find(s=>s.id===editing.id)&&!initialPlan&&<button className="ghost-btn" style={{padding:"4px 10px",fontSize:".75rem"}} onClick={()=>setScreen("chooseType")}>← Back</button>}
              <div className="modal-title">{schedules.find(s=>s.id===editing.id)?"Edit Plan":"New Plan"}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {schedules.find(s=>s.id===editing.id)&&<button className="del-btn" onClick={()=>{onDelete(editing.id);onClose();}}>Delete</button>}
              <button className="modal-x" onClick={onClose}>×</button>
            </div>
          </div>
          {schedules.find(s=>s.id===editing.id)?(
            // Editing existing — show step name only, not selectable
            <div style={{marginBottom:14}}>
              {(editing.itemIds||[]).map(id=>{
                const it=allItems.find(x=>x.id===id);
                if(!it) return null;
                return (
                  <div key={id} className="m-item" style={{background:"#f7ece4",border:"1.5px solid #b07a5e",marginBottom:0,cursor:"default"}}>
                    <span style={{fontSize:"1rem"}}>{it.emoji}</span>
                    <span className="m-item-lbl" style={{color:"#5a3a27",fontWeight:500}}>{it.label}</span>
                  </div>
                );
              })}
            </div>
          ):(
            // New plan — full selectable list
            <>
              <div className="modal-sub">Steps — select one or more</div>
              <div style={{marginBottom:8,display:"flex",flexDirection:"column",gap:6}}>
                {(editing._category==="hair"?hairItems:editing._category==="skin"?skinItems:allItems).map(it=>{
                  const on=(editing.itemIds||[]).includes(it.id);
                  return (
                    <div key={it.id} className="m-item" style={{cursor:"pointer",background:on?"#f7ece4":"#fff8f3",border:on?"1.5px solid #b07a5e":"1px solid #e8d8cc",marginBottom:0}}
                      onClick={()=>toggleItemSel(it.id)}>
                      <span style={{fontSize:"1rem"}}>{it.emoji}</span>
                      <span className="m-item-lbl" style={{color:on?"#5a3a27":"#3a2e27",fontWeight:on?500:400}}>{it.label}</span>
                      <div style={{width:16,height:16,borderRadius:"50%",border:`1.5px solid ${on?"#b07a5e":"#d0b0a0"}`,background:on?"#b07a5e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {on&&<svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {onAddItem&&<div style={{marginBottom:14}}>
                <div className="row" style={{gap:6}}>
                  <button className="epick-btn" onClick={()=>setShowNewStepEmoji(p=>!p)}>{newStepEmoji}</button>
                  <input className="ifield" style={{flex:1}} placeholder="Add a new step…" value={newStepLabel}
                    onChange={e=>setNewStepLabel(e.target.value)}
                    onKeyDown={e=>{
                      if(e.key==="Enter"&&newStepLabel.trim()){
                        const item={id:uid(),label:newStepLabel.trim(),emoji:newStepEmoji};
                        onAddItem(editing._category==="hair"?"hair":"skin", item);
                        setEditing(ed=>({...ed,itemIds:[...(ed.itemIds||[]),item.id]}));
                        setNewStepLabel(""); setNewStepEmoji("🌿"); setShowNewStepEmoji(false);
                      }
                    }}/>
                  <button className="confirm-btn" disabled={!newStepLabel.trim()} onClick={()=>{
                    if(!newStepLabel.trim()) return;
                    const item={id:uid(),label:newStepLabel.trim(),emoji:newStepEmoji};
                    onAddItem(editing._category==="hair"?"hair":"skin", item);
                    setEditing(ed=>({...ed,itemIds:[...(ed.itemIds||[]),item.id]}));
                    setNewStepLabel(""); setNewStepEmoji("🌿"); setShowNewStepEmoji(false);
                  }}>+ Add</button>
                </div>
                {showNewStepEmoji&&<div className="egrid" style={{marginTop:6}}>{EMOJI_OPTIONS.flat().map(em=>(
                  <span key={em} className={`eopt ${newStepEmoji===em?"on":""}`}
                    onClick={()=>{setNewStepEmoji(em);setShowNewStepEmoji(false)}}>{em}</span>
                ))}</div>}
              </div>}
            </>
          )}
          {editing._category==="treatment"&&<>
            <div className="modal-sub" style={{marginBottom:6}}>📍 Location</div>
            <input className="ifield" style={{width:"100%",marginBottom:14}} placeholder="e.g. Glow Clinic, Miami"
              value={editing.location||""} onChange={e=>setEditing(ed=>({...ed,location:e.target.value}))}/>
          </>}
          <div className="modal-sub">Start date</div>
          <input type="date" className="time-input" style={{width:"100%",marginBottom:14}}
            value={editing.startDate||fmt(new Date())}
            onChange={e=>setEditing(ed=>({...ed,startDate:e.target.value}))}/>
          <div className="modal-sub" style={{marginBottom:8}}>Every — leave blank for one-off</div>
          <div className="toggle-row" style={{marginBottom:8}}>
            <div><div className="toggle-lbl">Every day</div></div>
            <Toggle on={editing.days.length===7} onChange={v=>setEditing(e=>({...e,days:v?[0,1,2,3,4,5,6]:[]}))}/>
          </div>
          {editing.days.length!==7&&<div className="dow-row" style={{marginBottom:10}}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=>{
              const dow=[1,2,3,4,5,6,0][i];
              return <button key={d} className={`dow-chip ${editing.days.includes(dow)?"on":""}`} onClick={()=>toggleDay(dow)}>{d}</button>;
            })}
          </div>}
          {editing.days.length!==7&&<>
            <div className="modal-sub">Specific dates (tap to select, tap two for range)</div>
            <MiniCal
              selectedDates={editing.dates||[]}
              onToggleDate={d=>setEditing(e=>({...e,dates:e.dates.includes(d)?e.dates.filter(x=>x!==d):[...e.dates,d]}))}
              rangeStart={calRangeStart}
              onRangeStart={d=>setCalRangeStart(d)}
              onRangeEnd={range=>{ setEditing(e=>({...e,dates:[...new Set([...(e.dates||[]),...range])]})); setCalRangeStart(null); }}
            />
          </>}

          <div className="toggle-row">
            <div><div className="toggle-lbl">🔔 Remind me</div><div className="toggle-sub">Browser notification</div></div>
            <Toggle on={editing.reminder} onChange={v=>setEditing(e=>({...e,reminder:v}))}/>
          </div>
          {editing.reminder&&<div style={{marginBottom:14}}>
            <input type="time" className="time-input" value={editing.time} onChange={e=>setEditing(ed=>({...ed,time:e.target.value}))}/>
          </div>}
          <button className="save-btn" onClick={savePlan} disabled={!canSave} style={{opacity:canSave?1:.4}}>Save Plan</button>
        </div>
      </div>
    );
  }

  if(screen==="editTreatment"&&editTx){
    const isExisting=treatments.find(t=>t.id===editTx.id);
    const TypeToggle=()=>(
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {["skin","hair"].map(tp=>(
          <button key={tp} className={`dow-chip ${editTx.type===tp?"on":""}`} style={{flex:1,textAlign:"center"}}
            onClick={()=>setEditTx(t=>({...t,type:tp}))}>
            {tp==="skin"?"🌿 Skin":"✨ Hair"}
          </button>
        ))}
      </div>
    );
    const SharedFields=()=>(
      <>
        <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Treatment name (e.g. Facial, Microneedling…)"
          value={editTx.name} onChange={e=>setEditTx(t=>({...t,name:e.target.value}))} autoFocus/>
        <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="📍 Location"
          value={editTx.location||""} onChange={e=>setEditTx(t=>({...t,location:e.target.value}))}/>
        <TypeToggle/>
        <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="💰 Price (e.g. $80)"
          value={editTx.price||""} onChange={e=>setEditTx(t=>({...t,price:e.target.value}))}/>
        <textarea className="ifield" style={{width:"100%",marginBottom:12,minHeight:60,resize:"vertical"}} placeholder="Notes…"
          value={editTx.notes||""} onChange={e=>setEditTx(t=>({...t,notes:e.target.value}))}/>
      </>
    );

    // ── Mode chooser (new treatments only) ──────────────────────────────────
    if(!txMode&&!isExisting){
      return (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
          <div className="modal">
            <div className="modal-top">
              <button className="ghost-btn" style={{padding:"4px 10px",fontSize:".75rem"}} onClick={()=>setScreen("chooseType")}>← Back</button>
              <div className="modal-title">New Treatment</div>
              <button className="modal-x" onClick={onClose}>×</button>
            </div>
            <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Treatment name (e.g. Facial, Microneedling…)"
              value={editTx.name} onChange={e=>setEditTx(t=>({...t,name:e.target.value}))} autoFocus/>
            <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="📍 Location"
              value={editTx.location||""} onChange={e=>setEditTx(t=>({...t,location:e.target.value}))}/>
            <TypeToggle/>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",color:"#3a2e27",marginBottom:14,fontStyle:"italic"}}>When is this treatment?</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>setTxMode("past")} style={{display:"flex",alignItems:"center",gap:14,background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:14,padding:"14px 18px",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
                <span style={{fontSize:"1.5rem"}}>📅</span>
                <div>
                  <div style={{fontSize:".9rem",color:"#3a2e27",fontWeight:500}}>Register a past treatment</div>
                  <div style={{fontSize:".74rem",color:"#a08070",marginTop:2}}>Log something you've already had</div>
                </div>
              </button>
              <button onClick={()=>setTxMode("upcoming")} style={{display:"flex",alignItems:"center",gap:14,background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:14,padding:"14px 18px",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
                <span style={{fontSize:"1.5rem"}}>💉</span>
                <div>
                  <div style={{fontSize:".9rem",color:"#3a2e27",fontWeight:500}}>Plan an upcoming treatment</div>
                  <div style={{fontSize:".74rem",color:"#a08070",marginTop:2}}>Schedule something coming up</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ── Past treatment form ─────────────────────────────────────────────────
    if(txMode==="past"&&!isExisting){
      const canSave=editTx.name.trim()&&pastDate;
      const doSave=(addMore)=>{
        if(!canSave) return;
        const tx={...editTx,completedDates:[...(editTx.completedDates||[]),pastDate]};
        onSaveTreatment(tx);
        if(addMore){
          setEditTx({id:uid(),name:"",type:editTx.type,dates:[],completedDates:[],location:"",price:"",notes:""});
          setPastDate(fmt(new Date()));
        } else {
          setEditTx(null); setScreen("list");
        }
      };
      return (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
          <div className="modal">
            <div className="modal-top">
              <button className="ghost-btn" style={{padding:"4px 10px",fontSize:".75rem"}} onClick={()=>setTxMode(null)}>← Back</button>
              <div className="modal-title">Past Treatment</div>
              <button className="modal-x" onClick={onClose}>×</button>
            </div>
            <SharedFields/>
            <input type="date" className="time-input" style={{width:"100%",marginBottom:14}}
              value={pastDate} onChange={e=>setPastDate(e.target.value)}/>
            <div style={{display:"flex",gap:8}}>
              <button className="save-btn" onClick={()=>doSave(false)} disabled={!canSave} style={{flex:1,opacity:canSave?1:.4}}>Save</button>
              <button className="ghost-btn" onClick={()=>doSave(true)} disabled={!canSave} style={{flex:1,opacity:canSave?1:.4,padding:"10px 0",fontSize:".82rem"}}>+ Add More</button>
            </div>
          </div>
        </div>
      );
    }

    // ── Upcoming / edit existing form ───────────────────────────────────────
    const canSaveFinal=isExisting?editTx.name.trim():(editTx.name.trim()&&editTx.dates.length>0);
    const doSaveUpcoming=(addMore)=>{
      if(!canSaveFinal) return;
      onSaveTreatment(editTx);
      if(addMore&&!isExisting){
        setEditTx({id:uid(),name:"",type:editTx.type,dates:[],completedDates:[],location:"",price:"",notes:""});
      } else {
        setEditTx(null); setScreen("list");
      }
    };
    return (
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
        <div className="modal">
          <div className="modal-top">
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {!isExisting&&<button className="ghost-btn" style={{padding:"4px 10px",fontSize:".75rem"}} onClick={()=>setTxMode(null)}>← Back</button>}
              <div className="modal-title">{isExisting?"Edit Treatment":"Upcoming Treatment"}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {isExisting&&<button className="del-btn" onClick={()=>{onDeleteTreatment(editTx.id);onClose();}}>Delete</button>}
              <button className="modal-x" onClick={onClose}>×</button>
            </div>
          </div>
          <SharedFields/>
          <div className="modal-sub" style={{marginBottom:6}}>{isExisting?"Scheduled date(s)":"Pick date(s)"}</div>
          <MiniCal
            selectedDates={editTx.dates}
            onToggleDate={d=>setEditTx(t=>({...t,dates:t.dates.includes(d)?t.dates.filter(x=>x!==d):[...t.dates,d]}))}
            rangeStart={calRangeStart}
            onRangeStart={d=>setCalRangeStart(d)}
            onRangeEnd={range=>{ setEditTx(t=>({...t,dates:[...new Set([...t.dates,...range])]})); setCalRangeStart(null); }}
            needleDates={editTx.completedDates||[]}
          />
          {(editTx.completedDates||[]).length>0&&<div style={{fontSize:".7rem",color:"#a08070",marginBottom:10}}>💉 marks a completed past session</div>}
          <div style={{display:"flex",gap:8}}>
            <button className="save-btn" onClick={()=>doSaveUpcoming(false)} disabled={!canSaveFinal} style={{flex:1,opacity:canSaveFinal?1:.4}}>
              {isExisting?"Save Changes":"Schedule"}
            </button>
            {!isExisting&&<button className="ghost-btn" onClick={()=>doSaveUpcoming(true)} disabled={!canSaveFinal} style={{flex:1,opacity:canSaveFinal?1:.4,padding:"10px 0",fontSize:".82rem"}}>+ Add More</button>}
          </div>
        </div>
      </div>
    );
  }

  // Fallback - just close if somehow on list screen
  return null;
}

function FreqModal({ allItems, tracked, period, onToggle, onPeriod, onClose }) {
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-top">
          <div className="modal-title">Frequency Tracking</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-sub">Tracking period</div>
        <div className="period-row">
          {["week","month","year"].map(p=>(
            <button key={p} className={`period-chip ${period===p?"on":""}`} onClick={()=>onPeriod(p)}>
              This {p[0].toUpperCase()+p.slice(1)}
            </button>
          ))}
        </div>
        <hr className="modal-hr"/>
        <div className="modal-sub">Habits to track</div>
        {allItems.map(it=>(
          <div key={it.id} className={`freq-toggle-item ${tracked.includes(it.id)?"on":""}`} onClick={()=>onToggle(it.id)}>
            <div className="fti-check">{tracked.includes(it.id)&&<CheckIcon/>}</div>
            <span style={{fontSize:"1rem"}}>{it.emoji}</span>
            <span style={{fontSize:".86rem",color:"#3a2e27",flex:1}}>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DayEditModal({ date, entry, skinRoutines, hairRoutines, onSave, onClose }) {
  const [skin,setSkin]           = useState(entry.skin||[]);
  const [hair,setHair]           = useState(entry.hair||[]);
  const [skinMood,setSkinMood]   = useState(entry.skin_mood||"");
  const [hairMood,setHairMood]   = useState(entry.hair_mood||"");
  const [skinNotes,setSkinNotes] = useState(entry.skin_notes||"");
  const [hairNotes,setHairNotes] = useState(entry.hair_notes||"");
  const [skinPhotos,setSkinPhotos]=useState(entry.skin_photos||[]);
  const [hairPhotos,setHairPhotos]=useState(entry.hair_photos||[]);
  const [tab,setTab]             = useState("skin");
  const toggle = (type,id) => {
    if(type==="skin") setSkin(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
    else setHair(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  };
  const list=tab==="skin"?skinRoutines:hairRoutines;
  const checked=tab==="skin"?skin:hair;
  const mood=tab==="skin"?skinMood:hairMood;
  const setMood=tab==="skin"?setSkinMood:setHairMood;
  const notes=tab==="skin"?skinNotes:hairNotes;
  const setNotes=tab==="skin"?setSkinNotes:setHairNotes;
  const photos=tab==="skin"?skinPhotos:hairPhotos;
  const setPhotos=tab==="skin"?setSkinPhotos:setHairPhotos;
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-top">
          <div className="modal-title">{dispLong(date)}</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <div className="sub-tabs">
          <button className={`sub-tab ${tab==="skin"?"active":""}`} onClick={()=>setTab("skin")}>🌿 Skin</button>
          <button className={`sub-tab ${tab==="hair"?"active":""}`} onClick={()=>setTab("hair")}>✨ Hair</button>
        </div>
        <div className="routine-grid" style={{marginBottom:16}}>
          {list.map(it=>{ const on=checked.includes(it.id); return (
            <div key={it.id} className={`r-item ${on?"on":""}`} onClick={()=>toggle(tab,it.id)}>
              <span className="r-emoji">{it.emoji}</span>
              <span className="r-label">{it.label}</span>
              <div className="r-check">{on&&<CheckIcon/>}</div>
            </div>
          );})}
        </div>
        <div className="modal-sub">How's your {tab} feeling?</div>
        <div className="mood-row" style={{marginBottom:14}}>
          {MOODS.map(m=><button key={m} className={`mood-chip ${mood===m?"on":""}`} onClick={()=>setMood(p=>p===m?"":m)}>{m}</button>)}
        </div>
        <div className="modal-sub">Notes & Photos</div>
        <PhotoNotes notes={notes} photos={photos} onNotesChange={setNotes} onPhotosChange={v=>setPhotos(typeof v==="function"?v(photos):v)}/>
        <button className="save-btn" onClick={()=>onSave({skin,hair,skin_mood:skinMood,hair_mood:hairMood,skin_notes:skinNotes,hair_notes:hairNotes,skin_photos:skinPhotos,hair_photos:hairPhotos})}>Save Entry</button>
      </div>
    </div>
  );
}

function RangeApplyModal({ rangeStart, rangeEnd, skinRoutines, hairRoutines, onApply, onClose }) {
  const [skin,setSkin]           = useState([]);
  const [hair,setHair]           = useState([]);
  const [skinMood,setSkinMood]   = useState("");
  const [hairMood,setHairMood]   = useState("");
  const [skinNotes,setSkinNotes] = useState("");
  const [hairNotes,setHairNotes] = useState("");
  const [skinPhotos,setSkinPhotos]=useState([]);
  const [hairPhotos,setHairPhotos]=useState([]);
  const [tab,setTab]             = useState("skin");
  const days = dateRange(rangeStart, rangeEnd);
  const toggle = (type,id) => {
    if(type==="skin") setSkin(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
    else setHair(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  };
  const list=tab==="skin"?skinRoutines:hairRoutines;
  const checked=tab==="skin"?skin:hair;
  const mood=tab==="skin"?skinMood:hairMood;
  const setMood=tab==="skin"?setSkinMood:setHairMood;
  const notes=tab==="skin"?skinNotes:hairNotes;
  const setNotes=tab==="skin"?setSkinNotes:setHairNotes;
  const photos=tab==="skin"?skinPhotos:hairPhotos;
  const setPhotos=tab==="skin"?setSkinPhotos:setHairPhotos;
  const sD=parse(rangeStart), eD=parse(rangeEnd);
  const sameMonth=sD.getMonth()===eD.getMonth()&&sD.getFullYear()===eD.getFullYear();
  const label=sameMonth
    ?`${sD.toLocaleDateString("en-US",{month:"long",day:"numeric"})} – ${eD.getDate()}`
    :`${sD.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${eD.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`;
  const hasAny=skin.length||hair.length||skinMood||hairMood||skinNotes||hairNotes||skinPhotos.length||hairPhotos.length;
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-top">
          <div className="modal-title">Log a Date Range</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <div style={{background:"#f0f5f0",borderRadius:10,padding:"9px 14px",marginBottom:16,fontSize:".82rem",color:"#3a5a3a",lineHeight:1.5}}>
          Applying to <strong>{days.length} day{days.length!==1?"s":""}</strong>: {label}
        </div>
        <div className="modal-sub">Steps done across this period</div>
        <div className="sub-tabs">
          <button className={`sub-tab ${tab==="skin"?"active":""}`} onClick={()=>setTab("skin")}>🌿 Skin</button>
          <button className={`sub-tab ${tab==="hair"?"active":""}`} onClick={()=>setTab("hair")}>✨ Hair</button>
        </div>
        <div className="routine-grid" style={{marginBottom:16}}>
          {list.map(it=>{ const on=checked.includes(it.id); return (
            <div key={it.id} className={`r-item ${on?"on":""}`} onClick={()=>toggle(tab,it.id)}>
              <span className="r-emoji">{it.emoji}</span>
              <span className="r-label">{it.label}</span>
              <div className="r-check">{on&&<CheckIcon/>}</div>
            </div>
          );})}
        </div>
        <div className="modal-sub">How's your {tab} feeling?</div>
        <div className="mood-row" style={{marginBottom:14}}>
          {MOODS.map(m=><button key={m} className={`mood-chip ${mood===m?"on":""}`} onClick={()=>setMood(p=>p===m?"":m)}>{m}</button>)}
        </div>
        <div className="modal-sub">Notes & Photos</div>
        <PhotoNotes notes={notes} photos={photos} onNotesChange={setNotes} onPhotosChange={v=>setPhotos(typeof v==="function"?v(photos):v)}/>
        <button className="save-btn" disabled={!hasAny} style={{opacity:hasAny?1:.4}}
          onClick={()=>onApply({skin,hair,skin_mood:skinMood,hair_mood:hairMood,skin_notes:skinNotes,hair_notes:hairNotes,skin_photos:skinPhotos,hair_photos:hairPhotos},days)}>
          Apply to {days.length} Day{days.length!==1?"s":""}
        </button>
      </div>
    </div>
  );
}

function HairLengthCard({ hairLengths, setHairLengths, saveHairLength }) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const isLastDay = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate() === now.getDate();
  const monthLabel = m => { const [y,mo]=m.split("-"); return new Date(y, mo-1, 1).toLocaleDateString("en-US",{month:"long",year:"numeric"}); };
  const history = Object.entries(hairLengths).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,24);
  const [saving, setSaving] = useState(false);

  const doSave = async () => {
    setSaving(true);
    await saveHairLength(monthKey, hairLengths[monthKey]||"");
    setSaving(false);
  };

  return (
    <div className="hair-length-card">
      <div className="hair-length-title">📏 Hair Length Tracker</div>
      <div className="hair-length-sub">Record your measurement on the last day of each month to track your growth</div>
      <div className="hair-length-row">
        <span className="hair-length-month">{monthLabel(monthKey)}</span>
        <input className="hair-length-input" placeholder="e.g. 32 cm"
          value={hairLengths[monthKey]||""}
          onChange={e=>setHairLengths(p=>({...p,[monthKey]:e.target.value}))}
          onKeyDown={e=>e.key==="Enter"&&doSave()}/>
        <button className="hair-length-save" onClick={doSave} disabled={saving}>
          {saving?"…":"Save"}
        </button>
      </div>
      {!isLastDay&&<div style={{fontSize:".72rem",color:"#a08070",marginBottom:10,fontStyle:"italic"}}>
        💡 You can update this anytime — just save it on the last day of the month for accuracy!
      </div>}
      {history.length>0&&(
        <>
          <div style={{fontSize:".74rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginTop:6,marginBottom:8}}>Growth History</div>
          {history.map(([month, val], i)=>{
            const prev = history[i+1]?.[1];
            const curr = parseFloat(val), prevN = parseFloat(prev);
            const unit = val.replace(/[\d.\s]/g,"").trim() || "";
            const growth = (!isNaN(curr)&&!isNaN(prevN)) ? +(curr-prevN).toFixed(1) : null;
            return (
              <div key={month} className="hair-history-row">
                <span className="hair-history-month">{monthLabel(month)}</span>
                <span>
                  <span className="hair-history-val">{val}</span>
                  {growth!==null&&growth>0&&<span className="hair-growth-badge">▲ +{growth}{unit} growth</span>}
                  {growth!==null&&growth<0&&<span className="hair-growth-badge" style={{color:"#c07060"}}>▼ {growth}{unit}</span>}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default function App({ user }) {
  const today = fmt(new Date());
  const [view,        setView]        = useState(() => sessionStorage.getItem('ritual_view') || "log");
  const [activeTab,   setActiveTab]   = useState("skin");
  const [activeDate,  setActiveDate]  = useState(today);
  const [entries,     setEntries]     = useState({});
  const [skinR,       setSkinR]       = useState(DEFAULT_SKIN);
  const [hairR,       setHairR]       = useState(DEFAULT_HAIR);
  const [schedules,   setSchedules]   = useState([]);
  const [freqTracked, setFreqTracked] = useState(["tretinoin","spf","alpyn_serum","rosemary_oil"]);
  const [freqPeriod,  setFreqPeriod]  = useState("year");
  const [modal,       setModal]       = useState(null);
  const [calMonth,    setCalMonth]    = useState({y:new Date().getFullYear(),m:new Date().getMonth()});
  const [selectedDay, setSelectedDay] = useState(today);
  const [toast,       setToast]       = useState("");
  const [dismissed,   setDismissed]   = useState([]);
  const [rangeMode,   setRangeMode]   = useState(false);
  const [rangeStart,  setRangeStart]  = useState(today);
  const [rangeEnd,    setRangeEnd]    = useState(null);
  const [hoverDay,    setHoverDay]    = useState(null);
  const [curPhotos,   setCurPhotos]   = useState([]);
  const [userName,    setUserName]    = useState(user?.user_metadata?.display_name || "");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [hairLengths,   setHairLengths]   = useState({});
  const [purchases,     setPurchases]     = useState([]);
  const [products,      setProducts]      = useState([]);
  const [wishlist,      setWishlist]      = useState([]);
  const [snapshots,     setSnapshots]     = useState([]);
  const [sideMenu,      setSideMenu]      = useState(false);
  const [pageView,      setPageView]      = useState(() => sessionStorage.getItem('ritual_pageView') || null); // null=main, "purchases", "account", "products", "wishlist"
  const [selectedPlan,  setSelectedPlan]  = useState(null); // plan/treatment being viewed
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null); // {message, onConfirm}
  const [prefillPurchase, setPrefillPurchase] = useState(null); // when moving wishlist item to purchases
  const [treatments,      setTreatments]      = useState([]);
  const [plannedPurchases,setPlannedPurchases] = useState([]);

  // Persist current page across refreshes
  useEffect(() => { sessionStorage.setItem('ritual_view', view); }, [view]);
  useEffect(() => {
    if (pageView) sessionStorage.setItem('ritual_pageView', pageView);
    else sessionStorage.removeItem('ritual_pageView');
  }, [pageView]);

  // Load all data from Supabase on mount — two phases so the log/plans UI appears fast
  useEffect(()=>{
    if(!user) return;
    (async()=>{
      try {
        // ── Phase 1: Critical data (log, plans, schedules) ──────────────────
        const [
          { data: entryRows },
          { data: routineRows },
          { data: schedRows, error: schedErr },
          { data: freqRows },
          { data: hlRows },
          { data: txRows },
        ] = await Promise.all([
          supabase.from("entries").select("*").eq("user_id", user.id),
          supabase.from("routines").select("*").eq("user_id", user.id),
          supabase.from("schedules").select("*").eq("user_id", user.id),
          supabase.from("freq_settings").select("*").eq("user_id", user.id).single(),
          supabase.from("hair_lengths").select("*").eq("user_id", user.id),
          supabase.from("treatments").select("*").eq("user_id", user.id),
        ]);

        if (entryRows) {
          const map = {};
          entryRows.forEach(r => { map[r.date] = {
            skin: r.skin||[], hair: r.hair||[],
            skin_mood: r.skin_mood||"", hair_mood: r.hair_mood||"",
            skin_notes: r.skin_notes||"", hair_notes: r.hair_notes||"",
            skin_photos: r.skin_photos||[], hair_photos: r.hair_photos||[]
          }; });
          setEntries(map);
        }
        if (routineRows) {
          const sk = routineRows.find(r=>r.type==="skin");
          const ha = routineRows.find(r=>r.type==="hair");
          if (sk) setSkinR(sk.items);
          if (ha) setHairR(ha.items);
        }
        if (schedErr) console.error("Schedule load error:", schedErr);
        if (schedRows) setSchedules(schedRows.map(r=>({ id:r.id, itemId:r.item_id, days:r.days||[], dates:r.dates||[], startDate:r.start_date||null, reminder:r.reminder, time:r.time, location:r.location||'' })));
        if (freqRows) { setFreqTracked(freqRows.tracked||[]); setFreqPeriod(freqRows.period||"year"); }
        if (hlRows) {
          const map = {};
          hlRows.forEach(r => { map[r.month] = r.length_cm; });
          setHairLengths(map);
        }
        if (txRows) setTreatments(txRows.map(r=>({ id:r.id, name:r.name, type:r.type, dates:r.dates||[], completedDates:r.completed_dates||[], location:r.location||'', price:r.price||'', notes:r.notes||'' })));

        // Show name prompt after phase 1
        const name = user?.user_metadata?.display_name || "";
        if (name) setUserName(name);
        else setShowNamePrompt(true);

        // ── Phase 2: Secondary data (products, purchases, wishlist, snapshots) ─
        Promise.all([
          supabase.from("purchases").select("*").eq("user_id", user.id).order("date", {ascending:false}),
          supabase.from("products").select("*").eq("user_id", user.id).order("created_at", {ascending:false}),
          supabase.from("wishlist").select("*").eq("user_id", user.id).order("created_at", {ascending:false}),
          supabase.from("snapshots").select("*, snapshot_products(*)").eq("user_id", user.id).order("started_at", {ascending:false}),
          supabase.from("planned_purchases").select("*").eq("user_id", user.id).order("created_at", {ascending:false}),
        ]).then(([{ data: purchRows },{ data: prodRows },{ data: wishRows },{ data: snapRows },{ data: ppRows }]) => {
          if (purchRows) setPurchases(purchRows.map(r=>({ id:r.id, name:r.name, brand:r.brand||"", category:r.category, price:r.price||0, quantity:r.quantity||1, date:r.date, notes:r.notes||"", tags:r.tags||[], image:r.image||'', link:r.link||'', frequency:r.frequency||'', product_id:r.product_id||null, treatment_type:r.treatment_type||'' })));
          if (ppRows) setPlannedPurchases(ppRows.map(r=>({ id:r.id, name:r.name, brand:r.brand||"", category:r.category||"skin", image:r.image||"", link:r.link||"", price:r.price||"", notes:r.notes||"", product_id:r.product_id||null, wishlist_id:r.wishlist_id||null })));
          if (prodRows) setProducts(prodRows.map(r=>({ id:r.id, name:r.name, brand:r.brand||"", category:r.category||"skin", image:r.image||"", link:r.link||"", price:r.price||"", notes:r.notes||"", tags:r.tags||[], frequency:r.frequency||"", global_product_id:r.global_product_id||null, ingredients:r.ingredients||[], is_staple:r.is_staple||false, sort_order:r.sort_order||0 })));
          if (wishRows) setWishlist(wishRows.map(r=>({ id:r.id, product_id:r.product_id||null, name:r.name||"", brand:r.brand||"", category:r.category||"skin", image:r.image||"", link:r.link||"", notes:r.notes||"", tags:r.tags||[], priority:r.priority||0 })));
          if (snapRows) setSnapshots(snapRows.map(r=>({ id:r.id, label:r.label||"", started_at:r.started_at, ended_at:r.ended_at||null, is_base:r.is_base||false, products:r.snapshot_products||[] })));
        }).catch(e=>console.error("Phase 2 load error", e));

      } catch(e) { console.error("Load error", e); }
    })();
  },[user]);

  useEffect(()=>{ const k=activeTab==="skin"?"skin_photos":"hair_photos"; setCurPhotos(entries[activeDate]?.[k]||[]); },[activeDate,activeTab]);

  const getE = d => entries[d]||{skin:[],hair:[],skin_mood:"",hair_mood:"",skin_notes:"",hair_notes:"",skin_photos:[],hair_photos:[]};
  const allItems   = [...skinR,...hairR];
  const allSkinMap = Object.fromEntries([...DEFAULT_SKIN,...skinR].map(r=>[r.id,r]));
  const allHairMap = Object.fromEntries([...DEFAULT_HAIR,...hairR].map(r=>[r.id,r]));
  const shiftD = (d,n)=>{ const dt=parse(d); dt.setDate(dt.getDate()+n); return fmt(dt); };
  const showT  = msg=>{ setToast(msg); setTimeout(()=>setToast(""),2200); };

  const persist = async(overrides={})=>{
    if (!user) return;
    const uid = user.id;
    try {
      // Save entries if changed
      if (overrides.entries !== undefined || overrides === {}) {
        const entriesToSave = overrides.entries ?? entries;
        const rows = Object.entries(entriesToSave).map(([date, e]) => ({
          user_id: uid, date, skin: e.skin||[], hair: e.hair||[],
          mood: e.mood||"", notes: e.notes||"", photos: e.photos||[], updated_at: new Date().toISOString()
        }));
        if (rows.length > 0) {
          await supabase.from("entries").upsert(rows, { onConflict: "user_id,date" });
        }
      }
      // Save routines
      const skinToSave = overrides.skinR ?? skinR;
      const hairToSave = overrides.hairR ?? hairR;
      await supabase.from("routines").upsert([
        { user_id: uid, type: "skin", items: skinToSave, updated_at: new Date().toISOString() },
        { user_id: uid, type: "hair", items: hairToSave, updated_at: new Date().toISOString() }
      ], { onConflict: "user_id,type" });
      // Save freq settings
      await supabase.from("freq_settings").upsert({
        user_id: uid,
        tracked: overrides.freqTracked ?? freqTracked,
        period: overrides.freqPeriod ?? freqPeriod,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    } catch(e) { console.error("Persist error", e); }
  };

  // Save a single entry to Supabase immediately
  const persistEntry = async (date, entryData) => {
    if (!user) return;
    try {
      await supabase.from("entries").upsert({
        user_id: user.id, date,
        skin: entryData.skin||[], hair: entryData.hair||[],
        skin_mood: entryData.skin_mood||"", hair_mood: entryData.hair_mood||"",
        skin_notes: entryData.skin_notes||"", hair_notes: entryData.hair_notes||"",
        skin_photos: entryData.skin_photos||[], hair_photos: entryData.hair_photos||[],
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,date" });
    } catch(e) { console.error("Entry save error", e); }
  };

  // Save a hair length measurement
  const saveHairLength = async (month, lengthVal) => {
    const updated = { ...hairLengths, [month]: lengthVal };
    setHairLengths(updated);
    if (!user) return;
    try {
      await supabase.from("hair_lengths").upsert(
        { user_id: user.id, month, length_cm: lengthVal, updated_at: new Date().toISOString() },
        { onConflict: "user_id,month" }
      );
    } catch(e) { console.error("Hair length save error", e); }
  };

  // Save a treatment to Supabase
  const persistTreatment = async (tx) => {
    if (!user) return;
    try {
      await supabase.from("treatments").upsert({
        id: tx.id, user_id: user.id, name: tx.name, type: tx.type,
        dates: tx.dates, completed_dates: tx.completedDates, location: tx.location||'',
        price: tx.price||null, notes: tx.notes||'', updated_at: new Date().toISOString()
      }, { onConflict: "id" });
    } catch(e) { console.error("Treatment save error", e); }
  };
  const deleteTreatmentFromDB = async (id) => {
    if (!user) return;
    try { await supabase.from("treatments").delete().eq("id", id).eq("user_id", user.id); } catch(e) {}
  };

  // Save schedules to Supabase
  const persistSchedules = async (newSchedules) => {
    if (!user) return;
    try {
      if (newSchedules.length > 0) {
        // Upsert each schedule individually - safer than delete+insert
        const rows = newSchedules.map(s => ({
          id: s.id, user_id: user.id, item_id: s.itemId,
          days: s.days||[], dates: s.dates||[], start_date: s.startDate||null,
          reminder: s.reminder, time: s.time||"08:00", location: s.location||''
        }));
        const { error: upsertErr } = await supabase.from("schedules").upsert(rows, { onConflict: "id" });
        if (upsertErr) { console.error("Schedule upsert error:", upsertErr); return; }
        // Only delete ones that are no longer in the list
        const ids = newSchedules.map(s=>s.id);
        await supabase.from("schedules").delete().eq("user_id", user.id).not("id", "in", `(${ids.join(",")})`);
      } else {
        await supabase.from("schedules").delete().eq("user_id", user.id);
      }
    } catch(e) { console.error("Schedule save error:", e); }
  };

  const toggleItem=(date,type,id)=>{
    const e=getE(date); const cur=e[type]||[];
    const updated={...e,[type]:cur.includes(id)?cur.filter(x=>x!==id):[...cur,id]};
    setEntries(p=>({...p,[date]:updated}));
    persistEntry(date, updated);
  };
  const setNotesVal=(date,tab,v)=>setEntries(p=>({...p,[date]:{...getE(date),[tab==="skin"?"skin_notes":"hair_notes"]:v}}));
  const setMoodVal=(date,tab,v)=>{ const e=getE(date); const k=tab==="skin"?"skin_mood":"hair_mood"; setEntries(p=>({...p,[date]:{...e,[k]:e[k]===v?"":v}})); };
  const setPhotosVal=(date,tab,v)=>{
    const k=tab==="skin"?"skin_photos":"hair_photos";
    const photos=typeof v==="function"?v(getE(date)[k]||[]):v;
    setEntries(p=>({...p,[date]:{...getE(date),[k]:photos}}));
    setCurPhotos(photos);
  };

  const saveEntry=async()=>{
    const e = getE(activeDate);
    await persistEntry(activeDate, e);
    showT("✓ Entry saved");
  };
  const persistRoutines = async (newSkin, newHair) => {
    if (!user) return;
    try {
      await supabase.from("routines").upsert([
        { user_id: user.id, type: "skin", items: newSkin, updated_at: new Date().toISOString() },
        { user_id: user.id, type: "hair", items: newHair, updated_at: new Date().toISOString() }
      ], { onConflict: "user_id,type" });
    } catch(e) { console.error("Routine save error", e); }
  };
  const addItem=async(type,item)=>{
    const newSkin = type==="skin" ? [...skinR, item] : skinR;
    const newHair = type==="hair" ? [...hairR, item] : hairR;
    if(type==="skin") setSkinR(newSkin); else setHairR(newHair);
    await persistRoutines(newSkin, newHair);
  };
  const removeItem=async(type,id)=>{
    const newSkin = type==="skin" ? skinR.filter(r=>r.id!==id) : skinR;
    const newHair = type==="hair" ? hairR.filter(r=>r.id!==id) : hairR;
    if(type==="skin") setSkinR(newSkin); else setHairR(newHair);
    setEntries(p=>{ const u={...p}; for(const d in u){ if(u[d][type]) u[d]={...u[d],[type]:u[d][type].filter(x=>x!==id)} } return u; });
    await persistRoutines(newSkin, newHair);
  };
  const editItem=async(type,id,changes)=>{
    const newSkin = type==="skin" ? skinR.map(r=>r.id===id?{...r,...changes}:r) : skinR;
    const newHair = type==="hair" ? hairR.map(r=>r.id===id?{...r,...changes}:r) : hairR;
    if(type==="skin") setSkinR(newSkin); else setHairR(newHair);
    await persistRoutines(newSkin, newHair);
  };
  const savePurchase = async (p) => {
    if (!user) return;
    try {
      await supabase.from("purchases").upsert({
        id: p.id, user_id: user.id, name: p.name, brand: p.brand||"",
        category: p.category, price: parseFloat(p.price)||0,
        quantity: parseInt(p.quantity)||1, date: p.date, notes: p.notes||"",
        tags: p.tags||[], image: p.image||'', link: p.link||'', frequency: p.frequency||'',
        product_id: p.product_id||null, treatment_type: p.treatment_type||null,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });
      setPurchases(prev => { const f=prev.filter(x=>x.id!==p.id); return [p,...f].sort((a,b)=>b.date.localeCompare(a.date)); });
      showT("✓ Purchase saved");
    } catch(e) { console.error("Purchase save error", e); }
  };
  const deletePurchase = async (id) => {
    if (!user) return;
    try {
      await supabase.from("purchases").delete().eq("id", id).eq("user_id", user.id);
      setPurchases(prev=>prev.filter(p=>p.id!==id));
      showT("Purchase removed");
    } catch(e) { console.error(e); }
  };
  const confirmDeletePurchase=(id)=>setConfirmDelete({message:"This purchase will be permanently deleted.",onConfirm:()=>deletePurchase(id)});

  // ── Products CRUD ──
  const saveProduct = async (p) => {
    if (!user) return;
    // userImage is a UI-only field (data URL from file picker) — strip from DB row
    const { userImage, ...prod } = p;
    const row = { id:prod.id, user_id:user.id, name:prod.name, brand:prod.brand||"", category:prod.category||"skin", image:prod.image||"", link:prod.link||"", price:prod.price||null, notes:prod.notes||"", tags:prod.tags||[], frequency:prod.frequency||"", global_product_id:prod.global_product_id||null, ingredients:prod.ingredients||[], is_staple:prod.is_staple||false, sort_order:prod.sort_order||0 };
    await supabase.from("products").upsert(row, {onConflict:"id"});
    setProducts(prev => { const idx=prev.findIndex(x=>x.id===prod.id); return idx>=0?prev.map(x=>x.id===prod.id?prod:x):[prod,...prev]; });
    // Background lookups — fire and forget
    if (!prod.ingredients?.length && prod.name) fetchIngredients(prod);
    if (prod.link || (!prod.image && prod.name) || userImage) fetchProductImage({...prod, userImage});
  };

  const fetchProductImage = async (p) => {
    try {
      let imageUrl = null;
      if (p.link || p.name) {
        const res = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ link: p.link||"", name: p.name, brand: p.brand||"" })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) imageUrl = data.imageUrl;
        }
      }
      // Fall back to user-attached photo if link-based fetch found nothing
      if (!imageUrl && p.userImage) imageUrl = p.userImage;
      if (imageUrl) {
        await supabase.from("products").update({ image: imageUrl }).eq("id", p.id).eq("user_id", user.id);
        setProducts(prev => prev.map(x => x.id===p.id ? {...x, image: imageUrl} : x));
      }
    } catch(e) { console.error("Image fetch error:", e); }
  };

  const fetchIngredients = async (p) => {
    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name:p.name, brand:p.brand||"", category:p.category||"skin", globalProductId:p.global_product_id||null })
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.ingredients?.length > 0) {
        const updates = { ingredients: data.ingredients, global_product_id: data.globalProductId };
        await supabase.from("products").update(updates).eq("id", p.id).eq("user_id", user.id);
        setProducts(prev => prev.map(x => x.id===p.id ? {...x, ...updates} : x));
        return data; // return so RoutineAnalysis can use it immediately
      }
      return null;
    } catch(e) { console.error("Ingredient fetch error:", e); return null; }
  };
  const saveProductOrder = async (orderedItems) => {
    // orderedItems: [{id, sort_order}]
    await Promise.all(orderedItems.map(({id, sort_order}) =>
      supabase.from("products").update({sort_order}).eq("id",id).eq("user_id",user.id)
    ));
    setProducts(prev => prev.map(p => {
      const found = orderedItems.find(o=>o.id===p.id);
      return found ? {...p, sort_order: found.sort_order} : p;
    }));
  };
  const deleteProduct = async (id) => {
    await supabase.from("products").delete().eq("id",id).eq("user_id",user.id);
    setProducts(prev=>prev.filter(p=>p.id!==id));
    showT("Product removed");
  };
  const confirmDeleteProduct = (id) => {
    const inHistory = snapshots.some(s => s.products?.some(sp => sp.product_id === id));
    setConfirmDelete({
      message: inHistory
        ? "This product is part of your routine history. Deleting it from your library will remove its details from past snapshots — your log entries will still be preserved, but product info won't be visible. Are you sure?"
        : "Remove this product from your library?",
      onConfirm: () => deleteProduct(id)
    });
  };

  // ── Wishlist CRUD ──
  const saveWishlistItem = async (item) => {
    if (!user) return;
    const row = { id:item.id, user_id:user.id, name:item.name, brand:item.brand||"", category:item.category||"skin", image:item.image||"", link:item.link||"", notes:item.notes||"", tags:item.tags||[], priority:item.priority||0 };
    await supabase.from("wishlist").upsert(row, {onConflict:"id"});
    setWishlist(prev => { const idx=prev.findIndex(x=>x.id===item.id); return idx>=0?prev.map(x=>x.id===item.id?item:x):[item,...prev]; });
    showT("Saved to wishlist");
  };
  const deleteWishlistItem = async (id) => {
    await supabase.from("wishlist").delete().eq("id",id).eq("user_id",user.id);
    setWishlist(prev=>prev.filter(w=>w.id!==id));
    showT("Removed from wishlist");
  };
  const confirmDeleteWishlistItem = (id) => setConfirmDelete({message:"Remove this item from your wishlist?", onConfirm:()=>deleteWishlistItem(id)});

  // ── Planned Purchases CRUD ──
  const savePlannedPurchase = async (item) => {
    if (!user) return;
    const row = { id:item.id, user_id:user.id, name:item.name, brand:item.brand||"", category:item.category||"skin", image:item.image||"", link:item.link||"", price:item.price||null, notes:item.notes||"", product_id:item.product_id||null, wishlist_id:item.wishlist_id||null };
    await supabase.from("planned_purchases").upsert(row, {onConflict:"id"});
    setPlannedPurchases(prev=>{ const idx=prev.findIndex(x=>x.id===item.id); return idx>=0?prev.map(x=>x.id===item.id?item:x):[item,...prev]; });
    showT("Saved to planned purchases");
  };
  const deletePlannedPurchase = async (id) => {
    await supabase.from("planned_purchases").delete().eq("id",id).eq("user_id",user.id);
    setPlannedPurchases(prev=>prev.filter(p=>p.id!==id));
  };
  const movePlannedToPurchase = async (item, date) => {
    const purchase = { id:uid(), name:item.name, brand:item.brand||"", category:item.category||"skin", price:String(item.price||""), quantity:"1", date, notes:item.notes||"", tags:[], image:item.image||"", link:item.link||"", frequency:"", product_id:item.product_id||null, treatment_type:"" };
    await savePurchase(purchase);
    await deletePlannedPurchase(item.id);
  };

  const moveWishlistToPurchase = async (item) => {
    // Create a purchase from wishlist item
    const newPurchase = { id:crypto.randomUUID(), name:item.name, brand:item.brand||"", category:item.category||"skin", price:"", quantity:"1", date:fmt(new Date()), notes:item.notes||"", tags:item.tags||[], image:item.image||"", link:item.link||"" };
    await deleteWishlistItem(item.id);
    return newPurchase; // caller opens purchase form pre-filled
  };

  // ── Snapshots ──
  const openNewSnapshot = async (isBase=false) => {
    // Close current open snapshot
    const current = snapshots.find(s=>!s.ended_at);
    if (current) {
      const updated = {...current, ended_at: fmt(new Date())};
      await supabase.from("snapshots").update({ended_at:updated.ended_at}).eq("id",current.id);
      setSnapshots(prev=>prev.map(s=>s.id===current.id?updated:s));
    }
    // Open new snapshot
    const newSnap = { id:crypto.randomUUID(), label:"", started_at:fmt(new Date()), ended_at:null, is_base:isBase, products:[] };
    await supabase.from("snapshots").insert({id:newSnap.id, user_id:user.id, started_at:newSnap.started_at, label:newSnap.label, is_base:isBase});
    setSnapshots(prev=>[newSnap,...prev]);
    return newSnap.id;
  };

  const finalizeBase = async (baseId) => {
    await supabase.from("snapshots").update({is_base:false}).eq("id",baseId);
    setSnapshots(prev=>prev.map(s=>s.id===baseId?{...s,is_base:false}:s));
    showT("Routine finalized ✓");
  };

  const deleteSnapshot = async (snapId) => {
    if (!user) return;
    await supabase.from("snapshot_products").delete().eq("snapshot_id", snapId);
    await supabase.from("snapshots").delete().eq("id", snapId).eq("user_id", user.id);
    setSnapshots(prev=>prev.filter(s=>s.id!==snapId));
    showT("Snapshot deleted");
  };
  const addProductToSnapshot = async (snapId, productId, meta={}) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const row = {id, snapshot_id:snapId, product_id:productId,
      name_snapshot:meta.name_snapshot||null,
      brand_snapshot:meta.brand_snapshot||null,
      frequency:meta.frequency||null};
    const { error } = await supabase.from("snapshot_products").insert(row);
    if (error) { console.error("Failed to add product to snapshot:", error); return; }
    setSnapshots(prev=>prev.map(s=>s.id===snapId?{...s,products:[...s.products,row]}:s));
  };
  // Update a single snapshot_products row (frequency, name/brand snapshot)
  const updateSnapProduct = async (snapProdId, updates) => {
    await supabase.from("snapshot_products").update(updates).eq("id",snapProdId);
    setSnapshots(prev=>prev.map(s=>({...s,products:s.products.map(sp=>sp.id===snapProdId?{...sp,...updates}:sp)})));
  };
  const updateSnapProductTimeOfDay = async (snapProdId, time_of_day) => {
    await supabase.from("snapshot_products").update({time_of_day}).eq("id",snapProdId);
    setSnapshots(prev=>prev.map(s=>({...s,products:s.products.map(sp=>sp.id===snapProdId?{...sp,time_of_day}:sp)})));
  };
  // Typo fix — propagate corrected name/brand across ALL snapshots for this product
  const updateSnapProductName = async (productId, name, brand) => {
    await supabase.from("snapshot_products").update({name_snapshot:name,brand_snapshot:brand}).eq("product_id",productId);
    setSnapshots(prev=>prev.map(s=>({...s,products:s.products.map(sp=>sp.product_id===productId?{...sp,name_snapshot:name,brand_snapshot:brand}:sp)})));
  };
  const removeProductFromSnapshot = async (snapId, snapProdId) => {
    await supabase.from("snapshot_products").delete().eq("id",snapProdId);
    setSnapshots(prev=>prev.map(s=>s.id===snapId?{...s,products:s.products.filter(p=>p.id!==snapProdId)}:s));
  };

  const saveTreatment = async (tx) => {
    const updated = [...treatments.filter(t=>t.id!==tx.id), tx];
    setTreatments(updated);
    await persistTreatment(tx);
    showT("✓ Treatment saved");
  };
  const deleteTreatment = async (id) => {
    setTreatments(p=>p.filter(t=>t.id!==id));
    await deleteTreatmentFromDB(id);
    showT("Treatment removed");
  };
  const confirmDeleteTreatment=(id)=>setConfirmDelete({message:"This treatment will be permanently deleted.",onConfirm:()=>deleteTreatment(id)});
  const completeTreatment = async (txId, date) => {
    const tx = treatments.find(t=>t.id===txId); if(!tx) return;
    const already = (tx.completedDates||[]).includes(date);
    const updated = {...tx, completedDates: already ? tx.completedDates.filter(d=>d!==date) : [...tx.completedDates, date]};
    setTreatments(p=>p.map(t=>t.id===txId?updated:t));
    await persistTreatment(updated);
  };

  const saveSched=async(s)=>{
    const newS = [...schedules.filter(x=>x.id!==s.id), s];
    setSchedules(newS);
    await persistSchedules(newS);
    showT("✓ Plan saved");
  };
  const saveSchedMany=async(plans)=>{
    // Add all new plans at once, avoiding state overwrite on each iteration
    const newS = [...schedules];
    plans.forEach(s=>{ const idx=newS.findIndex(x=>x.id===s.id); if(idx>=0) newS[idx]=s; else newS.push(s); });
    setSchedules(newS);
    await persistSchedules(newS);
    showT(`✓ ${plans.length} plan${plans.length!==1?"s":""} saved`);
  };
  const deleteSched=async(id)=>{
    const newS = schedules.filter(s=>s.id!==id);
    setSchedules(newS);
    await persistSchedules(newS);
    showT("Plan removed");
  };
  const confirmDeleteSched=(id)=>setConfirmDelete({message:"This plan will be permanently deleted.",onConfirm:()=>deleteSched(id)});
  const saveDayEdit=async(date,data)=>{
    const ne={...entries,[date]:data};
    setEntries(ne);
    await persistEntry(date, data);
    setModal(null); showT("✓ Entry saved");
  };
  const applyRange=async(data,days)=>{
    const ne={...entries}; days.forEach(d=>{ ne[d]={...data}; });
    setEntries(ne);
    // Save each day to Supabase
    await Promise.all(days.map(d => persistEntry(d, data)));
    setModal(null); setRangeStart(null); setRangeEnd(null); setRangeMode(false);
    showT(`✓ Applied to ${days.length} days`);
  };

  const calDays=()=>{
    const {y,m}=calMonth;
    // Week starts Monday: Sun=0 becomes offset 6, Mon=1 becomes offset 0
    const rawFirst=new Date(y,m,1).getDay();
    const first=(rawFirst===0)?6:rawFirst-1;
    const days=daysInMonth(y,m);
    const cells=[];
    for(let i=0;i<first;i++) cells.push(null);
    for(let d=1;d<=days;d++) cells.push(fmt(new Date(y,m,d)));
    return cells;
  };
  const hasEntry=d=>{ if(!d) return false; const e=entries[d]; return e&&(e.skin?.length||e.hair?.length||e.skin_notes||e.hair_notes||e.skin_mood||e.hair_mood||e.skin_photos?.length||e.hair_photos?.length); };
  const getSchedDow=d=>schedules.some(s=>s.days.includes(parse(d).getDay()));

  // Achievement checks for calendar badges
  const getDayAchievement=d=>{
    if(!d||d>today) return null;
    const e=entries[d];
    const dow=parse(d).getDay();
    // Check recurring plans
    const recurPlanned=schedules.filter(s=>s.days.includes(dow)&&(!s.startDate||d>=s.startDate)).map(s=>s.itemId);
    // Check one-off/range plans for this specific date
    const oneOffPlanned=schedules.filter(s=>s.dates&&s.dates.includes(d)).map(s=>s.itemId);
    const plannedIds=[...new Set([...recurPlanned,...oneOffPlanned])];
    const hasTreatment=treatments.some(t=>t.dates.includes(d)&&t.completedDates.includes(d));
    let heart=null;
    if(plannedIds.length>0){
      const logged={skin:(e?.skin||[]),hair:(e?.hair||[])};
      const allChecked=plannedIds.every(id=>logged.skin.includes(id)||logged.hair.includes(id));
      if(allChecked){
        const isGlowing=e?.skin_mood==="✨ Glowing"&&e?.hair_mood==="✨ Glowing";
        heart=isGlowing?"heart-star":"heart";
      }
    }
    return {heart, hasTreatment};
  };

  const effEnd=rangeEnd||(rangeStart&&hoverDay?hoverDay:null);
  const inRange=d=>{ if(!rangeStart||!effEnd||!d) return false; const [lo,hi]=rangeStart<=effEnd?[rangeStart,effEnd]:[effEnd,rangeStart]; return d>lo&&d<hi; };
  const isRangeStart=d=>d===rangeStart&&rangeEnd;
  const isRangeEnd=d=>rangeEnd?d===rangeEnd:(rangeStart&&hoverDay&&d===hoverDay&&hoverDay!==rangeStart);

  const handleCalClick=d=>{
    if(rangeStart&&rangeEnd){
      // Completed range — reset, select new day as single
      setRangeStart(d); setRangeEnd(null); setSelectedDay(d); setRangeMode(false);
    } else if(rangeMode){
      // We're in range mode — this tap is the end date
      if(d===rangeStart){
        // Tapped same date again — cancel range mode, stay on that day
        setRangeMode(false);
      } else {
        const [lo,hi]=d>=rangeStart?[rangeStart,d]:[d,rangeStart];
        setRangeStart(lo); setRangeEnd(hi); setSelectedDay(lo);
        setRangeMode(false); setModal("rangeApply");
      }
    } else if(d===selectedDay){
      // Tapped already-selected day — enter range mode
      setRangeMode(true); setRangeStart(d);
    } else {
      // First tap on a new day — just select it
      setSelectedDay(d); setRangeStart(d); setRangeEnd(null); setRangeMode(false);
    }
  };

  const freqRange=useCallback(()=>{
    const now=new Date();
    if(freqPeriod==="week"){ const d=new Date(now); d.setDate(now.getDate()-now.getDay()); return {start:fmt(d),label:"this week"}; }
    if(freqPeriod==="month"){ return {start:fmt(new Date(now.getFullYear(),now.getMonth(),1)),label:"this month"}; }
    return {start:fmt(new Date(now.getFullYear(),0,1)),label:"this year"};
  },[freqPeriod]);

  const spendStats = useCallback((period) => {
    const now = new Date();
    let start;
    if(period==="week"){ start=new Date(now); start.setDate(now.getDate()-now.getDay()); }
    else if(period==="month"){ start=new Date(now.getFullYear(),now.getMonth(),1); }
    else { start=new Date(now.getFullYear(),0,1); }
    const startStr=fmt(start);
    const filtered=purchases.filter(p=>p.date>=startStr);
    const total=filtered.reduce((s,p)=>s+p.price*p.quantity,0);
    const skin=filtered.filter(p=>p.category==="skin").reduce((s,p)=>s+p.price*p.quantity,0);
    const hair=filtered.filter(p=>p.category==="hair").reduce((s,p)=>s+p.price*p.quantity,0);
    return { total, skin, hair, count: filtered.length };
  }, [purchases]);

  const freqStats=useCallback(itemId=>{
    const {start}=freqRange();
    const startD=parse(start),todayD=parse(today);
    const possible=Math.max(1,Math.round((todayD-startD)/86400000)+1);
    const count=Object.keys(entries).filter(d=>d>=start&&d<=today).filter(d=>{
      const e=entries[d]; return (e.skin||[]).includes(itemId)||(e.hair||[]).includes(itemId);
    }).length;
    return {count,possible};
  },[entries,freqRange,today]);

  const todayDow=new Date().getDay();
  const activeDateDow=parse(activeDate).getDay();
  const visibleReminders=schedules.filter(s=>!dismissed.includes(s.id)&&(!s.startDate||activeDate>=s.startDate)&&((s.days&&s.days.includes(activeDateDow))||(s.dates&&s.dates.includes(activeDate))));
  const entry=getE(activeDate);
  const routines=activeTab==="skin"?skinR:hairR;
  const checked=activeTab==="skin"?entry.skin:entry.hair;
  const done=checked.filter(id=>routines.find(r=>r.id===id)).length;

  const goHome = () => { setView("log"); setActiveDate(today); setPageView(null); };

  const sideMenuEl = (
    <>
      {sideMenu&&<div className="side-menu-overlay" onClick={()=>setSideMenu(false)}/>}
      <div className={`side-menu ${sideMenu?"open":""}`}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div className="side-menu-title" style={{marginBottom:0}}>Menu</div>
          <button onClick={()=>setSideMenu(false)} style={{background:"none",border:"none",fontSize:"1.4rem",cursor:"pointer",color:"#a08070",lineHeight:1,padding:"2px 6px"}}>×</button>
        </div>
        <button className="side-menu-item" onClick={()=>{setPageView("account");setSideMenu(false);}}><span>👤</span> My Account</button>
        <hr style={{border:"none",borderTop:"1px solid #f0e0d4",margin:"8px 0"}}/>
        <button className="side-menu-item" onClick={()=>{setPageView("products");setSideMenu(false);}}><span>💄</span> My Products</button>
        <button className="side-menu-item" onClick={()=>{setPageView("wishlist");setSideMenu(false);}}><span>💝</span> Wishlist</button>
        <button className="side-menu-item" onClick={()=>{setPageView("purchases");setSideMenu(false);}}><span>💳</span> Purchases</button>
        <hr style={{border:"none",borderTop:"1px solid #f0e0d4",margin:"16px 0"}}/>
        <button className="side-menu-item" style={{color:"#c0a898"}} onClick={()=>supabase.auth.signOut()}><span>🚪</span> Sign Out</button>
      </div>
    </>
  );

  if (pageView==="purchases") return (
    <div><style>{STYLES}</style><PurchasesPage purchases={purchases} products={products} wishlist={wishlist} prefill={prefillPurchase} onClearPrefill={()=>setPrefillPurchase(null)} onSave={savePurchase} onDelete={confirmDeletePurchase} onBack={()=>setPageView(null)} onHome={goHome} onMenuOpen={()=>setSideMenu(true)}/>{sideMenuEl}</div>
  );
  if (pageView==="products") return (
    <div><style>{STYLES}</style><MyProductsPage
      products={products}
      snapshots={snapshots}
      entries={entries}
      onSaveProduct={saveProduct}
      onDeleteProduct={confirmDeleteProduct}
      onOpenSnapshot={openNewSnapshot}
      onAddToSnapshot={addProductToSnapshot}
      onUpdateSnapProduct={updateSnapProduct}
      onUpdateSnapProductName={updateSnapProductName}
      onRemoveFromSnapshot={removeProductFromSnapshot}
      onFinalizeBase={finalizeBase}
      onDeleteSnapshot={deleteSnapshot}
      onFetchIngredients={fetchIngredients}
      onSaveProductOrder={saveProductOrder}
      onUpdateSnapProductTimeOfDay={updateSnapProductTimeOfDay}
      onBack={()=>setPageView(null)}
      onHome={goHome}
      onMenuOpen={()=>setSideMenu(true)}/>{sideMenuEl}</div>
  );
  if (pageView==="wishlist") return (
    <div><style>{STYLES}</style><WishlistPage
      wishlist={wishlist}
      products={products}
      plannedPurchases={plannedPurchases}
      onSave={saveWishlistItem}
      onDelete={confirmDeleteWishlistItem}
      onSavePlanned={savePlannedPurchase}
      onDeletePlanned={deletePlannedPurchase}
      onMovePlannedToPurchase={movePlannedToPurchase}
      onMoveToCart={async(item)=>{ const prefill=await moveWishlistToPurchase(item); setPrefillPurchase(prefill); setPageView("purchases"); }}
      onBack={()=>setPageView(null)}
      onHome={goHome}
      onMenuOpen={()=>setSideMenu(true)}/>{sideMenuEl}</div>
  );
  if (pageView==="account") return (
    <div className="app">
      <style>{STYLES}</style>
      <div className="header" style={{position:"relative"}}>
        <button onClick={()=>{setView("log");setActiveDate(today);setPageView(null);}} style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#b07a5e",padding:"8px",lineHeight:1}}><HomeIcon/></button>
        <div className="header-title">My <span>Account</span></div>
        <HamburgerBtn onClick={()=>setSideMenu(true)}/>
      </div>
      <div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>Coming soon</div>
      {sideMenuEl}
    </div>
  );

  return (
    <div>
      <style>{STYLES}</style>
      <div className="app">
        <div className="header" style={{position:"relative"}}>
          <button onClick={()=>{setView("log");setActiveDate(today);setPageView(null);}} style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#b07a5e",padding:"8px",lineHeight:1}}><HomeIcon/></button>
          <div className="header-title">{userName ? userName+"'s" : "My"} <span>Ritual</span></div>
          <div className="header-sub">Your Beauty HQ</div>
          <HamburgerBtn onClick={()=>setSideMenu(true)}/>
        </div>

        <div className="top-tabs">
          {[["log","Log"],["history","History"],["plan","Plan"],["frequency","Stats"]].map(([v,l])=>(
            <button key={v} className={`top-tab ${view===v?"active":""}`} onClick={()=>setView(v)}>{l}</button>
          ))}
        </div>

        {view==="log"&&(
          <>
            <div className="date-nav">
              <button className="dnb" onClick={()=>setActiveDate(shiftD(activeDate,-1))}>‹</button>
              <div style={{textAlign:"center"}}>
                <div className={`date-label ${activeDate===today?"is-today":""}`}>{activeDate===today?"Today":dispLong(activeDate)}</div>
                {activeDate===today&&<div style={{fontSize:".7rem",color:"#a08070"}}>{dispLong(today)}</div>}
              </div>
              <button className="dnb" onClick={()=>setActiveDate(shiftD(activeDate,1))} disabled={activeDate>=today}>›</button>
            </div>
            <div className="sub-tabs">
              <button className={`sub-tab ${activeTab==="skin"?"active":""}`} onClick={()=>setActiveTab("skin")}>🌿 Skin</button>
              <button className={`sub-tab ${activeTab==="hair"?"active":""}`} onClick={()=>setActiveTab("hair")}>✨ Hair</button>
            </div>
            {(()=>{
              const todayPlanned=schedules.filter(s=>s.days.includes(activeDateDow)&&(!s.startDate||activeDate>=s.startDate)&&(activeTab==="skin"?skinR:hairR).find(r=>r.id===s.itemId));
              const plannedIds=todayPlanned.map(s=>s.itemId);
              const plannedDone=checked.filter(id=>plannedIds.includes(id)).length;
              const hasPlanned=plannedIds.length>0;
              return hasPlanned?(
                <div style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:".73rem",color:"#a08070",marginBottom:5}}>
                    <span>Planned for today</span>
                    <span style={{color:plannedDone===plannedIds.length?"#2d4a2d":"#a08070",fontWeight:plannedDone===plannedIds.length?600:400}}>{plannedDone} / {plannedIds.length} done{plannedDone===plannedIds.length?" ✓":""}</span>
                  </div>
                  <div className="prog-wrap"><div className="prog-bar" style={{width:`${(plannedDone/plannedIds.length)*100}%`,background:plannedDone===plannedIds.length?"#2d4a2d":"#b07a5e"}}/></div>
                </div>
              ):null;
            })()}
            {visibleReminders.filter(s=>{
                const itemTab=skinR.find(r=>r.id===s.itemId)?"skin":"hair";
                return itemTab===activeTab;
              }).map(s=>{ const it=allItems.find(x=>x.id===s.itemId); if(!it) return null;
              const isDone=(activeTab==="skin"?getE(activeDate).skin:getE(activeDate).hair)?.includes(s.itemId);
              return (
                <div key={s.id} className={`reminder-banner ${isDone?"done":""}`}
                  onClick={()=>{ if(!isDone) toggleItem(activeDate,activeTab,s.itemId); }}>
                  <div className="rb-dot"/>
                  <div className="rb-text">{isDone?"✓ ":""}{it.emoji} {it.label}{s.reminder&&!isDone?` · ${s.time}`:""}</div>
                </div>
              );
            })}
            {treatments.filter(t=>t.dates.includes(activeDate)&&t.type===activeTab).map(tx=>{
              const isDone=tx.completedDates.includes(activeDate);
              return (
                <div key={tx.id} className={`treatment-banner ${isDone?"done":""}`}
                  onClick={()=>completeTreatment(tx.id,activeDate)}>
                  <div className="tb-dot"/>
                  <div className="tb-text">{isDone?"✓ ":""}💉 {tx.name}{isDone?"":" · tap to complete"}</div>
                </div>
              );
            })}

            <div className="sec-head">
              <div className="sec-title">{activeTab==="skin"?"Skin Steps":"Hair Steps"}</div>
              <button className="ghost-btn" onClick={()=>setModal("manageItems")}>✏️ Edit</button>
            </div>
            <div className="routine-grid">
              {routines.map(it=>{ const on=checked.includes(it.id); return (
                <div key={it.id} className={`r-item ${on?"on":""}`} onClick={()=>toggleItem(activeDate,activeTab,it.id)}>
                  <span className="r-emoji">{it.emoji}</span>
                  <span className="r-label">{it.label}</span>
                  <div className="r-check">{on&&<CheckIcon/>}</div>
                </div>
              );})}
            </div>
            <div className="sec-title" style={{marginBottom:12}}>How's your {activeTab==="skin"?"skin":"hair"} feeling?</div>
            <div className="mood-row">
              {MOODS.map(m=><button key={m} className={`mood-chip ${(activeTab==="skin"?entry.skin_mood:entry.hair_mood)===m?"on":""}`} onClick={()=>setMoodVal(activeDate,activeTab,m)}>{m}</button>)}
            </div>
            <div className="sec-title" style={{marginBottom:10}}>Notes & Observations</div>
            <PhotoNotes notes={activeTab==="skin"?entry.skin_notes:entry.hair_notes} photos={curPhotos}
              hidePhotos={true}
              onNotesChange={v=>setNotesVal(activeDate,activeTab,v)}
              onPhotosChange={v=>setPhotosVal(activeDate,activeTab,v)}/>

            {activeTab==="hair"&&<HairLengthCard hairLengths={hairLengths} setHairLengths={setHairLengths} saveHairLength={saveHairLength}/>}
            <button className="save-btn" onClick={saveEntry}>Save Entry</button>
          </>
        )}

        {view==="history"&&(
          <>

            <div className="cal-wrap">
              <div className="cal-header">
                <button className="cal-nav" onClick={()=>setCalMonth(p=>p.m===0?{y:p.y-1,m:11}:{y:p.y,m:p.m-1})}>‹</button>
                <div className="cal-month">{new Date(calMonth.y,calMonth.m,1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>
                <button className="cal-nav" onClick={()=>setCalMonth(p=>p.m===11?{y:p.y+1,m:0}:{y:p.y,m:p.m+1})}>›</button>
              </div>
              <div className="cal-dow">{DOW.map(d=><div key={d} className="cal-dow-cell">{d}</div>)}</div>
              <div className="cal-grid">
                {calDays().map((d,i)=>{
                  if(!d) return <div key={`e${i}`} style={{aspectRatio:1}}/>;
                  const cls=["cal-cell"];
                  if(hasEntry(d)) cls.push("has-entry");
                  if(d===today) cls.push("today-cell");
                  if(d>today) cls.push("future-cell");
                  if(isRangeStart(d)) cls.push("range-start");
                  else if(isRangeEnd(d)) cls.push("range-end");
                  else if(inRange(d)) cls.push("in-range");
                  else if(d===selectedDay) cls.push(rangeMode?"range-mode-cell":"selected-cell");
                  const ach=getDayAchievement(d);
                  return (
                    <div key={d} className={cls.join(" ")}
                      onClick={()=>handleCalClick(d)}
                      onMouseEnter={()=>rangeStart&&!rangeEnd&&setHoverDay(d)}
                      onMouseLeave={()=>setHoverDay(null)}>
                      {(ach?.heart||ach?.hasTreatment)&&<span style={{position:"absolute",top:0,right:1,fontSize:".52rem",lineHeight:1,display:"flex",gap:"1px"}}>
                        {ach.heart==="heart-star"&&<>❤️✨</>}
                        {ach.heart==="heart"&&<>❤️</>}
                        {ach.hasTreatment&&<>💉</>}
                      </span>}
                      {parse(d).getDate()}
                      {hasEntry(d)&&<div className="cal-dot"/>}
                    </div>
                  );
                })}
              </div>
              {rangeMode&&<div style={{textAlign:"center",fontSize:".72rem",color:"#b07a5e",marginTop:8,fontStyle:"italic"}}>Tap another date to select a range</div>}
            </div>

            {selectedDay&&rangeStart&&!rangeEnd&&(()=>{
              const e=getE(selectedDay);
              const si=(e.skin||[]).map(id=>allSkinMap[id]).filter(Boolean);
              const hi=(e.hair||[]).map(id=>allHairMap[id]).filter(Boolean);
              const hasSkin=!!(si.length||e.skin_mood||e.skin_notes||e.skin_photos?.length);
              const hasHair=!!(hi.length||e.hair_mood||e.hair_notes||e.hair_photos?.length);
              const hasAny=hasSkin||hasHair;
              return (
                <div className="day-panel">
                  <div className="day-panel-header">
                    <div className="day-panel-date">{selectedDay===today?"Today — ":""}{dispLong(selectedDay)}</div>
                    <button className="day-edit-btn" onClick={()=>setModal("dayEdit")}>{hasAny?"✏️ Edit":"+ Log"}</button>
                  </div>

                  {hasAny?(
                    <>
                      {hasSkin&&<>
                        <div style={{fontSize:".72rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:6,marginTop:4}}>🌿 Skin</div>
                        {si.length>0&&<div className="dp-pills">{si.map(r=><span key={r.id} className="dp-pill">{r.emoji} {r.label}</span>)}</div>}
                        {e.skin_mood&&<div className="dp-mood">Feeling: {e.skin_mood}</div>}
                        {e.skin_notes&&<div className="dp-note">"{e.skin_notes}"</div>}
                        {e.skin_photos?.length>0&&<div className="photo-thumbs" style={{marginTop:6,marginBottom:4}}>{e.skin_photos.map(p=><div key={p.id} className="photo-thumb" style={{cursor:"pointer"}} onClick={()=>setLightboxPhoto({...p,_type:"skin",_date:selectedDay})}><img src={p.src} alt={p.name}/></div>)}</div>}
                      </>}
                      {hasHair&&<>
                        <div style={{fontSize:".72rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:6,marginTop:hasSkin?12:4}}>✨ Hair</div>
                        {hi.length>0&&<div className="dp-pills">{hi.map(r=><span key={r.id} className="dp-pill h">{r.emoji} {r.label}</span>)}</div>}
                        {e.hair_mood&&<div className="dp-mood">Feeling: {e.hair_mood}</div>}
                        {e.hair_notes&&<div className="dp-note">"{e.hair_notes}"</div>}
                        {e.hair_photos?.length>0&&<div className="photo-thumbs" style={{marginTop:6}}>{e.hair_photos.map(p=><div key={p.id} className="photo-thumb" style={{cursor:"pointer"}} onClick={()=>setLightboxPhoto({...p,_type:"hair",_date:selectedDay})}><img src={p.src} alt={p.name}/></div>)}</div>}
                      </>}
                    </>
                  ):<div className="dp-empty">Nothing logged for this day yet</div>}
                </div>
              );
            })()}
          </>
        )}

        {view==="plan"&&(
          <>
            <div className="sec-head">
              <div className="sec-title">Plans</div>
              <button className="ghost-btn" onClick={()=>setModal("plan")}>+ Add</button>
            </div>
            {(()=>{
              const skinPlans=schedules.filter(s=>skinR.find(r=>r.id===s.itemId));
              const hairPlans=schedules.filter(s=>hairR.find(r=>r.id===s.itemId));
              const skinTreatments=treatments.filter(t=>t.type==="skin");
              const hairTreatments=treatments.filter(t=>t.type==="hair");
              const hasAnything=schedules.length||treatments.length;

              const PlanCard=({s})=>{
                const it=allItems.find(x=>x.id===s.itemId); if(!it) return null;
                const recurDays=(s.days||[]).sort().map(d=>["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(", ");
                const dateCount=(s.dates||[]).length;
                const isToday=(s.days||[]).includes(new Date().getDay())||(s.dates||[]).includes(today);
                return (
                  <div className="sched-card" style={{cursor:"pointer",marginBottom:8}} onClick={()=>setSelectedPlan({type:"plan",data:s})}>
                    <div className="sched-top">
                      <span style={{fontSize:"1rem"}}>{it.emoji}</span>
                      <div style={{flex:1}}>
                        <div className="sched-label">{it.label}</div>
                        <div style={{fontSize:".71rem",color:"#9a7050",marginTop:2}}>
                          {(s.days||[]).length===7?<span>Every day</span>:recurDays&&<span>Every {recurDays}</span>}
                          {recurDays&&dateCount>0&&<span> · </span>}
                          {dateCount>0&&<span>{dateCount} date{dateCount!==1?"s":""}</span>}
                          {s.startDate&&(s.days||[]).length===0&&dateCount===0&&<span style={{color:"#b8a090"}}>from {parse(s.startDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>}
                          {s.location&&<span> · <span style={{cursor:"pointer",color:"#b07a5e",textDecoration:"underline"}} onClick={e=>{e.stopPropagation();openUrl(`https://www.google.com/maps/search/${encodeURIComponent(s.location)}`);}}>📍 {s.location}</span></span>}
                        </div>
                      </div>
                      {isToday&&<span style={{fontSize:".68rem",background:"#b07a5e",color:"#fff",borderRadius:20,padding:"2px 8px",whiteSpace:"nowrap"}}>Today</span>}
                    </div>
                    {s.reminder&&<div className="sched-reminder">🔔 at {s.time}</div>}
                  </div>
                );
              };

              const TxCard=({tx})=>{
                const upcoming=tx.dates.filter(d=>d>=today).sort();
                const next=upcoming[0];
                return (
                  <div className="sched-card treatment-card" style={{cursor:"pointer",marginBottom:8}} onClick={()=>setSelectedPlan({type:"treatment",data:tx})}>
                    <div className="sched-top">
                      <span style={{fontSize:"1rem"}}>💉</span>
                      <div style={{flex:1}}>
                        <div className="sched-label">{tx.name}</div>
                        <div style={{fontSize:".71rem",color:"#9a7050",marginTop:2}}>
                          {tx.dates.length} date{tx.dates.length!==1?"s":""} · {tx.completedDates?.length||0} done{tx.location?<span> · <span style={{cursor:"pointer",color:"#b07a5e",textDecoration:"underline"}} onClick={e=>{e.stopPropagation();openUrl(`https://www.google.com/maps/search/${encodeURIComponent(tx.location)}`);}}>📍 {tx.location}</span></span>:null}
                          {next&&<span> · Next: {parse(next).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>}
                        </div>
                      </div>
                      {tx.dates.includes(today)&&<span style={{fontSize:".68rem",background:"#e06050",color:"#fff",borderRadius:20,padding:"2px 8px",whiteSpace:"nowrap"}}>Today</span>}
                    </div>
                  </div>
                );
              };

              return !hasAnything?(
                <div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>No plans yet — tap + Add to start</div>
              ):(
                <>
                  {(skinPlans.length>0||skinTreatments.length>0)&&<>
                    <div style={{fontSize:".72rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>🌿 Skin</div>
                    {skinPlans.map(s=><PlanCard key={s.id} s={s}/>)}
                    {skinTreatments.map(tx=><TxCard key={tx.id} tx={tx}/>)}
                  </>}
                  {(hairPlans.length>0||hairTreatments.length>0)&&<>
                    <div style={{fontSize:".72rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:10,marginTop:(skinPlans.length||skinTreatments.length)?20:0,display:"flex",alignItems:"center",gap:6}}>✨ Hair</div>
                    {hairPlans.map(s=><PlanCard key={s.id} s={s}/>)}
                    {hairTreatments.map(tx=><TxCard key={tx.id} tx={tx}/>)}
                  </>}
                </>
              );
            })()}
          </>
        )}

        {view==="frequency"&&(
          <>
            <div className="sec-head">
              <div className="sec-title">Habit Frequency</div>
              <button className="ghost-btn" onClick={()=>setModal("freq")}>⚙️ Configure</button>
            </div>
            <div className="period-row">
              {["week","month","year"].map(p=>(
                <button key={p} className={`period-chip ${freqPeriod===p?"on":""}`}
                  onClick={async()=>{ setFreqPeriod(p); await supabase.from('freq_settings').upsert({user_id:user.id,period:p,tracked:freqTracked,updated_at:new Date().toISOString()},{onConflict:'user_id'}); }}>
                  This {p[0].toUpperCase()+p.slice(1)}
                </button>
              ))}
            </div>
            {!freqTracked.length?(
              <div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>No habits tracked — tap Configure</div>
            ):freqTracked.map(id=>{
              const it=allItems.find(x=>x.id===id); if(!it) return null;
              const {count,possible}=freqStats(id);
              const pct=possible>0?Math.round((count/possible)*100):0;
              return (
                <div key={id} className="freq-card">
                  <div className="freq-top">
                    <span className="freq-emoji">{it.emoji}</span>
                    <span className="freq-label">{it.label}</span>
                    <span className="freq-count">{count} / {possible} days</span>
                  </div>
                  <div className="freq-bar-bg"><div className="freq-bar-fill" style={{width:`${pct}%`}}/></div>
                  <div className="freq-sub">{pct}% of days {freqRange().label}</div>
                </div>
              );
            })}
          {treatments.length>0&&<>
            <div className="sec-head" style={{marginTop:28}}>
              <div className="sec-title">Treatment History</div>
            </div>
            {treatments.map(tx=>{
              const done=tx.completedDates||[];
              return (
                <TreatmentHistoryCard key={tx.id} tx={tx} doneDates={done}/>
              );
            })}
          </>}

          <hr style={{border:"none",borderTop:"1.5px solid #e8d8cc",margin:"28px 0 20px"}}/>
          <SpendingSummary purchases={purchases} period={freqPeriod} onGoToPurchases={()=>setPageView("purchases")}/>
          </>
        )}
      </div>

      {modal==="manageItems"&&<ManageItemsModal type={activeTab} items={activeTab==="skin"?skinR:hairR} onAdd={item=>addItem(activeTab,item)} onRemove={id=>removeItem(activeTab,id)} onEdit={(id,changes)=>editItem(activeTab,id,changes)} onClose={()=>setModal(null)}/>}
      {selectedPlan&&<PlanModal allItems={allItems} skinItems={skinR} hairItems={hairR} schedules={schedules} treatments={treatments}
        onSave={async s=>{ await saveSched(s); setSelectedPlan(null); }}
        onSaveMany={async plans=>{ await saveSchedMany(plans); setSelectedPlan(null); }}
        onDelete={id=>{ confirmDeleteSched(id); setSelectedPlan(null); }}
        onSaveTreatment={async tx=>{ await saveTreatment(tx); setSelectedPlan(null); }}
        onDeleteTreatment={id=>{ confirmDeleteTreatment(id); setSelectedPlan(null); }}
        onAddItem={(type,item)=>addItem(type,item)}
        onClose={()=>setSelectedPlan(null)}
        initialPlan={selectedPlan.type==="plan"?selectedPlan.data:null}
        initialTreatment={selectedPlan.type==="treatment"?selectedPlan.data:null}/>}
      {modal==="plan"&&<PlanModal allItems={allItems} skinItems={skinR} hairItems={hairR} schedules={schedules} treatments={treatments} onSave={saveSched} onSaveMany={saveSchedMany} onDelete={deleteSched} onSaveTreatment={saveTreatment} onDeleteTreatment={deleteTreatment} onAddItem={(type,item)=>addItem(type,item)} onClose={()=>setModal(null)}/>}
      {modal==="freq"&&<FreqModal allItems={allItems} tracked={freqTracked} period={freqPeriod} onToggle={id=>setFreqTracked(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])} onPeriod={async p=>{ setFreqPeriod(p); await persist({freqPeriod:p}); }} onClose={()=>setModal(null)}/>}
      {modal==="dayEdit"&&selectedDay&&<DayEditModal date={selectedDay} entry={getE(selectedDay)} skinRoutines={skinR} hairRoutines={hairR} onSave={data=>saveDayEdit(selectedDay,data)} onClose={()=>setModal(null)}/>}
      {modal==="rangeApply"&&rangeStart&&rangeEnd&&<RangeApplyModal rangeStart={rangeStart} rangeEnd={rangeEnd} skinRoutines={skinR} hairRoutines={hairR} onApply={applyRange} onClose={()=>{ setModal(null); setRangeStart(null); setRangeEnd(null); setRangeMode(false); }}/>}

      {showNamePrompt&&(
        <div className="name-prompt-overlay">
          <div className="name-prompt">
            <div className="name-prompt-title">Welcome to <span>Ritual</span></div>
            <div className="name-prompt-sub">What should we call you? We'll personalise your journal.</div>
            <input className="ifield" style={{textAlign:"center",marginBottom:14,width:"100%"}}
              placeholder="Your first name…"
              value={userName} onChange={e=>setUserName(e.target.value)}
              onKeyDown={async e=>{ if(e.key==="Enter"&&userName.trim()){ await supabase.auth.updateUser({data:{display_name:userName.trim()}}); setShowNamePrompt(false); }}}
              autoFocus/>
            <button className="save-btn" disabled={!userName.trim()}
              style={{opacity:userName.trim()?1:.4}}
              onClick={async()=>{ await supabase.auth.updateUser({data:{display_name:userName.trim()}}); setShowNamePrompt(false); }}>
              Let's go ✨
            </button>
            <button onClick={()=>setShowNamePrompt(false)} style={{background:"none",border:"none",fontSize:".76rem",color:"#a08070",cursor:"pointer",marginTop:10,fontFamily:"'DM Sans',sans-serif"}}>
              Skip for now
            </button>
          </div>
        </div>
      )}
      {toast&&<div className="toast">{toast}</div>}
      {lightboxPhoto&&<Lightbox
        photo={lightboxPhoto}
        onClose={()=>setLightboxPhoto(null)}
        onDelete={(photoId)=>{
          const date=lightboxPhoto._date;
          const type=lightboxPhoto._type;
          const e=getE(date);
          const key=type==="skin"?"skin_photos":"hair_photos";
          const updated={...e,[key]:(e[key]||[]).filter(p=>p.id!==photoId)};
          saveDayEdit(date,updated);
        }}/>}
      {confirmDelete&&<ConfirmDialog message={confirmDelete.message} onConfirm={()=>{confirmDelete.onConfirm();setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}

      {sideMenuEl}
    </div>
  );
}
