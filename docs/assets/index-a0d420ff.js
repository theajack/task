(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function s(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(n){if(n.ep)return;n.ep=!0;const r=s(n);fetch(n.href,r)}})();typeof globalThis.requestIdleCallback>"u"&&(globalThis.requestIdleCallback=function(e){const t=Date.now();return setTimeout(function(){e({didTimeout:!1,timeRemaining:function(){return Math.max(0,16-(Date.now()-t))}})},0)},globalThis.cancelIdleCallback=function(e){clearTimeout(e)});async function T(e,t=10,s){const o=e.length;if(o===0)return Promise.resolve([]);const{ready:n,resolve:r}=p(),i=[];let l=0,f=0;const d=async()=>{const u=e[l],a=l;l++;const m=Date.now(),y=await u();s==null||s(y,a);const w=Date.now()-m;if(i[a]={start:m,result:y,elapse:w},f++,f===o){r(i);return}l>=o||d()};for(let u=0;u<t;u++)d();return n}function g(e,t){const s=e.length;if(s===0)return Promise.resolve([]);const{ready:o,resolve:n}=p(),r=[];let i=0,l=0;const f=(d=0)=>{let u=Date.now();for(;d>0;){const a=e[l]();t==null||t(a,l),l++;const m=Date.now(),y=m-u;if(r.push({result:a,elapse:y,start:u,round:i}),l>=s){n(r);return}u=m,d-=y}globalThis.requestIdleCallback(a=>{f(a.timeRemaining())}),i++};return f(),o}function p(){let e=()=>{},t=()=>{};return{ready:new Promise((o,n)=>{e=o,t=n}),resolve:e,reject:t}}function h(e){return e<=1?e:h(e-1)+h(e-2)}function v(){const{ready:e,resolve:t}=p(),s=Math.round(Math.random()*10);return setTimeout(()=>{t(s)},s),e}function c(e){return document.getElementById(e)}c("startTasks").onclick=()=>{const e=Date.now();c("result").innerText="2000 Tasks is Running...",g([...new Array(2e3).fill(()=>h(25))]).then(t=>{c("result").innerText=`2000 Tasks done in ${Date.now()-e}ms. Open DevTool to view Details`,console.log(t)})};c("startAsyncTasks").onclick=()=>{const e=Date.now();c("result").innerText="2000 Async Tasks is Running...",T([...new Array(2e3).fill(()=>v())],100).then(t=>{c("result").innerText=`2000 Async Tasks done in ${Date.now()-e}ms. Open DevTool to view Details`,console.log(t)})};c("startTasks2").onclick=()=>{const e=Date.now();c("result").innerText="2000 Tasks is Running...",console.log([...new Array(2e3).fill(()=>h(25))].map(t=>t())),c("result").innerText=`2000 Tasks done in ${Date.now()-e}ms. Open DevTool to view Details`};
