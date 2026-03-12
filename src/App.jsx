import { useState, useEffect, useRef, useCallback } from "react";
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

const fmt      = d => d.toLocaleDateString("en-CA");
const parse    = s => { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const dispLong = s => parse(s).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
const uid      = () => crypto.randomUUID();
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
.app{max-width:680px;margin:0 auto;padding:0 16px 100px}
.header{text-align:center;padding:36px 0 28px;border-bottom:1px solid #e8d8cc;margin-bottom:24px}
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
.side-menu{position:fixed;top:0;right:0;bottom:0;width:260px;background:#fdf6f0;border-left:1.5px solid #e8d8cc;z-index:400;padding:48px 24px 32px;display:flex;flex-direction:column;gap:0;box-shadow:-4px 0 20px rgba(58,46,39,.1);transform:translateX(100%);transition:transform .28s ease}
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

function ProductSearch({ category, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    const q = query.trim();

    // Search OpenBeautyFacts and global DB in parallel
    const [openResults, globalResults] = await Promise.all([
      fetch("https://world.openbeautyfacts.org/cgi/search.pl?search_terms=" + encodeURIComponent(q) + "&search_simple=1&action=process&json=1&page_size=8")
        .then(r => r.json())
        .then(data => (data.products || []).filter(p => p.product_name).map(p => ({...p, _source:"open"})))
        .catch(() => []),
      (async () => {
        try {
          const supaUrl = import.meta.env.VITE_SUPABASE_URL;
          const supaKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const res = await fetch(
            supaUrl + "/rest/v1/global_products?or=(name.ilike.*" + encodeURIComponent(q) + "*,brand.ilike.*" + encodeURIComponent(q) + "*)&limit=5&order=search_count.desc",
            { headers: { apikey: supaKey, Authorization: "Bearer " + supaKey } }
          );
          const data = res.ok ? await res.json() : [];
          return (data || []).map(p => ({
            product_name: p.name, brands: p.brand, image_small_url: "",
            global_product_id: p.id, ingredients: p.ingredients || [], _source: "global"
          }));
        } catch(e) { return []; }
      })()
    ]);

    // Merge — global first, then open results not already covered by name match
    const globalNames = new Set(globalResults.map(p => p.product_name.toLowerCase()));
    const deduped = openResults.filter(p => !globalNames.has((p.product_name||"").toLowerCase()));
    setResults([...globalResults, ...deduped]);
    setLoading(false);
  };

  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:".7rem",color:"#a08070",marginBottom:6,letterSpacing:".08em",textTransform:"uppercase"}}>Search Product Database</div>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <input className="ifield" style={{flex:1}} placeholder="Search by product name…" value={query}
          onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()}/>
        <button onClick={search}
          style={{background:"#b07a5e",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",cursor:"pointer",fontSize:".8rem",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
          {loading?"…":"Search"}
        </button>
      </div>
      {searched&&results.length===0&&!loading&&<div style={{fontSize:".78rem",color:"#a08070",fontStyle:"italic",marginBottom:8}}>No results — fill in manually below</div>}
      {results.length>0&&(
        <div style={{maxHeight:220,overflowY:"auto",border:"1px solid #e8d8cc",borderRadius:12,marginBottom:8}}>
          {results.map((p,i)=>(
            <div key={i}
              onClick={()=>onSelect({
                name:p.product_name||"",
                brand:p.brands||"",
                image:p.image_small_url||"",
                link:"",
                global_product_id:p.global_product_id||null,
                ingredients:p.ingredients||[]
              })}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderBottom:"1px solid #f0e0d4",cursor:"pointer",background:"#fff8f3"}}
              onMouseEnter={e=>e.currentTarget.style.background="#fdf0e8"}
              onMouseLeave={e=>e.currentTarget.style.background="#fff8f3"}>
              {p.image_small_url
                ?<img src={p.image_small_url} alt="" style={{width:36,height:36,objectFit:"cover",borderRadius:8,flexShrink:0}}/>
                :<div style={{width:36,height:36,borderRadius:8,background:"#f0e0d4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0}}>{category==="skin"?"🌿":category==="treatment"?"💉":"✨"}</div>
              }
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:".82rem",color:"#3a2e27",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.product_name}</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {p.brands&&<span style={{fontSize:".72rem",color:"#a08070"}}>{p.brands}</span>}
                  {p._source==="global"&&<span style={{fontSize:".62rem",background:p.ingredients?.length?"#e8f4e8":"#f0e8e0",color:p.ingredients?.length?"#5a8a5a":"#a08070",borderRadius:6,padding:"1px 6px"}}>{p.ingredients?.length?"✓ ingredients known":"in our DB"}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{fontSize:".7rem",color:"#c0b0a8",textAlign:"center",marginBottom:4}}>or fill in manually ↓</div>
    </div>
  );
}

function PurchasesPage({ purchases, prefill, onClearPrefill, onSave, onDelete, onBack }) {
  const today = fmt(new Date());
  const thisYear = new Date().getFullYear().toString();
  const [showForm, setShowForm] = useState(false);
  const [editP, setEditP] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [chooseCat, setChooseCat] = useState(false);
  const [openMonths, setOpenMonths] = useState({[today.slice(0,7)]:true});
  const [openYears, setOpenYears] = useState({});

  const blank = (cat) => ({ id:crypto.randomUUID(), name:"", brand:"", category:cat, price:"", quantity:"1", date:today, notes:"", tags:[], image:"" });
  const startAdd = () => { setChooseCat(true); };

  // Handle prefill from wishlist
  useEffect(()=>{
    if (prefill) { setEditP(prefill); setShowForm(true); setChooseCat(false); onClearPrefill&&onClearPrefill(); }
  }, [prefill]);
  const startEdit = p => { setEditP({...p, price:String(p.price), quantity:String(p.quantity)}); setShowForm(true); setChooseCat(false); };
  const save = () => { if(!editP.name.trim()||!editP.date) return; onSave(editP); setShowForm(false); setEditP(null); };
  const toggleMonth = m => setOpenMonths(s=>({...s,[m]:!s[m]}));
  const toggleYear = y => setOpenYears(s=>({...s,[y]:!s[y]}));

  const filtered = purchases.filter(p=>filterCat==="all"||p.category===filterCat);
  const grandTotal = filtered.reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);

  // Separate current year (live months) from past years (tiles)
  const currentYearPurchases = filtered.filter(p=>p.date.startsWith(thisYear));
  const pastPurchases = filtered.filter(p=>!p.date.startsWith(thisYear));

  // Group current year by month
  const monthGroups = {};
  currentYearPurchases.forEach(p=>{
    const m=p.date.slice(0,7);
    if(!monthGroups[m]) monthGroups[m]=[];
    monthGroups[m].push(p);
  });
  const currentMonths = Object.keys(monthGroups).sort((a,b)=>b.localeCompare(a));

  // Group past by year
  const yearGroups = {};
  pastPurchases.forEach(p=>{
    const y=p.date.slice(0,4);
    if(!yearGroups[y]) yearGroups[y]=[];
    yearGroups[y].push(p);
  });
  const pastYears = Object.keys(yearGroups).sort((a,b)=>b.localeCompare(a));

  const PurchaseCard = ({p}) => (
    <div className="purch-card">
      {p.image
        ?<img src={p.image} alt="" style={{width:40,height:40,objectFit:"cover",borderRadius:8,flexShrink:0}}/>
        :<div style={{fontSize:"1.1rem",flexShrink:0}}>{p.category==="skin"?"🌿":p.category==="treatment"?"💉":"✨"}</div>
      }
      <div className="purch-info">
        <div className="purch-name">{p.name}</div>
        <div className="purch-meta">{p.brand&&`${p.brand} · `}{p.category} · {parse(p.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}{p.quantity>1&&` · qty ${p.quantity}`}</div>
        {p.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>{p.tags.map(t=><span key={t} style={{fontSize:".68rem",background:"#f7ece4",border:"1px solid #e8d8cc",borderRadius:20,padding:"2px 8px",color:"#8a6858"}}>{t}</span>)}</div>}
        {p.notes&&<div style={{fontSize:".72rem",color:"#a08070",marginTop:2,fontStyle:"italic"}}>{p.notes}</div>}
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
        <div className="purch-price">${((parseFloat(p.price)||0)*(parseInt(p.quantity)||1)).toFixed(2)}</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {p.link&&<button className="ghost-btn" style={{fontSize:".68rem",padding:"2px 7px",color:"#b07a5e"}} onClick={()=>window.open(p.link,"_blank")}>Buy Now</button>}
          <button className="ghost-btn" style={{fontSize:".68rem",padding:"2px 7px"}} onClick={()=>startEdit(p)}>Edit</button>
          <button className="del-btn" style={{fontSize:".68rem"}} onClick={()=>onDelete(p.id)}>✕</button>
        </div>
      </div>
    </div>
  );

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

  return (
    <div className="app">
      <style>{`
        .purch-form{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:16px;padding:18px;margin-bottom:16px}
        .purch-month-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:12px;cursor:pointer;margin-bottom:6px;transition:background .15s}
        .purch-month-header:hover{background:#fdf0e8}
        .year-tile{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:16px;padding:16px 18px;margin-bottom:10px;cursor:pointer;transition:all .15s}
        .year-tile:hover{background:#fdf0e8}
        .grand-total{background:linear-gradient(135deg,#f9ede4,#fdf6f0);border:1.5px solid #e8c8b4;border-radius:14px;padding:14px 18px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}
      `}</style>
      <div className="header" style={{position:"relative"}}>
        <button onClick={onBack} style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#b07a5e",fontSize:"1.2rem",padding:"8px"}}>←</button>
        <div className="header-title">My <span>Purchases</span></div>
        <div className="header-sub">Skin · Hair Spending</div>
      </div>

      {grandTotal>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:".68rem",letterSpacing:".12em",textTransform:"uppercase",color:"#a08070",marginBottom:4}}>All Time Spending</div>
          <div style={{display:"flex",alignItems:"baseline",gap:10}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"2.4rem",color:"#3a2e27",lineHeight:1}}>${grandTotal.toFixed(2)}</div>
            <div style={{fontSize:".76rem",color:"#b07a5e"}}>{filtered.length} product{filtered.length!==1?"s":""}</div>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["all","All"],["skin","🌿"],["hair","✨"],["treatment","💉"]].map(([v,l])=>(
          <button key={v} className={`period-chip ${filterCat===v?"on":""}`} style={{flex:1,fontSize:".82rem"}} onClick={()=>setFilterCat(v)}>{l}{v!=="all"?" "+v.charAt(0).toUpperCase()+v.slice(1):""}</button>
        ))}
      </div>

      {chooseCat&&(
        <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:16,padding:"18px",marginBottom:16}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic",color:"#7a5c48",marginBottom:14}}>What did you purchase?</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[["🌿","Skin","skin"],["✨","Hair","hair"],["💉","Treatment","treatment"]].map(([emoji,label,cat])=>(
              <button key={cat} onClick={()=>{setEditP(blank(cat));setShowForm(true);setChooseCat(false);}}
                style={{display:"flex",alignItems:"center",gap:12,background:"#fdf6f0",border:"1.5px solid #e8d8cc",borderRadius:12,padding:"12px 16px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                <span style={{fontSize:"1.3rem"}}>{emoji}</span>
                <span style={{fontSize:".88rem",color:"#3a2e27",fontWeight:500}}>{label} Product</span>
              </button>
            ))}
            <button onClick={()=>setChooseCat(false)} style={{background:"none",border:"none",fontSize:".78rem",color:"#a08070",cursor:"pointer",marginTop:4,fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
          </div>
        </div>
      )}

      {showForm&&editP&&(
        <div className="purch-form">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic",color:"#7a5c48"}}>{purchases.find(p=>p.id===editP.id)?"Edit":"Add"} Purchase</div>
            <button onClick={()=>{setShowForm(false);setEditP(null);}} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"#a08070"}}>×</button>
          </div>
          <ProductSearch category={editP.category} onSelect={({name,brand,image})=>setEditP(p=>({...p,name,brand,image:image||""}))}/>
          <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Product name *" value={editP.name} onChange={e=>setEditP(p=>({...p,name:e.target.value}))}/>
          <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Brand (optional)" value={editP.brand} onChange={e=>setEditP(p=>({...p,brand:e.target.value}))}/>
          <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Product URL (optional — enables Buy Now)" value={editP.link||""} onChange={e=>setEditP(p=>({...p,link:e.target.value}))}/>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            {["skin","hair","treatment"].map(cat=>(
              <button key={cat} className={`dow-chip ${editP.category===cat?"on":""}`} style={{flex:1,textAlign:"center",fontSize:".74rem"}}
                onClick={()=>setEditP(p=>({...p,category:cat}))}>
                {cat==="skin"?"🌿 Skin":cat==="treatment"?"💉 Treat":"✨ Hair"}
              </button>
            ))}
          </div>
          <div style={{fontSize:".7rem",color:"#a08070",marginBottom:6,letterSpacing:".08em",textTransform:"uppercase"}}>Product Type</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
            {["Moisturizer","Serum","Cleanser","Toner","SPF","Oil","Mask","Shampoo","Conditioner","Treatment","Supplement","Other"].map(tag=>(
              <button key={tag} className={`dow-chip ${(editP.tags||[]).includes(tag)?"on":""}`}
                style={{fontSize:".74rem",padding:"4px 10px"}}
                onClick={()=>setEditP(p=>({...p,tags:(p.tags||[]).includes(tag)?(p.tags||[]).filter(t=>t!==tag):[...(p.tags||[]),tag]}))}>
                {tag}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:".7rem",color:"#a08070",marginBottom:4,letterSpacing:".08em",textTransform:"uppercase"}}>Price ($)</div>
              <input className="ifield" style={{width:"100%"}} type="number" placeholder="0.00" value={editP.price} onChange={e=>setEditP(p=>({...p,price:e.target.value}))}/>
            </div>
            <div style={{width:70}}>
              <div style={{fontSize:".7rem",color:"#a08070",marginBottom:4,letterSpacing:".08em",textTransform:"uppercase"}}>Qty</div>
              <input className="ifield" style={{width:"100%"}} type="number" min="1" value={editP.quantity} onChange={e=>setEditP(p=>({...p,quantity:e.target.value}))}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:".7rem",color:"#a08070",marginBottom:4,letterSpacing:".08em",textTransform:"uppercase"}}>Date</div>
              <input className="ifield" style={{width:"100%"}} type="date" value={editP.date} onChange={e=>setEditP(p=>({...p,date:e.target.value}))}/>
            </div>
          </div>
          <input className="ifield" style={{width:"100%",marginBottom:12}} placeholder="Notes (optional)" value={editP.notes} onChange={e=>setEditP(p=>({...p,notes:e.target.value}))}/>
          <button className="save-btn" onClick={save} disabled={!editP.name.trim()} style={{opacity:editP.name.trim()?1:.4}}>Save Purchase</button>
        </div>
      )}

      {!showForm&&!chooseCat&&<button className="add-sched-btn" style={{marginBottom:16}} onClick={startAdd}>+ Add Purchase</button>}

      {filtered.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>No purchases yet</div>}

      {/* Current year - live month dropdowns */}
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

      {/* Past years - tiles */}
      {pastYears.map(y=>{
        const ps=yearGroups[y];
        const yTotal=ps.reduce((s,p)=>s+(parseFloat(p.price)||0)*(parseInt(p.quantity)||1),0);
        const isOpen=!!openYears[y];

        // Group by month inside year
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
function WishlistPage({ wishlist, products, onSave, onDelete, onMoveToCart, onBack }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [chooseCat, setChooseCat] = useState(false);
  const today = fmt(new Date());

  const blank = (cat) => ({ id:crypto.randomUUID(), name:"", brand:"", category:cat, image:"", link:"", notes:"", tags:[], priority:0 });
  const save = () => { if(!editItem.name.trim()) return; onSave(editItem); setShowForm(false); setEditItem(null); };

  const sorted = [...wishlist].sort((a,b)=>(b.priority||0)-(a.priority||0));

  return (
    <div className="app">
      <style>{`
        .wish-card{background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:14px;padding:14px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start}
        .wish-card:hover{background:#fdf0e8}
        .wish-name{font-size:.9rem;font-weight:500;color:#3a2e27;margin-bottom:2px}
        .wish-meta{font-size:.72rem;color:#a08070}
      `}</style>
      <div className="header" style={{position:"relative"}}>
        <button onClick={onBack} style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#b07a5e",fontSize:"1.2rem",padding:"8px"}}>←</button>
        <div className="header-title">My <span>Wishlist</span></div>
        <div className="header-sub">{wishlist.length} item{wishlist.length!==1?"s":""} saved</div>
      </div>

      {chooseCat&&(
        <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:16,padding:"18px",marginBottom:16}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic",color:"#7a5c48",marginBottom:14}}>What are you wishing for?</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[["🌿","Skin","skin"],["✨","Hair","hair"],["💉","Treatment","treatment"]].map(([emoji,label,cat])=>(
              <button key={cat} onClick={()=>{setEditItem(blank(cat));setShowForm(true);setChooseCat(false);}}
                style={{display:"flex",alignItems:"center",gap:12,background:"#fdf6f0",border:"1.5px solid #e8d8cc",borderRadius:12,padding:"12px 16px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                <span style={{fontSize:"1.3rem"}}>{emoji}</span>
                <span style={{fontSize:".88rem",color:"#3a2e27",fontWeight:500}}>{label} Product</span>
              </button>
            ))}
            <button onClick={()=>setChooseCat(false)} style={{background:"none",border:"none",fontSize:".78rem",color:"#a08070",cursor:"pointer",marginTop:4,fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
          </div>
        </div>
      )}

      {showForm&&editItem&&(
        <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:16,padding:"18px",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontStyle:"italic",color:"#7a5c48"}}>{wishlist.find(w=>w.id===editItem.id)?"Edit":"Add to"} Wishlist</div>
            <button onClick={()=>{setShowForm(false);setEditItem(null);}} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"#a08070"}}>×</button>
          </div>
          <ProductSearch category={editItem.category} onSelect={({name,brand,image,link})=>setEditItem(p=>({...p,name,brand,image:image||"",link:link||""}))}/>
          <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Product name *" value={editItem.name} onChange={e=>setEditItem(p=>({...p,name:e.target.value}))}/>
          <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Brand (optional)" value={editItem.brand} onChange={e=>setEditItem(p=>({...p,brand:e.target.value}))}/>
          <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Product URL — enables Buy Now" value={editItem.link||""} onChange={e=>setEditItem(p=>({...p,link:e.target.value}))}/>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {["skin","hair","treatment"].map(cat=>(
              <button key={cat} className={`dow-chip ${editItem.category===cat?"on":""}`} style={{flex:1,fontSize:".74rem",textAlign:"center"}}
                onClick={()=>setEditItem(p=>({...p,category:cat}))}>
                {cat==="skin"?"🌿 Skin":cat==="treatment"?"💉 Treat":"✨ Hair"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
            {["Moisturizer","Serum","Cleanser","Toner","SPF","Oil","Mask","Shampoo","Conditioner","Treatment","Supplement","Other"].map(tag=>(
              <button key={tag} className={`dow-chip ${(editItem.tags||[]).includes(tag)?"on":""}`}
                style={{fontSize:".74rem",padding:"4px 10px"}}
                onClick={()=>setEditItem(p=>({...p,tags:(p.tags||[]).includes(tag)?(p.tags||[]).filter(t=>t!==tag):[...(p.tags||[]),tag]}))}>
                {tag}
              </button>
            ))}
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:".7rem",color:"#a08070",marginBottom:6,letterSpacing:".08em",textTransform:"uppercase"}}>Priority</div>
            <div style={{display:"flex",gap:8}}>
              {[["0","Low"],["1","Medium"],["2","High 🔥"]].map(([v,l])=>(
                <button key={v} className={`dow-chip ${String(editItem.priority||0)===v?"on":""}`}
                  style={{flex:1,fontSize:".74rem",textAlign:"center"}}
                  onClick={()=>setEditItem(p=>({...p,priority:parseInt(v)}))}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <input className="ifield" style={{width:"100%",marginBottom:12}} placeholder="Notes (optional)" value={editItem.notes||""} onChange={e=>setEditItem(p=>({...p,notes:e.target.value}))}/>
          <button className="save-btn" onClick={save} disabled={!editItem.name.trim()} style={{opacity:editItem.name.trim()?1:.4}}>Save to Wishlist</button>
        </div>
      )}

      {!showForm&&!chooseCat&&<button className="add-sched-btn" style={{marginBottom:16}} onClick={()=>setChooseCat(true)}>+ Add to Wishlist</button>}

      {sorted.length===0&&!showForm&&<div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>Your wishlist is empty ✨</div>}

      {sorted.map(item=>(
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
              {item.link&&<button onClick={()=>window.open(item.link,"_blank")} style={{background:"#b07a5e",border:"none",borderRadius:8,padding:"5px 12px",color:"#fff",cursor:"pointer",fontSize:".76rem",fontFamily:"'DM Sans',sans-serif"}}>Buy Now</button>}
              <button className="ghost-btn" style={{fontSize:".74rem",padding:"4px 10px"}} onClick={()=>onMoveToCart(item)}>✓ Mark Purchased</button>
              <button className="ghost-btn" style={{fontSize:".74rem",padding:"4px 10px"}} onClick={()=>{setEditItem({...item});setShowForm(true);}}>Edit</button>
              <button className="del-btn" style={{fontSize:".74rem"}} onClick={()=>onDelete(item.id)}>✕</button>
            </div>
          </div>
        </div>
      ))}
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
      {!isEditingProd&&<ProductSearch category={p.category} onSelect={({name,brand,image,link,global_product_id,ingredients})=>setP(prev=>({...prev,name,brand,image:image||"",link:link||"",global_product_id:global_product_id||null,ingredients:ingredients||[]}))}/>}
      <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Product name *" value={p.name} onChange={e=>setP(prev=>({...prev,name:e.target.value}))} autoFocus/>
      <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Brand (optional)" value={p.brand||""} onChange={e=>setP(prev=>({...prev,brand:e.target.value}))}/>
      <input className="ifield" style={{width:"100%",marginBottom:10}} placeholder="Product URL — enables Buy Now" value={p.link||""} onChange={e=>setP(prev=>({...prev,link:e.target.value}))}/>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        {["skin","hair","treatment"].map(cat=>(
          <button key={cat} className={`dow-chip ${p.category===cat?"on":""}`} style={{flex:1,fontSize:".74rem",textAlign:"center"}}
            onClick={()=>setP(prev=>({...prev,category:cat}))}>
            {cat==="skin"?"🌿 Skin":cat==="treatment"?"💉 Treat":"✨ Hair"}
          </button>
        ))}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {["Moisturizer","Serum","Cleanser","Toner","SPF","Oil","Mask","Shampoo","Conditioner","Treatment","Supplement","Other"].map(tag=>(
          <button key={tag} className={`dow-chip ${(p.tags||[]).includes(tag)?"on":""}`}
            style={{fontSize:".74rem",padding:"4px 10px"}}
            onClick={()=>setP(prev=>({...prev,tags:(prev.tags||[]).includes(tag)?(prev.tags||[]).filter(t=>t!==tag):[...(prev.tags||[]),tag]}))}>
            {tag}
          </button>
        ))}
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:".7rem",color:"#a08070",marginBottom:8,letterSpacing:".08em",textTransform:"uppercase"}}>Frequency <span style={{textTransform:"none",letterSpacing:0,color:"#c0b0a8"}}>(optional)</span></div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <button className={`dow-chip ${p.frequency==="Daily"?"on":""}`}
            style={{fontSize:".74rem",padding:"5px 14px",fontWeight:p.frequency==="Daily"?600:400}}
            onClick={()=>setP(prev=>({...prev,frequency:prev.frequency==="Daily"?"":"Daily"}))}>
            Daily
          </button>
          <span style={{color:"#d0b8a8",fontSize:".8rem"}}>or</span>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[2,3,4,5,6,7].map(n=>{
              const unit = p._freqUnit||"week";
              const val = n+"x "+unit;
              const active = p.frequency===val;
              return <button key={n} className={"dow-chip "+(active?"on":"")}
                style={{fontSize:".78rem",padding:"5px 10px",minWidth:36}}
                onClick={()=>setP(prev=>({...prev,frequency:active?"":val,_freqUnit:unit}))}>
                {n}x
              </button>;
            })}
          </div>
          <div style={{display:"flex",gap:4}}>
            {["week","month"].map(u=>{
              const n = p.frequency?.match(/^(\d+)x /)?.[1];
              const active = p._freqUnit===u||(p.frequency&&p.frequency.endsWith(u)&&!p._freqUnit);
              return <button key={u} className={"dow-chip "+((active&&p.frequency!=="Daily")?"on":"")}
                style={{fontSize:".74rem",padding:"5px 12px"}}
                onClick={()=>{ const num=n||2; setP(prev=>({...prev,_freqUnit:u,frequency:num+"x "+u})); }}>
                {u}
              </button>;
            })}
          </div>
        </div>
        {p.frequency&&<div style={{marginTop:6,fontSize:".72rem",color:"#b07a5e",fontStyle:"italic"}}>→ {p.frequency}</div>}
      </div>
      <input className="ifield" style={{width:"100%",marginBottom:12}} placeholder="Notes (optional)" value={p.notes||""} onChange={e=>setP(prev=>({...prev,notes:e.target.value}))}/>
      <button className="save-btn" onClick={()=>onSave(p)} disabled={!p.name.trim()} style={{opacity:p.name.trim()?1:.4}}>
        {isEditingProd?"Save Changes":"Add to My Routine"}
      </button>
    </div>
  );
}

