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
const uid      = () => Math.random().toString(36).slice(2,9);
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

function PhotoNotes({ notes, photos, onNotesChange, onPhotosChange }) {
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
      {photos.length>0&&(
        <div className="photo-thumbs">
          {photos.map(p=>(
            <div key={p.id} className="photo-thumb">
              <img src={p.src} alt={p.name}/>
              <button className="photo-remove" onClick={()=>removePhoto(p.id)}>×</button>
            </div>
          ))}
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
  // For range selection preview
  const effEnd=rangeStart&&hov&&hov!==rangeStart?hov:null;
  const inPreview=d=>{
    if(!rangeStart||!effEnd||!d) return false;
    const [lo,hi]=rangeStart<effEnd?[rangeStart,effEnd]:[effEnd,rangeStart];
    return d>lo&&d<hi;
  };
  const handleClick=d=>{
    // If already individually selected, deselect it
    if(selectedDates.includes(d)&&!rangeStart){
      onToggleDate(d); return;
    }
    if(!rangeStart){onRangeStart(d);}
    else if(d===rangeStart){onRangeStart(null);}
    else{
      const [lo,hi]=d>rangeStart?[rangeStart,d]:[d,rangeStart];
      const range=[];
      const cur=parse(lo);
      const end=parse(hi);
      while(cur<=end){range.push(fmt(new Date(cur)));cur.setDate(cur.getDate()+1);}
      onRangeEnd(range);
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
          const isRS=d===rangeStart;
          const prev=inPreview(d);
          return (
            <div key={d} onClick={()=>handleClick(d)}
              onMouseEnter={()=>rangeStart&&setHov(d)}
              onMouseLeave={()=>setHov(null)}
              style={{aspectRatio:1,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",fontSize:".78rem",cursor:"pointer",
                background:sel?"#b07a5e":isRS?"#e8b090":prev?"#f7e8de":"transparent",
                color:sel?"#fff":isRS?"#fff":"#3a2e27",fontWeight:sel?600:400,
                border:d===today?"1.5px solid #b07a5e":"none"}}>
              {parse(d).getDate()}
            </div>
          );
        })}
      </div>
      {selectedDates.length>0&&<div style={{padding:"6px 14px 10px",fontSize:".72rem",color:"#b07a5e"}}>
        {selectedDates.length} date{selectedDates.length!==1?"s":""} selected
      </div>}
    </div>
  );
}

