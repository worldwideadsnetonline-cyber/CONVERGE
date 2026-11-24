const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const colors=['#35d5df','#ff9d54','#a78bfa','#74e0a2'];
let audioCtx=null, master=null, masterAnalyser=null, mediaDest=null, recorder=null, chunks=[];
const decks=[], tracks=[];
const fmt=t=>{if(!Number.isFinite(t))return '00:00';return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`};
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2300)}
function ensureAudio(){
 if(master)return;
 if(!audioCtx)audioCtx=new AudioContext();master=audioCtx.createGain();master.gain.value=.82;
 masterAnalyser=audioCtx.createAnalyser();masterAnalyser.fftSize=2048;
 mediaDest=audioCtx.createMediaStreamDestination();
 master.connect(masterAnalyser);masterAnalyser.connect(audioCtx.destination);masterAnalyser.connect(mediaDest);
 decks.forEach((d)=>connectDeck(d));
}
function connectDeck(d){
 if(d.connected||!audioCtx)return;
 d.source=audioCtx.createMediaElementSource(d.audio);
 d.gain=audioCtx.createGain();d.low=audioCtx.createBiquadFilter();d.low.type='lowshelf';d.low.frequency.value=250;
 d.mid=audioCtx.createBiquadFilter();d.mid.type='peaking';d.mid.frequency.value=1000;d.mid.Q.value=.8;
 d.high=audioCtx.createBiquadFilter();d.high.type='highshelf';d.high.frequency.value=5000;
 d.channelGain=audioCtx.createGain();d.channelGain.gain.value=Math.cos(.5*Math.PI/2);d.analyser=audioCtx.createAnalyser();d.analyser.fftSize=1024;
 d.source.connect(d.low);d.low.connect(d.mid);d.mid.connect(d.high);d.high.connect(d.gain);d.gain.connect(d.channelGain);d.channelGain.connect(d.analyser);d.analyser.connect(master);
 d.connected=true;
}
function deckMarkup(i){return `<article class="deck" style="--deck:${colors[i]}" data-deck="${i}">
 <div class="deck-head"><span class="deck-id">DECK 0${i+1}</span><span class="deck-state" id="state${i}">EMPTY · READY</span></div>
 <div class="deck-meta"><div style="min-width:0"><div class="track-title" id="title${i}">No track loaded</div><div class="track-sub" id="time${i}">00:00 / 00:00</div></div><div class="bpm"><span id="bpm${i}">128.0</span> <small>BPM</small></div></div>
 <canvas class="wave" id="wave${i}"></canvas>
 <div class="transport"><button class="play" data-action="play" data-i="${i}">▶ PLAY</button><button data-action="stop" data-i="${i}">■ STOP</button><button data-action="cue" data-i="${i}">CUE</button><button data-action="sync" data-i="${i}">SYNC</button><button class="load" data-action="load" data-i="${i}">LOAD TRACK</button></div>
 <div class="deck-controls">
  <div class="control"><label>GAIN <strong id="gainVal${i}">0 dB</strong></label><input data-param="gain" data-i="${i}" type="range" min="0" max="1.5" step=".01" value="1"></div>
  <div class="control"><label>TEMPO <strong id="tempoVal${i}">0%</strong></label><input data-param="tempo" data-i="${i}" type="range" min="-16" max="16" step=".1" value="0"></div>
  <div class="control"><label>LOOP <strong>BEATS</strong></label><select data-param="loop" data-i="${i}"><option value="0">OFF</option><option value="1">1</option><option value="2">2</option><option value="4">4</option><option value="8">8</option></select></div>
  <div class="control"><label>POSITION <strong id="posVal${i}">0%</strong></label><input data-param="position" data-i="${i}" type="range" min="0" max="100" value="0"></div>
 </div>
 <div class="cue-row">${[1,2,3,4].map(n=>`<button data-action="hotcue" data-i="${i}" data-cue="${n}">HOT CUE ${n}</button>`).join('')}</div>
 </article>`}
function mixerMarkup(){return decks.map((d,i)=>`<div class="channel" style="--ch:${colors[i]}"><h3>CH 0${i+1} <span style="float:right;color:#718395">DECK ${i+1}</span></h3>
 ${[['HIGH','high'],['MID','mid'],['LOW','low']].map(([label,param])=>`<div class="knob-wrap"><div class="knob" id="${param}Knob${i}">0</div><input type="range" min="-24" max="6" value="0" step="1" data-eq="${param}" data-i="${i}"><small>${label}</small></div>`).join('')}
 </div>`).join('')}
function init(){
 $('#decks').innerHTML=Array.from({length:4},(_,i)=>deckMarkup(i)).join('');
 for(let i=0;i<4;i++){const audio=new Audio();audio.preload='metadata';const d={audio,index:i,hotcues:{},cuePoint:0,loop:0,connected:false,bpm:null,wavePeaks:null};decks.push(d);
  audio.addEventListener('timeupdate',()=>updateDeck(d));audio.addEventListener('loadedmetadata',()=>updateDeck(d));audio.addEventListener('ended',()=>{$(`#state${i}`).textContent='PLAYBACK ENDED';});
 }
 $('#mixer').innerHTML=mixerMarkup();
 $('#decks').addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;const i=+b.dataset.i;action(b.dataset.action,i,+b.dataset.cue)});
 $('#mixer').addEventListener('input',e=>{const el=e.target;if(!el.dataset.eq)return;ensureAudio();const d=decks[+el.dataset.i];const node=d[el.dataset.eq];node.gain.value=+el.value;$(`#${el.dataset.eq}Knob${d.index}`).textContent=el.value});
 $('#decks').addEventListener('input',e=>{const el=e.target;if(!el.dataset.param)return;const d=decks[+el.dataset.i],p=el.dataset.param;ensureAudio();
  if(p==='gain'){d.gain.gain.value=+el.value;$(`#gainVal${d.index}`).textContent=(20*Math.log10(Math.max(.001,+el.value))).toFixed(1)+' dB'}
  if(p==='tempo'){d.audio.playbackRate=1+(+el.value/100);$(`#tempoVal${d.index}`).textContent=(+el.value).toFixed(1)+'%'}
  if(p==='position'&&d.audio.duration){d.audio.currentTime=d.audio.duration*(+el.value/100)}
  if(p==='loop'){d.loop=+el.value;d.loopStart=d.audio.currentTime||0;d.loopEnd=d.loop?d.loopStart+d.loop*(60/(d.bpm||128)):0;}
 });
 $('#masterVol').addEventListener('input',e=>{ensureAudio();master.gain.value=+e.target.value;$('#masterReadout').textContent=(+e.target.value===0?'−∞':(20*Math.log10(+e.target.value)).toFixed(1))+' dB'});
 $('#crossfader').addEventListener('input',e=>{ensureAudio();const x=+e.target.value;decks.forEach((d,i)=>{if(d.channelGain)d.channelGain.gain.value=i<2?Math.cos(x*Math.PI/2):Math.cos((1-x)*Math.PI/2)})});
 $('#addTrack').onclick=chooseTrack;$('#recordBtn').onclick=toggleRecord;$('#midiBtn').onclick=setupMidi;
 restoreLibrary();drawLoop();
}
async function chooseTrack(){const p=await window.djHost.chooseAudio();if(p)addTrack(p)}
function addTrack(path){if(tracks.some(t=>t.path===path)){toast('Track already in library');return}const url=window.djHost.toFileUrl(path);const track={path,url,name:path.split(/[\\/]/).pop()};tracks.push(track);persistLibrary();renderTracks();toast('Track added · analyzing…');analyzeTrack(track)}
function persistLibrary(){try{localStorage.setItem('convergeDjLibrary',JSON.stringify(tracks.map(t=>({path:t.path,name:t.name}))))}catch(e){toast('Library storage limit reached')}}
function restoreLibrary(){try{const saved=JSON.parse(localStorage.getItem('convergeDjLibrary')||'[]');saved.forEach(t=>{if(t&&typeof t.path==='string'&&!tracks.some(x=>x.path===t.path)){const track={path:t.path,url:window.djHost.toFileUrl(t.path),name:t.name||t.path.split(/[\\/]/).pop()};tracks.push(track);analyzeTrack(track)}});renderTracks()}catch(e){console.warn('Library restore skipped',e)}}
async function analyzeTrack(t){try{if(!audioCtx)audioCtx=new AudioContext();const raw=await window.djHost.readAudio(t.path);const buffer=await audioCtx.decodeAudioData(raw.slice(0));const data=buffer.getChannelData(0),peaks=[],bins=1200,chunk=Math.max(1,Math.floor(data.length/bins));for(let n=0;n<bins;n++){let peak=0;for(let j=n*chunk;j<Math.min(data.length,(n+1)*chunk);j++)peak=Math.max(peak,Math.abs(data[j]));peaks.push(peak)}t.wavePeaks=peaks;t.bpm=estimateBpm(buffer);t.duration=buffer.duration;decks.forEach(d=>{if(d.track===t){d.wavePeaks=peaks;d.bpm=t.bpm;$('#bpm'+d.index).textContent=t.bpm?t.bpm.toFixed(1):'--.-';drawWave(d)}});persistLibrary()}catch(e){console.warn('Track analysis failed:',e);toast('Audio analysis unavailable for '+t.name)}}
function estimateBpm(buffer){const sr=buffer.sampleRate,channel=buffer.getChannelData(0),hop=1024,env=[];for(let p=0;p<channel.length;p+=hop){let sum=0,end=Math.min(channel.length,p+hop);for(let j=p;j<end;j++)sum+=channel[j]*channel[j];env.push(Math.sqrt(sum/Math.max(1,end-p)))}const onset=env.map((v,i)=>Math.max(0,v-(env[i-1]||0))),minLag=Math.floor(60*sr/(hop*180)),maxLag=Math.floor(60*sr/(hop*65));let lagBest=0,scoreBest=-Infinity;for(let lag=minLag;lag<=maxLag&&lag<onset.length/2;lag++){let score=0;for(let i=lag;i<onset.length;i++)score+=onset[i]*onset[i-lag];if(score>scoreBest){scoreBest=score;lagBest=lag}}if(!lagBest)return null;let bpm=60*sr/(hop*lagBest);while(bpm<80)bpm*=2;while(bpm>170)bpm/=2;return Math.round(bpm*10)/10}
function renderTracks(){$('#trackList').innerHTML=tracks.length?tracks.map((t,n)=>`<div class="track-row"><span class="track-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span><span class="track-format">${t.name.split('.').pop().toUpperCase()}</span><span class="load-buttons">${[0,1,2,3].map(i=>`<button data-load="${n}" data-i="${i}">DECK ${i+1}</button>`).join('')}</span></div>`).join(''):'<div class="empty">Your music collection will appear here. Add audio files to begin.</div>'}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('#trackList').addEventListener('click',e=>{const b=e.target.closest('button[data-load]');if(b)loadTrack(+b.dataset.i,tracks[+b.dataset.load])});
function loadTrack(i,t){if(!t)return;const d=decks[i];d.track=t;d.audio.src=t.url;d.audio.load();d.hotcues={};d.cuePoint=0;d.bpm=t.bpm||null;d.wavePeaks=t.wavePeaks||null;$(`#title${i}`).textContent=t.name;$(`#state${i}`).textContent='LOADED · PAUSED';$('#bpm'+i).textContent=d.bpm?d.bpm.toFixed(1):'--.-';toast(`Loaded on Deck ${i+1}`);ensureAudio();drawWave(d)}
function action(a,i,cue){const d=decks[i];ensureAudio();audioCtx.resume();
 if(a==='load'){chooseTrack().then(()=>{if(tracks.length)loadTrack(i,tracks[tracks.length-1])});return}
 if(a==='play'){if(d.audio.paused){d.audio.play().then(()=>$(`#state${i}`).textContent='PLAYING').catch(()=>toast('Load an audio track first'))}else{d.audio.pause();$(`#state${i}`).textContent='PAUSED'}}
 if(a==='stop'){d.audio.pause();d.audio.currentTime=0;$(`#state${i}`).textContent='STOPPED'}
 if(a==='cue'){if(!d.audio.paused){d.cuePoint=d.audio.currentTime;d.audio.pause();toast('Cue point saved at '+fmt(d.cuePoint))}else if(d.audio.src){d.audio.currentTime=d.cuePoint||0;d.audio.play().then(()=>setTimeout(()=>{d.audio.pause();$('#state'+i).textContent='CUE PREVIEW'},350)).catch(()=>toast('Load a track first'))}else toast('Load a track first')}
 if(a==='sync'){const other=decks.find(x=>x!==d&&!x.audio.paused&&x.bpm&&d.bpm);if(other){const rate=Math.max(.84,Math.min(1.16,(other.bpm*other.audio.playbackRate)/d.bpm));d.audio.playbackRate=rate;$(`[data-param="tempo"][data-i="${i}"]`).value=((rate-1)*100).toFixed(1);$ (`#tempoVal${i}`).textContent=((rate-1)*100).toFixed(1)+'%';toast(`Tempo matched: ${(d.bpm*rate).toFixed(1)} BPM`)}else toast('Load two tracks with detected BPM and start the reference deck')}
 if(a==='hotcue'){if(d.hotcues[cue]!==undefined){d.audio.currentTime=d.hotcues[cue]}else{d.hotcues[cue]=d.audio.currentTime;toast(`Hot Cue ${cue} saved`)}}
}
function updateDeck(d){const i=d.index,dur=d.audio.duration||0,cur=d.audio.currentTime||0;$(`#time${i}`).textContent=`${fmt(cur)} / ${fmt(dur)}`;$(`#posVal${i}`).textContent=(dur?cur/dur*100:0).toFixed(0)+'%';const pos=$(`[data-param="position"][data-i="${i}"]`);if(pos&&dur)pos.value=cur/dur*100;
 if(d.loop&&dur&&d.loopEnd>0&&cur>=d.loopEnd){d.audio.currentTime=d.loopStart;}
}
function drawWave(d){
 const canvas=$(`#wave${d.index}`),ctx=canvas.getContext('2d');canvas.width=Math.max(1,canvas.clientWidth*2);canvas.height=Math.max(1,canvas.clientHeight*2);
 const w=canvas.width,h=canvas.height,mid=h/2;ctx.clearRect(0,0,w,h);ctx.fillStyle='#09111a';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle=colors[d.index];ctx.globalAlpha=.88;ctx.lineWidth=1;ctx.beginPath();
 if(d.wavePeaks){for(let x=0;x<w;x++){const peak=d.wavePeaks[Math.min(d.wavePeaks.length-1,Math.floor(x/w*d.wavePeaks.length))]||0;ctx.moveTo(x,mid-peak*mid*.94);ctx.lineTo(x,mid+peak*mid*.94)}}
 else {for(let x=0;x<w;x++){const y=mid+Math.sin(x*.07+d.index)*Math.sin(x*.013)*h*.32;ctx.lineTo(x,y)}}
 ctx.stroke();ctx.globalAlpha=1;
}

