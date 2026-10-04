import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const executable = process.argv[2];
if (!executable || !path.isAbsolute(executable)) throw new Error("Pass the absolute QA executable path");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "suite-packaged-profile-"));
fs.writeFileSync(path.join(profile,"settings.json"), JSON.stringify({ freeMode: true }));
const isolatedAppData=path.join(profile,"appdata");fs.mkdirSync(isolatedAppData);
const require=createRequire(import.meta.url);
const modernProfile=require("../apps/client/src/release-channel").modernUserDataPath(isolatedAppData);
fs.mkdirSync(modernProfile,{recursive:true});fs.writeFileSync(path.join(modernProfile,"settings.json"),JSON.stringify({freeMode:true}));
const port = 44000 + Math.floor(Math.random()*1000);
const child = spawn(executable, [`--inspect-brk=${port}`,`--remote-debugging-port=${port+1}`], { windowsHide: true, stdio: ["ignore","ignore","pipe"] });
let errors = ""; child.stderr.on("data", chunk => { errors=(errors+chunk).slice(-1500); });
const delay = milliseconds => new Promise(resolve=>setTimeout(resolve,milliseconds));
async function page(endpoint, predicate=()=>true) {
  const deadline=Date.now()+15000;
  while(Date.now()<deadline) {
    if(child.exitCode!==null) throw new Error(`Packaged process exited ${child.exitCode}: ${errors}`);
    try { const result=await fetch(`http://127.0.0.1:${endpoint}/json/list`).then(value=>value.json()); const found=result.find(predicate); if(found) return found; } catch {}
    await delay(100);
  }
  throw new Error(`Packaged target did not start: ${errors}`);
}
async function connect(target) {
  const socket=new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
  let id=0,paused=0,frame=null;const pending=new Map(); socket.addEventListener("message",event=>{const value=JSON.parse(event.data);if(value.method==='Debugger.paused'){paused+=1;frame=value.params.callFrames[0];}const request=pending.get(value.id);if(!request)return;pending.delete(value.id);clearTimeout(request.timeout);value.error?request.reject(new Error(value.error.message)):request.resolve(value.result);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;const timeout=setTimeout(()=>{pending.delete(key);reject(new Error(`Timeout: ${method}`));},10000);pending.set(key,{resolve,reject,timeout});socket.send(JSON.stringify({id:key,method,params}));});
  return { send, pauses:()=>paused, close:()=>socket.close(), async evaluatePaused(expression) {const value=await send("Debugger.evaluateOnCallFrame",{callFrameId:frame.callFrameId,expression,returnByValue:true});if(value.exceptionDetails)throw new Error(value.exceptionDetails.exception?.description||value.exceptionDetails.text);return value.result.value;}, async evaluate(expression) {const value=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(value.exceptionDetails)throw new Error(value.exceptionDetails.exception?.description||value.exceptionDetails.text);return value.result.value;} };
}
let main, renderer;
try {
  main=await connect(await page(port));
  await main.send("Debugger.enable");
  await main.send("Debugger.setBreakpointByUrl",{urlRegex:"src[/\\\\]main\\.js$",lineNumber:0});
  await main.send("Runtime.runIfWaitingForDebugger");
  const pauseDeadline=Date.now()+10000;while(!main.pauses()&&Date.now()<pauseDeadline)await delay(50);
  if(!main.pauses())throw new Error("Packaged process did not pause before entry");
  const packagePath=path.join(path.dirname(executable),"resources","app.asar","package.json");
  const selected=await main.evaluatePaused(`globalThis.qaElectron=process.getBuiltinModule('module').createRequire(${JSON.stringify(packagePath)})('electron'); qaElectron.app.setPath('appData',${JSON.stringify(isolatedAppData)}); qaElectron.app.setPath('userData',${JSON.stringify(profile)}); qaElectron.app.getPath('userData')`);
  if(selected!==profile)throw new Error("Packaged profile was not isolated");
  await main.send("Debugger.disable");
  renderer=await connect(await page(port+1,value=>value.type==="page"&&value.url.includes("index.html")));
  const deadline=Date.now()+15000; while(!await renderer.evaluate("typeof window.clientApi?.getWindowState==='function' && document.querySelector('[data-app-view]')?.hidden===false")&&Date.now()<deadline)await delay(100);
  const result=await renderer.evaluate("window.clientApi.getWindowState().then(value=>({frameless:value.frameless,free:state.settings.accessMode==='free',controls:document.querySelectorAll('[data-window-command]').length,paidHidden:document.querySelector('[data-view-button=personal-tools]').hidden}))");
  if(!result.frameless||!result.free||result.controls!==3||!result.paidHidden)throw new Error(`Packaged UI failed: ${JSON.stringify(result)}`);
  await renderer.evaluate("document.querySelector('[data-settings-open]').click()");
  const settings=await page(port+1,value=>value.type==="page"&&value.url.includes("preferences.html"));
  if(!settings)throw new Error("Packaged settings failed to open");
  main.close();main=null;
  await renderer.evaluate("setTimeout(()=>window.clientApi.windowCommand('close'),200); true");
  const exit=Date.now()+8000;while(child.exitCode===null&&Date.now()<exit)await delay(100);
  if(child.exitCode!==0)throw new Error(`Packaged app did not close: ${errors}`);
  console.log(JSON.stringify({ packagedStartup:"ok", isolatedProfile:"ok", freeGate:"ok", framelessControls:"ok", separateSettings:"ok", cleanClose:"ok" }));
} finally { main?.close();renderer?.close();if(child.exitCode===null)child.kill(); }