function PlanModal({ allItems, schedules, treatments, onSave, onDelete, onSaveTreatment, onDeleteTreatment, onClose }) {
  const [screen, setScreen]=useState("list"); // list | editPlan | editTreatment
  const [editing, setEditing]=useState(null);
  const [editTx, setEditTx]=useState(null);
  const [showItemPick, setShowItemPick]=useState(false);
  const [calRangeStart, setCalRangeStart]=useState(null);

  const startNewPlan=()=>{ setEditing({id:uid(),itemId:"",days:[],dates:[],reminder:false,time:"08:00"}); setScreen("editPlan"); };
  const startEditPlan=s=>{ setEditing({...s,dates:s.dates||[]}); setScreen("editPlan"); };
  const startNewTx=()=>{ setEditTx({id:uid(),name:"",type:"skin",dates:[]}); setScreen("editTreatment"); };
  const startEditTx=t=>{ setEditTx({...t}); setScreen("editTreatment"); };

  const toggleDay=d=>setEditing(e=>({...e,days:e.days.includes(d)?e.days.filter(x=>x!==d):[...e.days,d]}));
  const getItem=id=>allItems.find(x=>x.id===id);

  const savePlan=()=>{
    if(!editing.itemId||(editing.days.length===0&&editing.dates.length===0)) return;
    onSave(editing); setEditing(null); setScreen("list");
  };
  const saveTx=()=>{
    if(!editTx.name.trim()||!editTx.dates.length) return;
    onSaveTreatment(editTx); setEditTx(null); setScreen("list");
  };

  if(screen==="editPlan"&&editing){
    const sel=getItem(editing.itemId);
    const canSave=editing.itemId&&(editing.days.length>0||editing.dates.length>0);
    return (
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&setScreen("list")}>
        <div className="modal">
          <div className="modal-top">
            <div className="modal-title">{schedules.find(s=>s.id===editing.id)?"Edit":"New"} Plan</div>
            <button className="modal-x" onClick={()=>setScreen("list")}>×</button>
          </div>
          <div className="modal-sub">Step</div>
          <button style={{width:"100%",background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10,fontSize:".86rem",color:"#3a2e27",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}
            onClick={()=>setShowItemPick(p=>!p)}>
            {sel?<>{sel.emoji} {sel.label}</>:<span style={{color:"#c0a898",fontStyle:"italic"}}>Select a step…</span>}
          </button>
          {showItemPick&&<div style={{marginBottom:14,maxHeight:200,overflowY:"auto"}}>{allItems.map(it=>(
            <div key={it.id} className="m-item" style={{cursor:"pointer",marginBottom:6}}
              onClick={()=>{setEditing(e=>({...e,itemId:it.id}));setShowItemPick(false);}}>
              <span style={{fontSize:"1rem"}}>{it.emoji}</span>
              <span className="m-item-lbl">{it.label}</span>
            </div>
          ))}</div>}
          <div className="modal-sub">Specific dates (tap to select, tap two for range)</div>
          <MiniCal
            selectedDates={editing.dates||[]}
            onToggleDate={d=>setEditing(e=>({...e,dates:e.dates.includes(d)?e.dates.filter(x=>x!==d):[...e.dates,d]}))}
            rangeStart={calRangeStart}
            onRangeStart={d=>setCalRangeStart(d)}
            onRangeEnd={range=>{ setEditing(e=>({...e,dates:[...new Set([...(e.dates||[]),...range])]})); setCalRangeStart(null); }}
          />
          <div className="modal-sub">Repeat on (optional — leave blank for date-specific only)</div>
          <div className="dow-row">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=>{
              const dow=[1,2,3,4,5,6,0][i];
              return <button key={d} className={`dow-chip ${editing.days.includes(dow)?"on":""}`} onClick={()=>toggleDay(dow)}>{d}</button>;
            })}
          </div>
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
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&setScreen("list")}>
        <div className="modal">
          <div className="modal-top">
            <div className="modal-title">Plan a Treatment</div>
            <button className="modal-x" onClick={()=>setScreen("list")}>×</button>
          </div>
          <div className="modal-sub">Treatment name</div>
          <input className="ifield" style={{width:"100%",marginBottom:14}} placeholder="e.g. Facial, Microneedling…"
            value={editTx.name} onChange={e=>setEditTx(t=>({...t,name:e.target.value}))} autoFocus/>
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

  // List screen
  const getItem2=id=>allItems.find(x=>x.id===id);
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-top">
          <div className="modal-title">Plans</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        {schedules.length>0&&<>
          <div className="modal-sub" style={{marginBottom:8}}>Routine Plans</div>
          {schedules.map(s=>{
            const it=getItem2(s.itemId); if(!it) return null;
            const recurDays=(s.days||[]).map(d=>["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(", ");
            const dateCount=(s.dates||[]).length;
            return (
              <div key={s.id} className="sched-card" style={{marginBottom:8}}>
                <div className="sched-top">
                  <span style={{fontSize:"1rem"}}>{it.emoji}</span>
                  <div style={{flex:1}}>
                    <div className="sched-label">{it.label}</div>
                    <div style={{fontSize:".71rem",color:"#9a7050",marginTop:2}}>
                      {recurDays&&<span>{recurDays}</span>}
                      {recurDays&&dateCount>0&&<span> · </span>}
                      {dateCount>0&&<span>{dateCount} specific date{dateCount!==1?"s":""}</span>}
                    </div>
                  </div>
                  <button className="ghost-btn" style={{fontSize:".7rem",padding:"3px 9px"}} onClick={()=>startEditPlan(s)}>Edit</button>
                  <button className="del-btn" onClick={()=>onDelete(s.id)}>✕</button>
                </div>
                {s.reminder&&<div className="sched-reminder">🔔 at {s.time}</div>}
              </div>
            );
          })}
        </>}
        {treatments.length>0&&<>
          <div className="modal-sub" style={{marginTop:16,marginBottom:8}}>Treatments</div>
          {treatments.map(tx=>(
            <div key={tx.id} className="sched-card treatment-card" style={{marginBottom:8}}>
              <div className="sched-top">
                <span style={{fontSize:"1rem"}}>💉</span>
                <div style={{flex:1}}>
                  <div className="sched-label">{tx.name}</div>
                  <div style={{fontSize:".71rem",color:"#9a7050",marginTop:2}}>{tx.type==="skin"?"🌿 Skin":"✨ Hair"} · {tx.dates.length} date{tx.dates.length!==1?"s":""} · {tx.completedDates?.length||0} completed</div>
                </div>
                <button className="ghost-btn" style={{fontSize:".7rem",padding:"3px 9px"}} onClick={()=>startEditTx(tx)}>Edit</button>
                <button className="del-btn" onClick={()=>onDeleteTreatment(tx.id)}>✕</button>
              </div>
            </div>
          ))}
        </>}
        {!schedules.length&&!treatments.length&&<div style={{textAlign:"center",color:"#b09080",fontStyle:"italic",padding:"16px 0",fontSize:".86rem"}}>No plans yet</div>}
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <button className="add-sched-btn" style={{flex:1}} onClick={startNewPlan}>+ Add Plan</button>
          <button className="add-sched-btn" style={{flex:1,borderColor:"#e8a898",color:"#c07060"}} onClick={startNewTx}>💉 Treatment</button>
        </div>
      </div>
    </div>
  );
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
  const [hairLengths,   setHairLengths]   = useState({}); // { "2026-03": "12cm" }
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
        const { data: schedRows } = await supabase.from("schedules").select("*").eq("user_id", user.id);
        if (schedRows) setSchedules(schedRows.map(r=>({ id:r.id, itemId:r.item_id, days:r.days||[], dates:r.dates||[], reminder:r.reminder, time:r.time })));
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
        // Load treatments
        const { data: txRows } = await supabase.from("treatments").select("*").eq("user_id", user.id);
        if (txRows) setTreatments(txRows.map(r=>({ id:r.id, name:r.name, type:r.type, dates:r.dates||[], completedDates:r.completed_dates||[] })));
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
        dates: tx.dates, completed_dates: tx.completedDates, updated_at: new Date().toISOString()
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
      await supabase.from("schedules").delete().eq("user_id", user.id);
      if (newSchedules.length > 0) {
        await supabase.from("schedules").insert(newSchedules.map(s => ({
          id: s.id, user_id: user.id, item_id: s.itemId,
          days: s.days||[], dates: s.dates||[], reminder: s.reminder, time: s.time
        })));
      }
    } catch(e) { console.error("Schedule save error", e); }
  };

  const toggleItem=(date,type,id)=>{
    const e=getE(date); const cur=e[type]||[];
    setEntries(p=>({...p,[date]:{...e,[type]:cur.includes(id)?cur.filter(x=>x!==id):[...cur,id]}}));
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
  const deleteSched=async(id)=>{
    const newS = schedules.filter(s=>s.id!==id);
    setSchedules(newS);
    await persistSchedules(newS);
    showT("Plan removed");
  };
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
    setModal(null); setRangeStart(null); setRangeEnd(null);
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
    if(!e) return null;
    const dow=parse(d).getDay();
    // Check recurring plans
    const recurPlanned=schedules.filter(s=>s.days.includes(dow)).map(s=>s.itemId);
    // Check one-off/range plans for this specific date
    const oneOffPlanned=schedules.filter(s=>s.dates&&s.dates.includes(d)).map(s=>s.itemId);
    const plannedIds=[...new Set([...recurPlanned,...oneOffPlanned])];
    const hasTreatment=treatments.some(t=>t.dates.includes(d)&&t.completedDates.includes(d));
    let heart=null;
    if(plannedIds.length>0){
      const allChecked=plannedIds.every(id=>(e.skin||[]).includes(id)||(e.hair||[]).includes(id));
      if(allChecked){
        const isGlowing=e.skin_mood==="✨ Glowing"&&e.hair_mood==="✨ Glowing";
        heart=isGlowing?"heart-star":"heart";
      }
    }
    return {heart, hasTreatment};
  };

  const effEnd=rangeEnd||(rangeStart&&hoverDay?hoverDay:null);
  const inRange=d=>{ if(!rangeStart||!effEnd||!d) return false; const [lo,hi]=rangeStart<=effEnd?[rangeStart,effEnd]:[effEnd,rangeStart]; return d>lo&&d<hi; };
  const isRangeStart=d=>d===rangeStart;
  const isRangeEnd=d=>rangeEnd?d===rangeEnd:(rangeStart&&hoverDay&&d===hoverDay&&hoverDay!==rangeStart);

  const handleCalClick=d=>{
    if(rangeStart&&rangeEnd){
      // Reset after a completed range — start fresh
      setRangeStart(d); setRangeEnd(null); setSelectedDay(d);
    } else if(!rangeStart){
      // Nothing selected — select this day
      setRangeStart(d); setSelectedDay(d);
    } else if(d===rangeStart){
      // Tapped the already-selected day — deselect it (clear selection)
      setRangeStart(null); setSelectedDay(null);
    } else {
      // Second tap on a different day — open range modal
      const [lo,hi]=d>=rangeStart?[rangeStart,d]:[d,rangeStart];
      setRangeStart(lo); setRangeEnd(hi); setSelectedDay(lo);
      setModal("rangeApply");
    }
  };

  const freqRange=useCallback(()=>{
    const now=new Date();
    if(freqPeriod==="week"){ const d=new Date(now); d.setDate(now.getDate()-now.getDay()); return {start:fmt(d),label:"this week"}; }
    if(freqPeriod==="month"){ return {start:fmt(new Date(now.getFullYear(),now.getMonth(),1)),label:"this month"}; }
    return {start:fmt(new Date(now.getFullYear(),0,1)),label:"this year"};
  },[freqPeriod]);

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
  const visibleReminders=schedules.filter(s=>!dismissed.includes(s.id)&&((s.days&&s.days.includes(todayDow))||(s.dates&&s.dates.includes(activeDate))));
  const entry=getE(activeDate);
  const routines=activeTab==="skin"?skinR:hairR;
  const checked=activeTab==="skin"?entry.skin:entry.hair;
  const done=checked.filter(id=>routines.find(r=>r.id===id)).length;

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <div className="header">
          <div className="header-title">{userName ? <>{userName}'s</> : "My"} <span>Ritual</span></div>
          <div className="header-sub">Skin · Hair</div>
          <button onClick={()=>supabase.auth.signOut()} style={{marginTop:10,background:"none",border:"none",fontSize:".7rem",color:"#c0a898",cursor:"pointer",letterSpacing:".08em",textTransform:"uppercase",textDecoration:"underline",fontFamily:"'DM Sans',sans-serif"}}>Sign out</button>
        </div>

        <div className="top-tabs">
          {[["log","Log"],["history","History"],["plan","Plan"],["frequency","Stats"]].map(([v,l])=>(
            <button key={v} className={`top-tab ${view===v?"active":""}`} onClick={()=>setView(v)}>{l}</button>
          ))}
        </div>

        {view==="log"&&(
          <>
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
            <div style={{marginBottom:18}}>
              {(()=>{
                const todayPlanned=schedules.filter(s=>s.days.includes(todayDow)&&(activeTab==="skin"?skinR:hairR).find(r=>r.id===s.itemId));
                const plannedIds=todayPlanned.map(s=>s.itemId);
                const plannedDone=checked.filter(id=>plannedIds.includes(id)).length;
                const hasPlanned=plannedIds.length>0;
                return hasPlanned?(
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:".73rem",color:"#a08070",marginBottom:5}}>
                      <span>Planned for today</span>
                      <span style={{color:plannedDone===plannedIds.length?"#2d4a2d":"#a08070",fontWeight:plannedDone===plannedIds.length?600:400}}>{plannedDone} / {plannedIds.length} done{plannedDone===plannedIds.length?" ✓":""}</span>
                    </div>
                    <div className="prog-wrap"><div className="prog-bar" style={{width:`${(plannedDone/plannedIds.length)*100}%`,background:plannedDone===plannedIds.length?"#2d4a2d":"#b07a5e"}}/></div>
                  </>
                ):(
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:".73rem",color:"#a08070",marginBottom:5}}>
                      <span>{activeTab==="skin"?"Skin Routine":"Hair Routine"}</span>
                      <span>{done} / {routines.length} steps</span>
                    </div>
                    <div className="prog-wrap"><div className="prog-bar" style={{width:routines.length?`${(done/routines.length)*100}%`:"0%"}}/></div>
                  </>
                );
              })()}
            </div>
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
              onNotesChange={v=>setNotesVal(activeDate,activeTab,v)}
              onPhotosChange={v=>setPhotosVal(activeDate,activeTab,v)}/>
            {(activeTab==="skin"?entry.skin_photos:entry.hair_photos)?.length>0&&(activeTab==="skin"?entry.skin_photos:entry.hair_photos).map(p=>(
              <div key={p.id} className="photo-full"><img src={p.src} alt={p.name}/></div>
            ))}
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
                  else if(d===selectedDay&&!rangeStart) cls.push("selected-cell");
                  const ach=getDayAchievement(d);
                  return (
                    <div key={d} className={cls.join(" ")}
                      onClick={()=>handleCalClick(d)}
                      onMouseEnter={()=>rangeStart&&!rangeEnd&&setHoverDay(d)}
                      onMouseLeave={()=>setHoverDay(null)}>
                      {(ach?.heart||ach?.hasTreatment)&&<span style={{position:"absolute",top:0,left:1,fontSize:".52rem",lineHeight:1,display:"flex",gap:"1px"}}>
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
            </div>

            {selectedDay&&rangeStart&&!rangeEnd&&(()=>{
              const e=getE(selectedDay);
              const si=(e.skin||[]).map(id=>allSkinMap[id]).filter(Boolean);
              const hi=(e.hair||[]).map(id=>allHairMap[id]).filter(Boolean);
              const hasSched=getSchedDow(selectedDay);
              const hasSkin=si.length||e.skin_mood||e.skin_notes||e.skin_photos?.length;
              const hasHair=hi.length||e.hair_mood||e.hair_notes||e.hair_photos?.length;
              const hasAny=hasSkin||hasHair;
              return (
                <div className="day-panel">
                  <div className="day-panel-header">
                    <div className="day-panel-date">{selectedDay===today?"Today — ":""}{dispLong(selectedDay)}</div>
                    <button className="day-edit-btn" onClick={()=>setModal("dayEdit")}>{hasAny?"✏️ Edit":"+ Log"}</button>
                  </div>
                  {hasSched&&<div className="dp-scheduled">
                    🗓 {schedules.filter(s=>s.days.includes(parse(selectedDay).getDay())).map(s=>{ const it=allItems.find(x=>x.id===s.itemId); return it?`${it.emoji} ${it.label}`:null; }).filter(Boolean).join(", ")} planned
                  </div>}
                  {hasAny?(
                    <>
                      {hasSkin&&<>
                        <div style={{fontSize:".72rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:6,marginTop:4}}>🌿 Skin</div>
                        <div className="dp-pills">{si.map(r=><span key={r.id} className="dp-pill">{r.emoji} {r.label}</span>)}</div>
                        {e.skin_mood&&<div className="dp-mood">Mood: {e.skin_mood}</div>}
                        {e.skin_notes&&<div className="dp-note">"{e.skin_notes}"</div>}
                        {e.skin_photos?.length>0&&<div className="photo-thumbs" style={{marginTop:6,marginBottom:4}}>{e.skin_photos.map(p=><div key={p.id} className="photo-thumb"><img src={p.src} alt={p.name}/></div>)}</div>}
                      </>}
                      {hasHair&&<>
                        <div style={{fontSize:".72rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:6,marginTop:hasSkin?12:4}}>✨ Hair</div>
                        <div className="dp-pills">{hi.map(r=><span key={r.id} className="dp-pill h">{r.emoji} {r.label}</span>)}</div>
                        {e.hair_mood&&<div className="dp-mood">Mood: {e.hair_mood}</div>}
                        {e.hair_notes&&<div className="dp-note">"{e.hair_notes}"</div>}
                        {e.hair_photos?.length>0&&<div className="photo-thumbs" style={{marginTop:6}}>{e.hair_photos.map(p=><div key={p.id} className="photo-thumb"><img src={p.src} alt={p.name}/></div>)}</div>}
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
            {schedules.length>0&&<>
              <div style={{fontSize:".72rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:10}}>Routine Plans</div>
              {schedules.map(s=>{
                const it=allItems.find(x=>x.id===s.itemId); if(!it) return null;
                const recurDays=(s.days||[]).sort().map(d=>["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(", ");
                const dateCount=(s.dates||[]).length;
                const isToday=(s.days||[]).includes(new Date().getDay())||(s.dates||[]).includes(today);
                return (
                  <div key={s.id} className="sched-card" onClick={()=>setModal("plan")}>
                    <div className="sched-top">
                      <span style={{fontSize:"1rem"}}>{it.emoji}</span>
                      <div style={{flex:1}}>
                        <div className="sched-label">{it.label}</div>
                        <div style={{fontSize:".71rem",color:"#9a7050",marginTop:2}}>
                          {recurDays&&<span>{recurDays}</span>}
                          {recurDays&&dateCount>0&&<span> · </span>}
                          {dateCount>0&&<span>{dateCount} specific date{dateCount!==1?"s":""}</span>}
                        </div>
                      </div>
                      {isToday&&<span style={{fontSize:".68rem",background:"#b07a5e",color:"#fff",borderRadius:20,padding:"2px 8px",whiteSpace:"nowrap"}}>Today</span>}
                    </div>
                    {s.reminder&&<div className="sched-reminder">🔔 at {s.time}</div>}
                  </div>
                );
              })}
            </>}
            {treatments.length>0&&<>
              <div style={{fontSize:".72rem",letterSpacing:".1em",textTransform:"uppercase",color:"#a08070",marginBottom:10,marginTop:schedules.length?20:0}}>Treatments</div>
              {treatments.map(tx=>{
                const upcoming=tx.dates.filter(d=>d>=today).sort();
                const next=upcoming[0];
                return (
                  <div key={tx.id} className="sched-card treatment-card" onClick={()=>setModal("plan")}>
                    <div className="sched-top">
                      <span style={{fontSize:"1rem"}}>💉</span>
                      <div style={{flex:1}}>
                        <div className="sched-label">{tx.name}</div>
                        <div style={{fontSize:".71rem",color:"#9a7050",marginTop:2}}>
                          {tx.type==="skin"?"🌿 Skin":"✨ Hair"} · {tx.dates.length} date{tx.dates.length!==1?"s":""} · {tx.completedDates?.length||0} done
                          {next&&<span> · Next: {parse(next).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>}
                        </div>
                      </div>
                      {tx.dates.includes(today)&&<span style={{fontSize:".68rem",background:"#e06050",color:"#fff",borderRadius:20,padding:"2px 8px",whiteSpace:"nowrap"}}>Today</span>}
                    </div>
                  </div>
                );
              })}
            </>}
            {!schedules.length&&!treatments.length&&(
              <div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>No plans yet — tap + Add to start</div>
            )}
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
          </>
        )}
      </div>

      {modal==="manageItems"&&<ManageItemsModal type={activeTab} items={activeTab==="skin"?skinR:hairR} onAdd={item=>addItem(activeTab,item)} onRemove={id=>removeItem(activeTab,id)} onEdit={(id,changes)=>editItem(activeTab,id,changes)} onClose={()=>setModal(null)}/>}
      {modal==="plan"&&<PlanModal allItems={allItems} schedules={schedules} treatments={treatments} onSave={saveSched} onDelete={deleteSched} onSaveTreatment={saveTreatment} onDeleteTreatment={deleteTreatment} onClose={()=>setModal(null)}/>}
      {modal==="freq"&&<FreqModal allItems={allItems} tracked={freqTracked} period={freqPeriod} onToggle={id=>setFreqTracked(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])} onPeriod={async p=>{ setFreqPeriod(p); await persist({freqPeriod:p}); }} onClose={()=>setModal(null)}/>}
      {modal==="dayEdit"&&selectedDay&&<DayEditModal date={selectedDay} entry={getE(selectedDay)} skinRoutines={skinR} hairRoutines={hairR} onSave={data=>saveDayEdit(selectedDay,data)} onClose={()=>setModal(null)}/>}
      {modal==="rangeApply"&&rangeStart&&rangeEnd&&<RangeApplyModal rangeStart={rangeStart} rangeEnd={rangeEnd} skinRoutines={skinR} hairRoutines={hairR} onApply={applyRange} onClose={()=>{ setModal(null); setRangeStart(null); setRangeEnd(null); }}/>}

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
    </>
  );
}