function MyProductsPage({ products, snapshots, entries, onSaveProduct, onDeleteProduct, onOpenSnapshot, onAddToSnapshot, onRemoveFromSnapshot, onFinalizeBase, onDeleteSnapshot, onFetchIngredients, onBack }) {
  const [tab, setTab] = useState("current");
  const [editMode, setEditMode] = useState(false); // draft edit mode on finalized routine
  const [showForm, setShowForm] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [chooseCat, setChooseCat] = useState(false);
  const [isEditingProd, setIsEditingProd] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [draftChanges, setDraftChanges] = useState(null); // {added:[], removed:[], edited:[]} tracked during edit mode
  const [unsavedWarning, setUnsavedWarning] = useState(false);
  const [pendingNav, setPendingNav] = useState(null); // callback to run after discard/save

  const draftSnap    = snapshots.find(s=>!s.ended_at && s.is_base);
  const currentSnap  = snapshots.find(s=>!s.ended_at && !s.is_base);
  const activeSnap   = draftSnap || currentSnap;
  const isDraft      = !!draftSnap || editMode;
  const pastSnaps    = snapshots.filter(s=>s.ended_at).sort((a,b)=>b.started_at.localeCompare(a.started_at));

  const snapProducts = activeSnap
    ? activeSnap.products.map(sp=>({ snapProdId:sp.id, ...products.find(p=>p.id===sp.product_id) })).filter(p=>p&&p.id)
    : [];
  const skinProds = snapProducts.filter(p=>p.category==="skin");
  const hairProds = snapProducts.filter(p=>p.category==="hair");
  const txProds   = snapProducts.filter(p=>p.category==="treatment");

  const blank = (cat) => ({ id:crypto.randomUUID(), name:"", brand:"", category:cat, image:"", link:"", notes:"", tags:[], frequency:"" });

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
    setEditMode(true);
    setDraftChanges({added:[], removed:[], edited:[]});
  };

  const discardChanges = () => {
    setEditMode(false);
    setDraftChanges(null);
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
    setEditProd({...prod});
    setIsEditingProd(true);
    setShowForm(true);
    setChooseCat(false);
  };

  const save = async (prodData) => {
    const data = prodData || editProd;
    if (!data.name.trim()) return;
    await onSaveProduct(data);
    if (!isEditingProd) {
      if (activeSnap) {
        if (!activeSnap.products.find(p=>p.product_id===data.id)) {
          await onAddToSnapshot(activeSnap.id, data.id);
          if (draftChanges) setDraftChanges(prev=>({...prev, added:[...prev.added, data.name]}));
        }
      } else {
        const newSnapId = await onOpenSnapshot(true);
        if (newSnapId) await onAddToSnapshot(newSnapId, data.id);
      }
    } else {
      if (draftChanges) setDraftChanges(prev=>({...prev, edited:[...prev.edited, data.name]}));
    }
    setShowForm(false); setEditProd(null); setIsEditingProd(false);
  };

  const removeProduct = async (snapProdId, prodName) => {
    if (!activeSnap) return;
    await onRemoveFromSnapshot(activeSnap.id, snapProdId);
    if (draftChanges) setDraftChanges(prev=>({...prev, removed:[...prev.removed, prodName]}));
  };

  const doFinalize = async () => {
    setConfirmFinalize(false);
    if (draftSnap) {
      // First time finalize
      await onFinalizeBase(draftSnap.id);
    } else if (editMode && currentSnap) {
      // Re-finalize after edit
      const productChanges = (draftChanges?.added?.length||0) + (draftChanges?.removed?.length||0);
      if (productChanges > 0) {
        // Products changed — close current snapshot, open new one with current products
        const newSnapId = await onOpenSnapshot(false);
        if (newSnapId) {
          for (const sp of activeSnap.products) {
            await onAddToSnapshot(newSnapId, sp.product_id);
          }
        }
        // Notify
        const parts = [];
        if (draftChanges.added.length) parts.push(`Added: ${draftChanges.added.join(", ")}`);
        if (draftChanges.removed.length) parts.push(`Removed: ${draftChanges.removed.join(", ")}`);
        alert("New snapshot created ✓\n\n" + parts.join("\n") + "\n\nYour previous routine has been saved to Snapshot History.");
      }
      // Edits only (link/frequency/notes) — no new snapshot, already saved
    }
    setEditMode(false);
    setDraftChanges(null);
  };

  const ProductCard = ({p}) => (
    <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:14,padding:"12px 14px",marginBottom:8,display:"flex",gap:12,alignItems:"flex-start"}}>
      {p.image
        ?<img src={p.image} alt="" style={{width:46,height:46,objectFit:"cover",borderRadius:10,flexShrink:0}}/>
        :<div style={{width:46,height:46,borderRadius:10,background:"#f0e0d4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",flexShrink:0}}>{p.category==="skin"?"🌿":p.category==="treatment"?"💉":"✨"}</div>
      }
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:".88rem",fontWeight:500,color:"#3a2e27"}}>{p.name}</div>
        {p.brand&&<div style={{fontSize:".72rem",color:"#a08070",marginTop:1}}>{p.brand}{p.frequency&&<span style={{marginLeft:6,background:"#f0e8f4",borderRadius:8,padding:"1px 7px",fontSize:".68rem",color:"#7a6a8a"}}>{p.frequency}</span>}</div>}
        {p.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>{p.tags.map(t=><span key={t} style={{fontSize:".66rem",background:"#f7ece4",border:"1px solid #e8d8cc",borderRadius:20,padding:"2px 7px",color:"#8a6858"}}>{t}</span>)}</div>}
        {p.notes&&<div style={{fontSize:".72rem",color:"#a08070",marginTop:4,fontStyle:"italic"}}>{p.notes}</div>}
        {isDraft&&<div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
          {p.link&&<button onClick={()=>window.open(p.link,"_blank")} style={{background:"#b07a5e",border:"none",borderRadius:8,padding:"4px 10px",color:"#fff",cursor:"pointer",fontSize:".72rem",fontFamily:"'DM Sans',sans-serif"}}>Buy Now</button>}
          <button className="ghost-btn" style={{fontSize:".72rem",padding:"3px 8px"}} onClick={()=>openEditForm(p)}>Edit</button>
          <button className="ghost-btn" style={{fontSize:".72rem",padding:"3px 8px",color:"#c07060"}} onClick={()=>removeProduct(p.snapProdId, p.name)}>Remove</button>
        </div>}
        {!isDraft&&p.link&&<div style={{marginTop:8}}>
          <button onClick={()=>window.open(p.link,"_blank")} style={{background:"#b07a5e",border:"none",borderRadius:8,padding:"4px 10px",color:"#fff",cursor:"pointer",fontSize:".72rem",fontFamily:"'DM Sans',sans-serif"}}>Buy Now</button>
        </div>}
      </div>
    </div>
  );

  const SnapCard = ({snap}) => { // uses onDeleteSnapshot from closure
    const [open, setOpen] = useState(false);
    const [snapAnalysis, setSnapAnalysis] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const prods = snap.products.map(sp=>products.find(p=>p.id===sp.product_id)).filter(Boolean);
    const skinP=prods.filter(p=>p.category==="skin");
    const hairP=prods.filter(p=>p.category==="hair");
    const txP=prods.filter(p=>p.category==="treatment");
    const startLabel = new Date(snap.started_at+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
    const endLabel = snap.ended_at ? new Date(snap.ended_at+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "Present";
    const MiniCard = ({p,emoji}) => (
      <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:14,padding:"10px 14px",marginBottom:6,display:"flex",gap:10,alignItems:"center"}}>
        {p.image?<img src={p.image} alt="" style={{width:36,height:36,objectFit:"cover",borderRadius:8,flexShrink:0}}/>:<div style={{width:36,height:36,borderRadius:8,background:"#f0e0d4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>{emoji}</div>}
        <div><div style={{fontSize:".84rem",fontWeight:500,color:"#3a2e27"}}>{p.name}</div>{p.brand&&<div style={{fontSize:".7rem",color:"#a08070"}}>{p.brand}</div>}</div>
      </div>
    );
    return (
      <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:16,padding:"16px 18px",marginBottom:12,cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1rem",fontStyle:"italic",color:"#5a3a27"}}>{startLabel} — {endLabel}</div>
            <div style={{fontSize:".72rem",color:"#a08070",marginTop:3}}>{prods.length} product{prods.length!==1?"s":""} · {skinP.length} skin · {hairP.length} hair{txP.length>0?` · ${txP.length} treatment`:""}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={e=>{e.stopPropagation();setSnapAnalysis(v=>!v);}} style={{background:"none",border:"1px solid #e8d8cc",borderRadius:8,padding:"4px 10px",color:"#a08070",fontSize:".7rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              {snapAnalysis?"Close":"Analyze my routine"}
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
        {open&&<div style={{marginTop:14,borderTop:"1px solid #f0e0d4",paddingTop:12}} onClick={e=>e.stopPropagation()}>
          {skinP.length>0&&<><div style={{fontSize:".68rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:8}}>🌿 Skin</div>{skinP.map(p=><MiniCard key={p.id} p={p} emoji="🌿"/>)}</>}
          {hairP.length>0&&<><div style={{fontSize:".68rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:8,marginTop:12}}>✨ Hair</div>{hairP.map(p=><MiniCard key={p.id} p={p} emoji="✨"/>)}</>}
          {txP.length>0&&<><div style={{fontSize:".68rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:8,marginTop:12}}>💉 Treatments</div>{txP.map(p=><MiniCard key={p.id} p={p} emoji="💉"/>)}</>}
        </div>}
      </div>
    );
  };

  // ProductForm is defined outside MyProductsPage to prevent focus loss on re-render

  return (
    <div className="app">
      <div className="header" style={{position:"relative"}}>
        <button onClick={()=>tryNavigateAway(onBack)} style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#b07a5e",fontSize:"1.2rem",padding:"8px"}}>←</button>
        <div className="header-title">My <span>Products</span></div>
        <div className="header-sub">{products.length} in library</div>
      </div>

      <div style={{display:"flex",gap:0,marginBottom:20,borderRadius:12,overflow:"hidden",border:"1.5px solid #e8d8cc"}}>
        {[["current","Current Routine"],["history","Snapshot History"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)}
            style={{flex:1,padding:"10px",fontSize:".78rem",cursor:"pointer",border:"none",fontFamily:"'DM Sans',sans-serif",
              background:tab===v?"#b07a5e":"#fff8f3",color:tab===v?"#fff":"#a08070",transition:"all .15s"}}>
            {l}
          </button>
        ))}
      </div>

      {tab==="current"&&(
        <>
          {/* Empty state */}
          {snapProducts.length===0&&!showForm&&!chooseCat&&!isDraft&&(
            <div style={{textAlign:"center",padding:"48px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>No products in your current routine yet</div>
          )}

          {/* THE BIG CARD — wraps everything */}
          {(snapProducts.length>0||isDraft)&&(
            <div style={{background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:20,padding:"18px",marginBottom:16}}>

              {/* Card header: date + action buttons top right */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  {activeSnap&&(
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.05rem",fontStyle:"italic",color:"#5a3a27"}}>
                      {new Date(activeSnap.started_at+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})} — Present
                    </div>
                  )}
                  {activeSnap&&<div style={{fontSize:".7rem",color:"#a08070",marginTop:3}}>{snapProducts.length} product{snapProducts.length!==1?"s":""}{skinProds.length>0?` · ${skinProds.length} skin`:""}{ hairProds.length>0?` · ${hairProds.length} hair`:""}{ txProds.length>0?` · ${txProds.length} treatment`:""}</div>}
                  {isDraft&&draftSnap&&<div style={{marginTop:4,fontSize:".72rem",fontWeight:600,color:"#c07a28"}}>📋 Draft</div>}
                  {isDraft&&!draftSnap&&<div style={{marginTop:4,fontSize:".72rem",fontWeight:600,color:"#7a8a5a"}}>✏️ Editing</div>}
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0,marginLeft:10}}>
                  {!isDraft&&<button onClick={()=>setShowAnalysis(v=>!v)}
                    style={{background:"#3a2e27",border:"none",borderRadius:9,padding:"6px 12px",color:"#f7ece4",fontSize:".72rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,whiteSpace:"nowrap"}}>
                    {showAnalysis?"Close":"Analyze My Routine"}
                  </button>}
                  {!isDraft&&<button onClick={enterEditMode}
                    style={{background:"none",border:"1.5px solid #e8d8cc",borderRadius:9,padding:"6px 10px",color:"#a08070",fontSize:".72rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
                    Something changed?
                  </button>}
                  {isDraft&&<button onClick={discardChanges}
                    style={{background:"none",border:"1.5px solid #e8d8cc",borderRadius:9,padding:"6px 12px",color:"#a08070",fontSize:".72rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
                    Cancel
                  </button>}
                  {isDraft&&<button onClick={()=>setConfirmFinalize(true)}
                    style={{background:"#b07a5e",border:"none",borderRadius:9,padding:"6px 14px",color:"#fff",fontSize:".76rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500,whiteSpace:"nowrap"}}>
                    Finalize
                  </button>}
                </div>
              </div>

              {/* Analysis panel — inside the card */}
              {showAnalysis&&activeSnap&&!isDraft&&(
                <div style={{marginBottom:16,borderBottom:"1px solid #f0e0d4",paddingBottom:16}}>
                  <RoutineAnalysis products={products} snapProducts={activeSnap.products} entries={entries} dateRange={{start:activeSnap.started_at, end:null}} isCurrent={true} onClose={()=>setShowAnalysis(false)} onFetchIngredients={onFetchIngredients}/>
                </div>
              )}

              {/* Add product form — inside the card */}
              {showForm&&editProd&&<ProductForm key={editProd.id} initialData={editProd} isEditingProd={isEditingProd} onSave={save} onClose={handleCloseForm}/>}

              {/* Add product button — always visible in draft mode */}
              {!showForm&&isDraft&&!chooseCat&&(
                <button onClick={()=>setChooseCat(true)}
                  style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"1.5px dashed #e8d8cc",borderRadius:12,padding:"10px 16px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",color:"#a08070",fontSize:".82rem",width:"100%",marginBottom:12}}>
                  <span style={{fontSize:"1.1rem"}}>+</span> Add a product
                </button>
              )}
              {/* Category picker / form */}
              {!showForm&&isDraft&&(
                chooseCat?(
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
                ):null
              )}

              {/* Product lists — inside the card */}
              {skinProds.length>0&&(
                <div style={{marginBottom:skinProds.length&&(hairProds.length||txProds.length)?16:0}}>
                  <div style={{fontSize:".68rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:8}}>🌿 Skin</div>
                  {skinProds.map(p=><ProductCard key={p.id} p={p}/>)}
                </div>
              )}
              {hairProds.length>0&&(
                <div style={{marginBottom:hairProds.length&&txProds.length?16:0}}>
                  <div style={{fontSize:".68rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:8}}>✨ Hair</div>
                  {hairProds.map(p=><ProductCard key={p.id} p={p}/>)}
                </div>
              )}
              {txProds.length>0&&(
                <div>
                  <div style={{fontSize:".68rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:8}}>💉 Treatments</div>
                  {txProds.map(p=><ProductCard key={p.id} p={p}/>)}
                </div>
              )}
            </div>
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
          {pastSnaps.length===0&&!showCompare&&<div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>No past snapshots yet — they appear here when your routine changes</div>}
          {!showCompare&&pastSnaps.map(snap=><SnapCard key={snap.id} snap={snap} onDeleteSnapshot={onDeleteSnapshot}/>)}
        </>
      )}

      {/* Finalize confirmation */}
      {confirmFinalize&&(
        <div className="overlay" onClick={()=>setConfirmFinalize(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title" style={{marginBottom:12}}>Finalize Your Routine?</div>
            <div style={{fontSize:".84rem",color:"#6a5048",lineHeight:1.7,marginBottom:20}}>
              {draftSnap
                ? "Once finalized, your routine becomes a permanent snapshot. Any future changes will automatically create a new snapshot so your history stays accurate."
                : `This will save your changes${(draftChanges?.added?.length||0)+(draftChanges?.removed?.length||0)>0?" and create a new snapshot":""}.${(draftChanges?.added?.length||0)+(draftChanges?.removed?.length||0)>0?" Your current routine will be preserved in Snapshot History.":""}`
              }
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmFinalize(false)} className="ghost-btn" style={{flex:1}}>Cancel</button>
              <button onClick={doFinalize}
                style={{flex:1,background:"#b07a5e",border:"none",borderRadius:12,padding:"12px",color:"#fff",fontSize:".84rem",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>
                Yes, Finalize
              </button>
            </div>
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

function MiniCal({ selectedDates, onToggleDate, rangeStart, onRangeStart, onRangeEnd }) {
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
          return (
            <div key={d} onClick={()=>handleClick(d)}
              onMouseEnter={()=>rangeMode&&setHov(d)}
              onMouseLeave={()=>setHov(null)}
              style={{aspectRatio:1,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",fontSize:".78rem",cursor:"pointer",
                background:sel?"#b07a5e":isPending?"#c08870":prev?"#f7e8de":"transparent",
                color:sel||isPending?"#fff":"#3a2e27",fontWeight:sel?600:400,
                border:d===today&&!sel?"1.5px solid #b07a5e":"none",
                boxShadow:isPending?"0 0 0 2px #fff,0 0 0 4px #b07a5e":"none"}}>
              {parse(d).getDate()}
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

function PlanModal({ allItems, skinItems: skinItemsProp, hairItems: hairItemsProp, schedules, treatments, onSave, onSaveMany, onDelete, onSaveTreatment, onDeleteTreatment, onClose, initialPlan, initialTreatment }) {
  const [screen, setScreen]=useState(initialPlan?"editPlan":initialTreatment?"editTreatment":"chooseType"); // chooseType | editPlan | editTreatment
  const [editing, setEditing]=useState(initialPlan?{...initialPlan,itemIds:initialPlan.itemIds||[initialPlan.itemId].filter(Boolean),dates:initialPlan.dates||[],startDate:initialPlan.startDate||fmt(new Date())}:{id:uid(),itemIds:[],days:[],dates:[],startDate:fmt(new Date()),reminder:false,time:"08:00",location:""});
  const [editTx, setEditTx]=useState(initialTreatment?{...initialTreatment}:{id:uid(),name:"",type:"skin",dates:[]});
  const [showItemPick, setShowItemPick]=useState(false);
  const [calRangeStart, setCalRangeStart]=useState(null);

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
  const saveTx=()=>{
    if(!editTx.name.trim()||!editTx.dates.length) return;
    onSaveTreatment(editTx); setEditTx(null); setScreen("list");
  };

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
            <div className="modal-title">{schedules.find(s=>s.id===editing.id)?"Edit Plan":"New Plan"}</div>
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
              <div style={{marginBottom:14,display:"flex",flexDirection:"column",gap:6}}>
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
            </>
          )}
          {editing._category==="treatment"&&<>
            <div className="modal-sub" style={{marginBottom:6}}>📍 Location <span style={{fontWeight:400,color:"#b8a090",fontSize:".78rem"}}>(optional)</span></div>
            <input className="ifield" style={{width:"100%",marginBottom:14}} placeholder="e.g. Glow Clinic, Miami"
              value={editing.location||""} onChange={e=>setEditing(ed=>({...ed,location:e.target.value}))}/>
          </>}
          <div className="modal-sub">Start date</div>
          <input type="date" className="time-input" style={{width:"100%",marginBottom:14}}
            value={editing.startDate||fmt(new Date())}
            onChange={e=>setEditing(ed=>({...ed,startDate:e.target.value}))}/>
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
          <div className="modal-sub" style={{marginBottom:8}}>Every <span style={{fontWeight:400,color:"#b8a090",fontSize:".78rem"}}>(optional — leave blank for one-off)</span></div>
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
    const canSave=editTx.name.trim()&&editTx.dates.length>0;
    return (
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
        <div className="modal">
          <div className="modal-top">
            <div className="modal-title">{editTx.name?"Edit Treatment":"New Treatment"}</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {treatments.find(t=>t.id===editTx.id)&&<button className="del-btn" onClick={()=>{onDeleteTreatment(editTx.id);onClose();}}>Delete</button>}
              <button className="modal-x" onClick={onClose}>×</button>
            </div>
          </div>
          <div className="modal-sub">Treatment name</div>
          <input className="ifield" style={{width:"100%",marginBottom:14}} placeholder="e.g. Facial, Microneedling…"
            value={editTx.name} onChange={e=>setEditTx(t=>({...t,name:e.target.value}))} autoFocus/>
          <div className="modal-sub" style={{marginBottom:6}}>📍 Location <span style={{fontWeight:400,color:"#b8a090",fontSize:".78rem"}}>(optional)</span></div>
          <input className="ifield" style={{width:"100%",marginBottom:14}} placeholder="e.g. Glow Clinic, Miami"
            value={editTx.location||""} onChange={e=>setEditTx(t=>({...t,location:e.target.value}))}/>
          <div className="modal-sub">Skin or Hair</div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {["skin","hair"].map(tp=>(
              <button key={tp} className={`dow-chip ${editTx.type===tp?"on":""}`} style={{flex:1,textAlign:"center"}}
                onClick={()=>setEditTx(t=>({...t,type:tp}))}>
                {tp==="skin"?"🌿 Skin":"✨ Hair"}
              </button>
            ))}
          </div>
          <div className="modal-sub">Scheduled date(s)</div>
          <MiniCal
            selectedDates={editTx.dates}
            onToggleDate={d=>setEditTx(t=>({...t,dates:t.dates.includes(d)?t.dates.filter(x=>x!==d):[...t.dates,d]}))}
            rangeStart={calRangeStart}
            onRangeStart={d=>setCalRangeStart(d)}
            onRangeEnd={range=>{ setEditTx(t=>({...t,dates:[...new Set([...t.dates,...range])]})); setCalRangeStart(null); }}
          />

          <button className="save-btn" onClick={saveTx} disabled={!canSave} style={{opacity:canSave?1:.4}}>Schedule Treatment</button>
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
  const [view,        setView]        = useState("log");
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
  const [userName,    setUserName]    = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [hairLengths,   setHairLengths]   = useState({});
  const [purchases,     setPurchases]     = useState([]);
  const [products,      setProducts]      = useState([]);
  const [wishlist,      setWishlist]      = useState([]);
  const [snapshots,     setSnapshots]     = useState([]);
  const [sideMenu,      setSideMenu]      = useState(false);
  const [pageView,      setPageView]      = useState(null); // null=main, "purchases", "account", "products", "wishlist"
  const [selectedPlan,  setSelectedPlan]  = useState(null); // plan/treatment being viewed
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null); // {message, onConfirm}
  const [prefillPurchase, setPrefillPurchase] = useState(null); // when moving wishlist item to purchases
  const [treatments,    setTreatments]    = useState([]); // [{id, name, type(skin/hair), dates:[], completedDates:[]}]

  // Load all data from Supabase on mount
  useEffect(()=>{
    (async()=>{
      if(!user) return;
      try {
        // Load entries
        const { data: entryRows } = await supabase.from("entries").select("*").eq("user_id", user.id);
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
        // Load routines
        const { data: routineRows } = await supabase.from("routines").select("*").eq("user_id", user.id);
        if (routineRows) {
          const sk = routineRows.find(r=>r.type==="skin");
          const ha = routineRows.find(r=>r.type==="hair");
          if (sk) setSkinR(sk.items);
          if (ha) setHairR(ha.items);
        }
        // Load schedules
        const { data: schedRows, error: schedErr } = await supabase.from("schedules").select("*").eq("user_id", user.id);
        console.log("LOAD schedules:", schedRows, "error:", schedErr);
        if (schedRows) setSchedules(schedRows.map(r=>({ id:r.id, itemId:r.item_id, days:r.days||[], dates:r.dates||[], startDate:r.start_date||null, reminder:r.reminder, time:r.time, location:r.location||'' })));
        // Load freq settings
        const { data: freqRows } = await supabase.from("freq_settings").select("*").eq("user_id", user.id).single();
        if (freqRows) { setFreqTracked(freqRows.tracked||[]); setFreqPeriod(freqRows.period||"year"); }
        // Load hair lengths
        const { data: hlRows } = await supabase.from("hair_lengths").select("*").eq("user_id", user.id);
        if (hlRows) {
          const map = {};
          hlRows.forEach(r => { map[r.month] = r.length_cm; });
          setHairLengths(map);
        }
        // Load purchases
        const { data: purchRows } = await supabase.from("purchases").select("*").eq("user_id", user.id).order("date", {ascending:false});
        if (purchRows) setPurchases(purchRows.map(r=>({ id:r.id, name:r.name, brand:r.brand||"", category:r.category, price:r.price||0, quantity:r.quantity||1, date:r.date, notes:r.notes||"", tags:r.tags||[], image:r.image||'', link:r.link||'', frequency:r.frequency||'' })));
        // Load treatments
        const { data: txRows } = await supabase.from("treatments").select("*").eq("user_id", user.id);
        if (txRows) setTreatments(txRows.map(r=>({ id:r.id, name:r.name, type:r.type, dates:r.dates||[], completedDates:r.completed_dates||[], location:r.location||'' })));
        // Load products library
        const { data: prodRows } = await supabase.from("products").select("*").eq("user_id", user.id).order("created_at", {ascending:false});
        if (prodRows) setProducts(prodRows.map(r=>({ id:r.id, name:r.name, brand:r.brand||"", category:r.category||"skin", image:r.image||"", link:r.link||"", notes:r.notes||"", tags:r.tags||[], frequency:r.frequency||"", global_product_id:r.global_product_id||null, ingredients:r.ingredients||[] })));
        // Load wishlist
        const { data: wishRows } = await supabase.from("wishlist").select("*").eq("user_id", user.id).order("created_at", {ascending:false});
        if (wishRows) setWishlist(wishRows.map(r=>({ id:r.id, product_id:r.product_id||null, name:r.name||"", brand:r.brand||"", category:r.category||"skin", image:r.image||"", link:r.link||"", notes:r.notes||"", tags:r.tags||[], priority:r.priority||0 })));
        // Load snapshots
        const { data: snapRows } = await supabase.from("snapshots").select("*, snapshot_products(*)").eq("user_id", user.id).order("started_at", {ascending:false});
        if (snapRows) setSnapshots(snapRows.map(r=>({ id:r.id, label:r.label||"", started_at:r.started_at, ended_at:r.ended_at||null, is_base:r.is_base||false, products:r.snapshot_products||[] })));
        // Load user name from profile metadata
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        const name = freshUser?.user_metadata?.display_name || "";
        if (name) setUserName(name);
        else setShowNamePrompt(true);
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
        dates: tx.dates, completed_dates: tx.completedDates, location: tx.location||'', updated_at: new Date().toISOString()
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
        await supabase.from("schedules").delete().eq("user_id", user.id).not("id", "in", `(${ids.map(id=>`"${id}"`).join(",")})`);
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
    const row = { id:p.id, user_id:user.id, name:p.name, brand:p.brand||"", category:p.category||"skin", image:p.image||"", link:p.link||"", notes:p.notes||"", tags:p.tags||[], frequency:p.frequency||"", global_product_id:p.global_product_id||null, ingredients:p.ingredients||[] };
    await supabase.from("products").upsert(row, {onConflict:"id"});
    setProducts(prev => { const idx=prev.findIndex(x=>x.id===p.id); return idx>=0?prev.map(x=>x.id===p.id?p:x):[p,...prev]; });
    // Background ingredient lookup — fire and forget
    if (!p.ingredients?.length && p.name) fetchIngredients(p);
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
  const deleteProduct = async (id) => {
    await supabase.from("products").delete().eq("id",id).eq("user_id",user.id);
    setProducts(prev=>prev.filter(p=>p.id!==id));
    showT("Product removed");
  };
  const confirmDeleteProduct = (id) => setConfirmDelete({message:"Remove this product from your library?", onConfirm:()=>deleteProduct(id)});

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
    await supabase.from("snapshot_products").delete().eq("snapshot_id", snapId);
    await supabase.from("snapshots").delete().eq("id", snapId);
    setSnapshots(prev=>prev.filter(s=>s.id!==snapId));
    showT("Snapshot deleted");
  };
  const addProductToSnapshot = async (snapId, productId) => {
    const id = crypto.randomUUID();
    await supabase.from("snapshot_products").insert({id, snapshot_id:snapId, product_id:productId});
    setSnapshots(prev=>prev.map(s=>s.id===snapId?{...s,products:[...s.products,{id,snapshot_id:snapId,product_id:productId}]}:s));
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
    const already = tx.completedDates.includes(date);
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

  if (pageView==="purchases") return (
    <div><style>{STYLES}</style><PurchasesPage purchases={purchases} prefill={prefillPurchase} onClearPrefill={()=>setPrefillPurchase(null)} onSave={savePurchase} onDelete={confirmDeletePurchase} onBack={()=>setPageView(null)}/></div>
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
      onRemoveFromSnapshot={removeProductFromSnapshot}
      onFinalizeBase={finalizeBase}
      onDeleteSnapshot={deleteSnapshot}
      onFetchIngredients={fetchIngredients}
      onBack={()=>setPageView(null)}/></div>
  );
  if (pageView==="wishlist") return (
    <div><style>{STYLES}</style><WishlistPage
      wishlist={wishlist}
      products={products}
      onSave={saveWishlistItem}
      onDelete={confirmDeleteWishlistItem}
      onMoveToCart={async(item)=>{ const prefill=await moveWishlistToPurchase(item); setPrefillPurchase(prefill); setPageView("purchases"); }}
      onBack={()=>setPageView(null)}/></div>
  );
  if (pageView==="account") return (
    <div className="app">
      <style>{STYLES}</style>
      <div className="header" style={{position:"relative"}}>
        <button onClick={()=>setPageView(null)} style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#b07a5e",fontSize:"1.2rem",padding:"8px"}}>{"← Back"}</button>
        <div className="header-title">My <span>Account</span></div>
      </div>
      <div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>Coming soon</div>
    </div>
  );

  return (
    <div>
      <style>{STYLES}</style>
      <div className="app">
        <div className="header" style={{position:"relative"}}>
          <div className="header-title" style={{cursor:"pointer"}} onClick={()=>{setView("log");setPageView(null);}}>{userName ? userName+"'s" : "My"} <span>Ritual</span></div>
          <div className="header-sub">Your Beauty HQ</div>
          <button className="hamburger-btn" onClick={()=>setSideMenu(true)}>
            <span/><span/><span/>
          </button>
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
                          {s.location&&<span> · <span style={{cursor:"pointer",color:"#b07a5e",textDecoration:"underline"}} onClick={e=>{e.stopPropagation();window.open(`https://www.google.com/maps/search/${encodeURIComponent(s.location)}`,'_blank');}}>📍 {s.location}</span></span>}
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
                          {tx.dates.length} date{tx.dates.length!==1?"s":""} · {tx.completedDates?.length||0} done{tx.location?<span> · <span style={{cursor:"pointer",color:"#b07a5e",textDecoration:"underline"}} onClick={e=>{e.stopPropagation();window.open(`https://www.google.com/maps/search/${encodeURIComponent(tx.location)}`,"_blank");}}>📍 {tx.location}</span></span>:null}
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
        onClose={()=>setSelectedPlan(null)}
        initialPlan={selectedPlan.type==="plan"?selectedPlan.data:null}
        initialTreatment={selectedPlan.type==="treatment"?selectedPlan.data:null}/>}
      {modal==="plan"&&<PlanModal allItems={allItems} skinItems={skinR} hairItems={hairR} schedules={schedules} treatments={treatments} onSave={saveSched} onSaveMany={saveSchedMany} onDelete={deleteSched} onSaveTreatment={saveTreatment} onDeleteTreatment={deleteTreatment} onClose={()=>setModal(null)}/>}
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

      {sideMenu&&<div className="side-menu-overlay" onClick={()=>setSideMenu(false)}/>}
      <div className={`side-menu ${sideMenu?"open":""}`}>
        <div className="side-menu-title">Menu</div>
        <button className="side-menu-item" onClick={()=>{setPageView("account");setSideMenu(false);}}>
          <span>👤</span> My Account
        </button>
        <hr style={{border:"none",borderTop:"1px solid #f0e0d4",margin:"8px 0"}}/>
        <button className="side-menu-item" onClick={()=>{setPageView("products");setSideMenu(false);}}>
          <span>💄</span> My Products
        </button>
        <button className="side-menu-item" onClick={()=>{setPageView("wishlist");setSideMenu(false);}}>
          <span>💝</span> Wishlist
        </button>
        <button className="side-menu-item" onClick={()=>{setPageView("purchases");setSideMenu(false);}}>
          <span>💳</span> Purchases
        </button>
        <hr style={{border:"none",borderTop:"1px solid #f0e0d4",margin:"16px 0"}}/>
        <button className="side-menu-item" style={{color:"#c0a898"}} onClick={()=>supabase.auth.signOut()}>
          <span>🚪</span> Sign Out
        </button>
      </div>
    </div>
  );
}
