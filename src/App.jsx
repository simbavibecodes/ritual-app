import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const DEFAULT_SKIN = [
  { id: "cleanser",    label: "Cleanser",        emoji: "🫧" },
  { id: "toner",       label: "Toner",            emoji: "💧" },
  { id: "serum",       label: "Serum",            emoji: "✨" },
  { id: "moisturizer", label: "Moisturizer",      emoji: "🌿" },
  { id: "spf",         label: "SPF",              emoji: "☀️" },
  { id: "eye_cream",   label: "Eye Cream",        emoji: "👁️" },
  { id: "retinol",     label: "Retinol / AHA",    emoji: "🔬" },
  { id: "mask",        label: "Face Mask",        emoji: "🎭" },
  { id: "gua_sha",     label: "Gua Sha / Roller", emoji: "🪨" },
];
const DEFAULT_HAIR = [
  { id: "shampoo",      label: "Shampoo",           emoji: "🚿" },
  { id: "conditioner",  label: "Conditioner",       emoji: "🫙" },
  { id: "mask_hair",    label: "Hair Mask",         emoji: "💆" },
  { id: "oil",          label: "Hair Oil",          emoji: "🌺" },
  { id: "heat_protect", label: "Heat Protectant",   emoji: "🔥" },
  { id: "scalp",        label: "Scalp Treatment",   emoji: "🌱" },
  { id: "dry_shampoo",  label: "Dry Shampoo",       emoji: "☁️" },
  { id: "leave_in",     label: "Leave-In / Styling",emoji: "💅" },
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
const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

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
.r-item{display:flex;align-items:center;gap:9px;background:#fff8f3;border:1.5px solid #e8d8cc;border-radius:12px;padding:11px 13px;cursor:pointer;transition:all .18s;user-select:none}
.r-item:hover{border-color:#c89a7e;background:#fef2ea}
.r-item.on{background:#f7e8de;border-color:#b07a5e}
.r-item.on .r-label{color:#3a2e27}
.r-emoji{font-size:1rem;flex-shrink:0}
.r-label{font-size:.8rem;color:#8a6858;flex:1;line-height:1.3}
.r-check{width:17px;height:17px;border-radius:50%;border:1.5px solid #d0b0a0;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .18s}
.r-item.on .r-check{background:#b07a5e;border-color:#b07a5e}
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
.cal-cell.scheduled-cell::after{content:'';width:5px;height:5px;border-radius:50%;background:#7a9e7a;position:absolute;top:3px;right:3px}
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
.sched-card{background:#fff8f3;border:1px solid #e8d8cc;border-radius:14px;padding:14px;margin-bottom:10px}
.sched-top{display:flex;align-items:center;gap:10px}
.sched-label{flex:1;font-size:.84rem;color:#3a2e27}
.sched-reminder{font-size:.7rem;color:#7a9e7a;margin-top:3px;padding-left:28px}
.add-sched-btn{width:100%;background:none;border:1.5px dashed #d0b8aa;border-radius:12px;padding:12px;font-size:.82rem;color:#b07a5e;cursor:pointer;transition:all .18s;margin-top:4px;font-family:'DM Sans',sans-serif}
.add-sched-btn:hover{background:#fef2ea;border-color:#b07a5e}
.overlay{position:fixed;inset:0;background:rgba(58,46,39,.42);display:flex;align-items:flex-end;justify-content:center;z-index:200;backdrop-filter:blur(2px)}
.modal{background:#fdf6f0;border-radius:24px 24px 0 0;padding:26px 22px 48px;width:100%;max-width:680px;max-height:85vh;overflow-y:auto}
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
.reminder-banner{background:#e8f0e8;border:1px solid #b8d4b8;border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:flex-start;gap:10px}
.rb-text{flex:1;font-size:.82rem;color:#3a5a3a;line-height:1.5}
.rb-dismiss{background:none;border:none;cursor:pointer;color:#7a9e7a;font-size:.75rem;text-decoration:underline;padding:0;margin-top:2px}
.name-prompt-overlay{position:fixed;inset:0;background:rgba(58,46,39,.5);display:flex;align-items:center;justify-content:center;z-index:300;backdrop-filter:blur(3px);padding:24px}
.name-prompt{background:#fdf6f0;border-radius:24px;padding:36px 28px;width:100%;max-width:360px;text-align:center}
.name-prompt-title{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:300;color:#3a2e27;margin-bottom:6px}
.name-prompt-title span{font-style:italic;color:#b07a5e}
.name-prompt-sub{font-size:.8rem;color:#a08070;margin-bottom:24px;line-height:1.5}
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

function PlanModal({ allItems, schedules, onSave, onDelete, onClose }) {
  const [editing, setEditing] = useState(null);
  const [showItemPick, setShowItemPick] = useState(false);
  const startNew  = ()=>setEditing({id:uid(),itemId:"",days:[],reminder:false,time:"08:00"});
  const startEdit = s=>setEditing({...s});
  const saveEdit  = ()=>{ if(!editing.itemId||!editing.days.length) return; onSave(editing); setEditing(null); };
  const toggleDay = d=>setEditing(e=>({...e,days:e.days.includes(d)?e.days.filter(x=>x!==d):[...e.days,d]}));
  const getItem   = id=>allItems.find(x=>x.id===id);
  if (editing) {
    const sel=getItem(editing.itemId);
    return (
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&setEditing(null)}>
        <div className="modal">
          <div className="modal-top">
            <div className="modal-title">{schedules.find(s=>s.id===editing.id)?"Edit":"New"} Plan</div>
            <button className="modal-x" onClick={()=>setEditing(null)}>×</button>
          </div>
          <div className="modal-sub">Routine step</div>
          <button style={{width:"100%",background:"#fff8f3",border:"1.5px solid #e8d8cc",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10,fontSize:".86rem",color:"#3a2e27",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}
            onClick={()=>setShowItemPick(p=>!p)}>
            {sel?<>{sel.emoji} {sel.label}</>:<span style={{color:"#c0a898",fontStyle:"italic"}}>Select a step…</span>}
          </button>
          {showItemPick&&<div style={{marginBottom:14}}>{allItems.map(it=>(
            <div key={it.id} className="m-item" style={{cursor:"pointer",marginBottom:6}}
              onClick={()=>{setEditing(e=>({...e,itemId:it.id}));setShowItemPick(false)}}>
              <span style={{fontSize:"1rem"}}>{it.emoji}</span>
              <span className="m-item-lbl">{it.label}</span>
            </div>
          ))}</div>}
          <div className="modal-sub">Repeat on</div>
          <div className="dow-row">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d,i)=>(
              <button key={d} className={`dow-chip ${editing.days.includes(i)?"on":""}`} onClick={()=>toggleDay(i)}>{d}</button>
            ))}
          </div>
          <div className="toggle-row">
            <div><div className="toggle-lbl">🔔 Remind me</div><div className="toggle-sub">Browser notification</div></div>
            <Toggle on={editing.reminder} onChange={v=>setEditing(e=>({...e,reminder:v}))}/>
          </div>
          {editing.reminder&&<div style={{marginBottom:14}}>
            <input type="time" className="time-input" value={editing.time}
              onChange={e=>setEditing(ed=>({...ed,time:e.target.value}))}/>
          </div>}
          <button className="save-btn" onClick={saveEdit}
            disabled={!editing.itemId||!editing.days.length}
            style={{opacity:(!editing.itemId||!editing.days.length)?.4:1}}>Save Plan</button>
        </div>
      </div>
    );
  }
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-top">
          <div className="modal-title">Routine Plans</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        {!schedules.length&&<div style={{textAlign:"center",color:"#b09080",fontStyle:"italic",padding:"16px 0",fontSize:".86rem"}}>No plans yet</div>}
        {schedules.map(s=>{
          const it=getItem(s.itemId); if(!it) return null;
          const dn=s.days.map(d=>["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(", ");
          return (
            <div key={s.id} className="sched-card">
              <div className="sched-top">
                <span style={{fontSize:"1rem"}}>{it.emoji}</span>
                <span className="sched-label">{it.label}</span>
                <span style={{fontSize:".72rem",color:"#b07a5e"}}>{dn}</span>
                <button className="del-btn" onClick={()=>onDelete(s.id)}>✕</button>
                <button className="ghost-btn" onClick={()=>startEdit(s)}>Edit</button>
              </div>
              {s.reminder&&<div className="sched-reminder">🔔 at {s.time}</div>}
            </div>
          );
        })}
        <button className="add-sched-btn" onClick={startNew}>+ Add Plan</button>
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
  const [skin,setSkin]   = useState(entry.skin||[]);
  const [hair,setHair]   = useState(entry.hair||[]);
  const [mood,setMood]   = useState(entry.mood||"");
  const [notes,setNotes] = useState(entry.notes||"");
  const [photos,setPhotos]=useState(entry.photos||[]);
  const [tab,setTab]     = useState("skin");
  const toggle = (type,id) => {
    if(type==="skin") setSkin(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
    else setHair(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  };
  const list=tab==="skin"?skinRoutines:hairRoutines;
  const checked=tab==="skin"?skin:hair;
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
        <div className="modal-sub">Mood</div>
        <div className="mood-row" style={{marginBottom:14}}>
          {MOODS.map(m=><button key={m} className={`mood-chip ${mood===m?"on":""}`} onClick={()=>setMood(p=>p===m?"":m)}>{m}</button>)}
        </div>
        <div className="modal-sub">Notes & Photos</div>
        <PhotoNotes notes={notes} photos={photos} onNotesChange={setNotes} onPhotosChange={setPhotos}/>
        <button className="save-btn" onClick={()=>onSave({skin,hair,mood,notes,photos})}>Save Entry</button>
      </div>
    </div>
  );
}

function RangeApplyModal({ rangeStart, rangeEnd, skinRoutines, hairRoutines, onApply, onClose }) {
  const [skin,setSkin]   = useState([]);
  const [hair,setHair]   = useState([]);
  const [mood,setMood]   = useState("");
  const [notes,setNotes] = useState("");
  const [photos,setPhotos]=useState([]);
  const [tab,setTab]     = useState("skin");
  const days = dateRange(rangeStart, rangeEnd);
  const toggle = (type,id) => {
    if(type==="skin") setSkin(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
    else setHair(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  };
  const list=tab==="skin"?skinRoutines:hairRoutines;
  const checked=tab==="skin"?skin:hair;
  const sD=parse(rangeStart), eD=parse(rangeEnd);
  const sameMonth=sD.getMonth()===eD.getMonth()&&sD.getFullYear()===eD.getFullYear();
  const label=sameMonth
    ?`${sD.toLocaleDateString("en-US",{month:"long",day:"numeric"})} – ${eD.getDate()}`
    :`${sD.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${eD.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`;
  const hasAny=skin.length||hair.length||mood||notes||photos.length;
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
        <div className="modal-sub">Mood (applied to all days)</div>
        <div className="mood-row" style={{marginBottom:14}}>
          {MOODS.map(m=><button key={m} className={`mood-chip ${mood===m?"on":""}`} onClick={()=>setMood(p=>p===m?"":m)}>{m}</button>)}
        </div>
        <div className="modal-sub">Notes & Photos (applied to all days)</div>
        <PhotoNotes notes={notes} photos={photos} onNotesChange={setNotes} onPhotosChange={setPhotos}/>
        <button className="save-btn" disabled={!hasAny} style={{opacity:hasAny?1:.4}}
          onClick={()=>onApply({skin,hair,mood,notes,photos},days)}>
          Apply to {days.length} Day{days.length!==1?"s":""}
        </button>
      </div>
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
  const [freqTracked, setFreqTracked] = useState(["retinol","spf","cleanser","shampoo"]);
  const [freqPeriod,  setFreqPeriod]  = useState("year");
  const [modal,       setModal]       = useState(null);
  const [calMonth,    setCalMonth]    = useState({y:new Date().getFullYear(),m:new Date().getMonth()});
  const [selectedDay, setSelectedDay] = useState(today);
  const [toast,       setToast]       = useState("");
  const [dismissed,   setDismissed]   = useState([]);
  const [rangeMode,   setRangeMode]   = useState(false);
  const [rangeStart,  setRangeStart]  = useState(null);
  const [rangeEnd,    setRangeEnd]    = useState(null);
  const [hoverDay,    setHoverDay]    = useState(null);
  const [curPhotos,   setCurPhotos]   = useState([]);
  const [userName,    setUserName]    = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // Load all data from Supabase on mount
  useEffect(()=>{
    (async()=>{
      if(!user) return;
      try {
        // Load entries
        const { data: entryRows } = await supabase.from("entries").select("*").eq("user_id", user.id);
        if (entryRows) {
          const map = {};
          entryRows.forEach(r => { map[r.date] = { skin: r.skin||[], hair: r.hair||[], mood: r.mood||"", notes: r.notes||"", photos: r.photos||[] }; });
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
        if (schedRows) setSchedules(schedRows.map(r=>({ id:r.id, itemId:r.item_id, days:r.days, reminder:r.reminder, time:r.time })));
        // Load freq settings
        const { data: freqRows } = await supabase.from("freq_settings").select("*").eq("user_id", user.id).single();
        if (freqRows) { setFreqTracked(freqRows.tracked||[]); setFreqPeriod(freqRows.period||"year"); }
        // Load user name from profile metadata
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        const name = freshUser?.user_metadata?.display_name || "";
        if (name) setUserName(name);
        else setShowNamePrompt(true);
      } catch(e) { console.error("Load error", e); }
    })();
  },[user]);

  useEffect(()=>{ setCurPhotos(entries[activeDate]?.photos||[]); },[activeDate]);

  const getE = d => entries[d]||{skin:[],hair:[],notes:"",mood:"",photos:[]};
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
        mood: entryData.mood||"", notes: entryData.notes||"", photos: entryData.photos||[],
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,date" });
    } catch(e) { console.error("Entry save error", e); }
  };

  // Save schedules to Supabase
  const persistSchedules = async (newSchedules) => {
    if (!user) return;
    try {
      await supabase.from("schedules").delete().eq("user_id", user.id);
      if (newSchedules.length > 0) {
        await supabase.from("schedules").insert(newSchedules.map(s => ({
          id: s.id, user_id: user.id, item_id: s.itemId,
          days: s.days, reminder: s.reminder, time: s.time
        })));
      }
    } catch(e) { console.error("Schedule save error", e); }
  };

  const toggleItem=(date,type,id)=>{
    const e=getE(date); const cur=e[type]||[];
    setEntries(p=>({...p,[date]:{...e,[type]:cur.includes(id)?cur.filter(x=>x!==id):[...cur,id]}}));
  };
  const setNotesVal=(date,v)=>setEntries(p=>({...p,[date]:{...getE(date),notes:v}}));
  const setMoodVal=(date,v)=>{ const e=getE(date); setEntries(p=>({...p,[date]:{...e,mood:e.mood===v?"":v}})); };
  const setPhotosVal=(date,v)=>{
    const photos=typeof v==="function"?v(getE(date).photos||[]):v;
    setEntries(p=>({...p,[date]:{...getE(date),photos}}));
    setCurPhotos(photos);
  };

  const saveEntry=async()=>{
    const e = getE(activeDate);
    await persistEntry(activeDate, e);
    showT("✓ Entry saved");
  };
  const addItem=(type,item)=>{ if(type==="skin") setSkinR(p=>[...p,item]); else setHairR(p=>[...p,item]); };
  const removeItem=(type,id)=>{
    if(type==="skin") setSkinR(p=>p.filter(r=>r.id!==id)); else setHairR(p=>p.filter(r=>r.id!==id));
    setEntries(p=>{ const u={...p}; for(const d in u){ if(u[d][type]) u[d]={...u[d],[type]:u[d][type].filter(x=>x!==id)} } return u; });
  };
  const editItem=(type,id,changes)=>{
    if(type==="skin") setSkinR(p=>p.map(r=>r.id===id?{...r,...changes}:r));
    else setHairR(p=>p.map(r=>r.id===id?{...r,...changes}:r));
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
    const first=new Date(y,m,1).getDay(), days=daysInMonth(y,m);
    const cells=[];
    for(let i=0;i<first;i++) cells.push(null);
    for(let d=1;d<=days;d++) cells.push(fmt(new Date(y,m,d)));
    return cells;
  };
  const hasEntry=d=>{ if(!d) return false; const e=entries[d]; return e&&(e.skin?.length||e.hair?.length||e.notes||e.mood||e.photos?.length); };
  const getSchedDow=d=>schedules.some(s=>s.days.includes(parse(d).getDay()));

  const effEnd=rangeEnd||(rangeStart&&hoverDay?hoverDay:null);
  const inRange=d=>{ if(!rangeStart||!effEnd||!d) return false; const [lo,hi]=rangeStart<=effEnd?[rangeStart,effEnd]:[effEnd,rangeStart]; return d>lo&&d<hi; };
  const isRangeStart=d=>d===rangeStart;
  const isRangeEnd=d=>rangeEnd?d===rangeEnd:(rangeStart&&hoverDay&&d===hoverDay&&hoverDay!==rangeStart);

  const handleCalClick=d=>{
    if(!rangeStart||(rangeStart&&rangeEnd)){
      // First tap (or reset): select day, show detail
      setRangeStart(d); setRangeEnd(null); setSelectedDay(d);
    } else {
      if(d===rangeStart){
        // Tapped same day twice — open single-day editor
        setSelectedDay(d); setModal("dayEdit");
      } else {
        // Second tap on different day — open range modal
        const [lo,hi]=d>=rangeStart?[rangeStart,d]:[d,rangeStart];
        setRangeStart(lo); setRangeEnd(hi); setSelectedDay(lo);
        setModal("rangeApply");
      }
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
  const visibleReminders=schedules.filter(s=>s.days.includes(todayDow)&&!dismissed.includes(s.id));
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
            {visibleReminders.map(s=>{ const it=allItems.find(x=>x.id===s.itemId); if(!it) return null; return (
              <div key={s.id} className="reminder-banner">
                <div className="rb-text">🔔 <strong>Planned today:</strong> {it.emoji} {it.label}{s.reminder?` at ${s.time}`:""}</div>
                <button className="rb-dismiss" onClick={()=>setDismissed(p=>[...p,s.id])}>dismiss</button>
              </div>
            );})}
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
              <div style={{display:"flex",justifyContent:"space-between",fontSize:".73rem",color:"#a08070",marginBottom:5}}>
                <span>{activeTab==="skin"?"Skin Routine":"Hair Routine"}</span>
                <span>{done} / {routines.length} steps</span>
              </div>
              <div className="prog-wrap"><div className="prog-bar" style={{width:routines.length?`${(done/routines.length)*100}%`:"0%"}}/></div>
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
            <div className="sec-title" style={{marginBottom:12}}>How's your skin feeling?</div>
            <div className="mood-row">
              {MOODS.map(m=><button key={m} className={`mood-chip ${entry.mood===m?"on":""}`} onClick={()=>setMoodVal(activeDate,m)}>{m}</button>)}
            </div>
            <div className="sec-title" style={{marginBottom:10}}>Notes & Observations</div>
            <PhotoNotes notes={entry.notes} photos={curPhotos}
              onNotesChange={v=>setNotesVal(activeDate,v)}
              onPhotosChange={v=>setPhotosVal(activeDate,v)}/>
            {curPhotos.length>0&&curPhotos.map(p=>(
              <div key={p.id} className="photo-full"><img src={p.src} alt={p.name}/></div>
            ))}
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
                  if(getSchedDow(d)) cls.push("scheduled-cell");
                  if(isRangeStart(d)) cls.push("range-start");
                  else if(isRangeEnd(d)) cls.push("range-end");
                  else if(inRange(d)) cls.push("in-range");
                  else if(d===selectedDay&&!rangeStart) cls.push("selected-cell");
                  return (
                    <div key={d} className={cls.join(" ")}
                      onClick={()=>handleCalClick(d)}
                      onMouseEnter={()=>rangeStart&&!rangeEnd&&setHoverDay(d)}
                      onMouseLeave={()=>setHoverDay(null)}>
                      {parse(d).getDate()}
                      {hasEntry(d)&&<div className="cal-dot"/>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{display:"flex",gap:16,fontSize:".7rem",color:"#a08070",marginBottom:18,flexWrap:"wrap"}}>
              <span>● Entry logged</span>
              <span style={{color:"#7a9e7a"}}>● Planned</span>
              <span style={{color:"#b07a5e",fontStyle:"italic"}}>Today</span>
            </div>
            {selectedDay&&!rangeEnd&&(()=>{
              const e=getE(selectedDay);
              const si=(e.skin||[]).map(id=>allSkinMap[id]).filter(Boolean);
              const hi=(e.hair||[]).map(id=>allHairMap[id]).filter(Boolean);
              const hasSched=getSchedDow(selectedDay);
              const hasAny=si.length||hi.length||e.notes||e.mood||e.photos?.length;
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
                      <div className="dp-pills">
                        {si.map(r=><span key={r.id} className="dp-pill">{r.emoji} {r.label}</span>)}
                        {hi.map(r=><span key={r.id} className="dp-pill h">{r.emoji} {r.label}</span>)}
                      </div>
                      {e.mood&&<div className="dp-mood">Mood: {e.mood}</div>}
                      {e.notes&&<div className="dp-note">"{e.notes}"</div>}
                      {e.photos?.length>0&&<div className="photo-thumbs" style={{marginTop:8}}>{e.photos.map(p=><div key={p.id} className="photo-thumb"><img src={p.src} alt={p.name}/></div>)}</div>}
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
              <div className="sec-title">Routine Plans</div>
              <button className="ghost-btn" onClick={()=>setModal("plan")}>+ Manage</button>
            </div>
            <p style={{fontSize:".83rem",color:"#a08070",marginBottom:16,lineHeight:1.6}}>
              Set weekly recurring plans for your steps. Planned days show on the calendar. Enable reminders for browser notifications.
            </p>
            {!schedules.length?(
              <div style={{textAlign:"center",padding:"32px 0",color:"#b09080",fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem"}}>No plans yet — tap Manage to add one</div>
            ):schedules.map(s=>{
              const it=allItems.find(x=>x.id===s.itemId); if(!it) return null;
              const dn=s.days.sort().map(d=>["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(", ");
              const isToday=s.days.includes(new Date().getDay());
              return (
                <div key={s.id} className="sched-card" style={isToday?{borderColor:"#7a9e7a",background:"#f4f9f4"}:{}}>
                  <div className="sched-top">
                    <span style={{fontSize:"1rem"}}>{it.emoji}</span>
                    <div style={{flex:1}}>
                      <div className="sched-label" style={{fontWeight:500}}>{it.label}</div>
                      <div style={{fontSize:".72rem",color:"#a08070",marginTop:2}}>{dn}</div>
                    </div>
                    {isToday&&<span style={{fontSize:".7rem",background:"#7a9e7a",color:"#fff",borderRadius:20,padding:"2px 8px"}}>Today</span>}
                  </div>
                  {s.reminder&&<div className="sched-reminder">🔔 at {s.time}</div>}
                </div>
              );
            })}
            <button className="add-sched-btn" onClick={()=>setModal("plan")}>+ Add Plan</button>
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
          </>
        )}
      </div>

      {modal==="manageItems"&&<ManageItemsModal type={activeTab} items={activeTab==="skin"?skinR:hairR} onAdd={item=>addItem(activeTab,item)} onRemove={id=>removeItem(activeTab,id)} onEdit={(id,changes)=>editItem(activeTab,id,changes)} onClose={()=>setModal(null)}/>}
      {modal==="plan"&&<PlanModal allItems={allItems} schedules={schedules} onSave={saveSched} onDelete={deleteSched} onClose={()=>setModal(null)}/>}
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