function drawLoop(){decks.forEach(d=>{const c=$(`#wave${d.index}`);if(!c.width||c.width!==c.clientWidth*2)drawWave(d)});const c=$('#masterScope'),ctx=c.getContext('2d');c.width=c.clientWidth*2;c.height=c.clientHeight*2;let data=masterAnalyser?new Uint8Array(masterAnalyser.frequencyBinCount):null;ctx.clearRect(0,0,c.width,c.height);ctx.strokeStyle='#35d5df';ctx.beginPath();for(let x=0;x<c.width;x++){let v=data?data[Math.floor(x/c.width*data.length)]/255:0.5+Math.sin(x*.03)*.15;let y=c.height*(.5-v*.7);x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();requestAnimationFrame(drawLoop)}
async function toggleRecord(){ensureAudio();if(!recorder||recorder.state==='inactive'){chunks=[];recorder=new MediaRecorder(mediaDest.stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{const blob=new Blob(chunks,{type:'audio/webm'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`CONVERGE-DJ-Set-${Date.now()}.webm`;a.click();URL.revokeObjectURL(url);toast('Recording saved to Downloads')};recorder.start();$('#recordBtn').textContent='■ STOP RECORD';$('#recordBtn').style.color='#fff'}else{recorder.stop();$('#recordBtn').textContent='● RECORD';$('#recordBtn').style.color='#ff7777'}}
async function setupMidi(){if(!navigator.requestMIDIAccess){toast('MIDI API not available in this runtime');return}try{const access=await navigator.requestMIDIAccess();const inputs=[...access.inputs.values()];if(!inputs.length){toast('No MIDI controller detected. Connect one and retry.');return}inputs.forEach(input=>input.onmidimessage=handleMidi);toast(`MIDI connected: ${inputs.map(x=>x.name).join(', ')}`)}catch(e){toast('MIDI access denied by system')}}
function handleMidi(e){const [status,note,value]=e.data;const ch=note%4;if((status&0xf0)===0x90&&value>0){if(note<52)action('play',ch);else if(note<56)action('stop',ch);else if(note<60)action('hotcue',ch,note-55)}}
init();