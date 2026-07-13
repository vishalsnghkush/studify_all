import React from 'react';
import {View, ActivityIndicator, Text, StatusBar, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import {useTheme} from 'react-native-paper';
import WebView from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function FocusSpace({navigation}) {
  const {colors, dark} = useTheme();
  const user = useSelector(state => state.initial.user);
  const bgColor = dark ? '#080c18' : '#f0f2ff';
  const userName = user?.fname || 'Student';
  const odUserId = user?.user_id || ('guest-' + Math.floor(Math.random() * 9999));

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js"></script>
<style>
:root {
  --primary: #8b5cf6;
  --primary-light: #a78bfa;
  --primary-dark: #7c3aed;
  --accent: #06b6d4;
  --success: #10b981;
  --bg: ${dark ? '#080c18' : '#f0f2ff'};
  --card: ${dark ? 'rgba(15,20,40,0.75)' : 'rgba(255,255,255,0.6)'};
  --card-border: ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'};
  --card-shadow: ${dark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(139,92,246,0.08)'};
  --text: ${dark ? '#f1f0ff' : '#1a1035'};
  --text-dim: ${dark ? '#6b7094' : '#8b8fa8'};
  --glass: ${dark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.04)'};
}
* { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
html, body { height: 100%; overflow: hidden; }
body {
  font-family: 'Inter', sans-serif;
  background: var(--bg);
  color: var(--text);
  display: flex; flex-direction: column; align-items: center;
  height: 100vh; padding: 14px 16px 18px;
  position: relative; overflow: hidden;
}

/* === ANIMATED PARTICLE CANVAS === */
canvas#particles { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

/* === AMBIENT GRADIENT ORBS === */
.orb { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; }
.orb-1 {
  width: 280px; height: 280px; top: -60px; right: -80px;
  background: radial-gradient(circle, ${dark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.08)'} 0%, transparent 70%);
  animation: drift 12s ease-in-out infinite;
}
.orb-2 {
  width: 220px; height: 220px; bottom: 5%; left: -50px;
  background: radial-gradient(circle, ${dark ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.06)'} 0%, transparent 70%);
  animation: drift 10s ease-in-out infinite reverse;
}
.orb-3 {
  width: 160px; height: 160px; top: 45%; left: 60%;
  background: radial-gradient(circle, ${dark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)'} 0%, transparent 70%);
  animation: drift 14s ease-in-out infinite 2s;
}
@keyframes drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(15px, -20px) scale(1.05); }
  66% { transform: translate(-10px, 15px) scale(0.95); }
}

/* === CONTENT === */
.content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; width: 100%; height: 100%; justify-content: space-between; }

/* === PRESENCE PILL === */
.presence {
  display: flex; align-items: center; gap: 8px;
  background: var(--card); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  padding: 7px 16px; border-radius: 50px;
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  font-size: 12px; font-weight: 600; color: var(--text-dim);
}
.live-ring {
  position: relative; width: 8px; height: 8px;
}
.live-ring::before {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  background: #10b981;
  animation: live-ping 2s cubic-bezier(0,0,0.2,1) infinite;
}
.live-ring::after {
  content: ''; position: absolute; inset: 1px; border-radius: 50%;
  background: #10b981; z-index: 1;
}
@keyframes live-ping {
  0% { transform: scale(1); opacity: 1; }
  75%, 100% { transform: scale(2.5); opacity: 0; }
}
.count-num { font-weight: 800; color: var(--text); }

/* === MODE TABS === */
.modes {
  display: flex; gap: 3px; padding: 3px;
  background: var(--card); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-radius: 16px; border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
}
.mode-btn {
  border: none; outline: none; background: transparent;
  color: var(--text-dim); padding: 8px 14px; border-radius: 13px;
  font-size: 11.5px; font-weight: 700; cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  letter-spacing: -0.2px;
}
.mode-btn.active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #fff;
  box-shadow: 0 4px 20px rgba(139,92,246,0.4);
  transform: scale(1.02);
}

/* === TIMER === */
.timer-area {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.timer-wrap {
  position: relative; width: 220px; height: 220px;
  display: flex; align-items: center; justify-content: center;
}
.timer-glow {
  position: absolute; inset: -20px; border-radius: 50%;
  background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
  animation: glow-breathe 4s ease-in-out infinite;
}
@keyframes glow-breathe {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.08); opacity: 1; }
}
.timer-wrap svg {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%; transform: rotate(-90deg);
}
circle { fill: none; }
.track { stroke: ${dark ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.06)'}; stroke-width: 5; }
.progress {
  stroke: url(#grad); stroke-width: 5; stroke-linecap: round;
  transition: stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 0 8px rgba(139,92,246,0.5));
}
.timer-inner { z-index: 2; display: flex; flex-direction: column; align-items: center; }
.time-num {
  font-size: 46px; font-weight: 900; letter-spacing: -3px; line-height: 1;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(180deg, var(--text) 30%, var(--text-dim) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.time-label {
  font-size: 9px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 4px; color: var(--primary-light); margin-top: 4px;
}

/* === CONTROLS === */
.controls { display: flex; align-items: center; gap: 16px; }
.c-btn {
  border: none; outline: none; cursor: pointer; display: flex;
  align-items: center; justify-content: center; border-radius: 50%;
  font-family: 'Inter', sans-serif;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.c-play {
  width: 56px; height: 56px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #fff;
  box-shadow: 0 6px 28px rgba(139,92,246,0.45), 0 2px 8px rgba(139,92,246,0.3);
}
.c-play:active { transform: scale(0.88); }
.c-sec {
  width: 40px; height: 40px;
  background: var(--card); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  color: var(--text-dim); border: 1px solid var(--card-border);
}
.c-sec:active { transform: scale(0.88); }

/* === SESSION DOTS === */
.sessions {
  display: flex; align-items: center; gap: 5px; font-size: 10px;
  font-weight: 600; color: var(--text-dim); letter-spacing: 0.5px;
}
.s-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: ${dark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.1)'};
  transition: all 0.4s ease;
}
.s-dot.done {
  background: var(--primary);
  box-shadow: 0 0 8px rgba(139,92,246,0.4);
}

/* === AMBIENT MIXER === */
.mixer {
  width: 100%; max-width: 340px;
  background: var(--card); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  padding: 14px; border-radius: 20px;
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
}
.mixer-head {
  font-size: 9px; font-weight: 800; text-transform: uppercase;
  letter-spacing: 2px; color: var(--text-dim);
  margin-bottom: 10px; text-align: center;
}
.mixer-grid { display: flex; gap: 8px; }
.m-btn {
  flex: 1; border: none; outline: none; cursor: pointer;
  background: ${dark ? 'rgba(139,92,246,0.04)' : 'rgba(139,92,246,0.03)'};
  color: var(--text-dim); padding: 10px 4px; border-radius: 14px;
  font-size: 10.5px; font-weight: 700; font-family: 'Inter', sans-serif;
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  border: 1px solid transparent;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.m-btn:active { transform: scale(0.94); }
.m-btn.on {
  background: linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.08) 100%);
  color: var(--primary-light);
  border-color: rgba(139,92,246,0.2);
  box-shadow: 0 4px 16px rgba(139,92,246,0.1);
}
.m-ico { font-size: 20px; filter: grayscale(0.3); }
.m-btn.on .m-ico { filter: grayscale(0); }

/* === CUSTOM MODAL === */
.modal-bg {
  display: none; position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  align-items: center; justify-content: center;
}
.modal-bg.show { display: flex; }
.modal-box {
  background: ${dark ? 'rgba(15,20,40,0.97)' : 'rgba(255,255,255,0.98)'};
  border: 1px solid var(--card-border);
  border-radius: 28px; padding: 30px 28px; width: 290px;
  display: flex; flex-direction: column; align-items: center; gap: 18px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.35);
  animation: pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop { from { transform: scale(0.85) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
.modal-title {
  font-size: 18px; font-weight: 800; letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.modal-sub { font-size: 12px; color: var(--text-dim); margin-top: -10px; font-weight: 500; }
.stepper { display: flex; align-items: center; gap: 18px; }
.st-btn {
  width: 46px; height: 46px; border-radius: 50%; border: none; outline: none;
  background: ${dark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.06)'};
  color: var(--primary); font-size: 24px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
}
.st-btn:active { transform: scale(0.85); background: var(--primary); color: #fff; }
.st-val {
  font-size: 48px; font-weight: 900; letter-spacing: -2px;
  min-width: 72px; text-align: center;
  background: linear-gradient(180deg, var(--text) 30%, var(--text-dim) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.st-unit { font-size: 11px; color: var(--text-dim); font-weight: 700; margin-top: -10px; letter-spacing: 1px; text-transform: uppercase; }
.modal-btns { display: flex; gap: 10px; width: 100%; }
.mb {
  flex: 1; border: none; outline: none; padding: 13px; border-radius: 14px;
  font-size: 13px; font-weight: 800; cursor: pointer;
  font-family: 'Inter', sans-serif; transition: all 0.2s ease;
  letter-spacing: -0.2px;
}
.mb-go {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #fff; box-shadow: 0 4px 20px rgba(139,92,246,0.4);
}
.mb-go:active { transform: scale(0.96); }
.mb-x {
  background: ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'};
  color: var(--text-dim);
}
</style>
</head>
<body>
<canvas id="particles"></canvas>
<div class="orb orb-1"></div>
<div class="orb orb-2"></div>
<div class="orb orb-3"></div>

<div class="content">
  <div class="presence">
    <div class="live-ring"></div>
    <span><span class="count-num" id="count">1</span> studying now</span>
  </div>

  <div class="timer-area">
    <div class="modes">
      <button class="mode-btn" onclick="setMode(this,'break',5)">Break</button>
      <button class="mode-btn active" onclick="openCustom(this)">Set Time</button>
    </div>

    <div class="timer-wrap">
      <div class="timer-glow" id="glow"></div>
      <svg viewBox="0 0 100 100">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8b5cf6"/>
            <stop offset="50%" style="stop-color:#06b6d4"/>
            <stop offset="100%" style="stop-color:#8b5cf6"/>
          </linearGradient>
          <linearGradient id="grad-break" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#10b981"/>
            <stop offset="100%" style="stop-color:#06b6d4"/>
          </linearGradient>
        </defs>
        <circle class="track" cx="50" cy="50" r="45"></circle>
        <circle class="progress" id="prog" cx="50" cy="50" r="45" stroke-dasharray="282.7" stroke-dashoffset="0"></circle>
      </svg>
      <div class="timer-inner">
        <div class="time-num" id="time">25:00</div>
        <div class="time-label" id="label">Focus</div>
      </div>
    </div>

    <div class="controls">
      <button class="c-btn c-sec" onclick="resetTimer()">
        <svg style="width:16px;height:16px;fill:currentColor" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
      </button>
      <button class="c-btn c-play" id="playBtn" onclick="toggleTimer()">
        <svg id="playIco" style="width:22px;height:22px;fill:currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
      <button class="c-btn c-sec" onclick="skipMode()">
        <svg style="width:16px;height:16px;fill:currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
      </button>
    </div>

    <div class="sessions" id="sess">
      <span>Session</span>
      <div class="s-dot"></div><div class="s-dot"></div><div class="s-dot"></div><div class="s-dot"></div>
    </div>
  </div>

  <div class="mixer">
    <div class="mixer-head">&#9835; Ambient Sounds</div>
    <div class="mixer-grid">
      <button class="m-btn" id="a-lofi" onclick="toggleAudio('lofi')"><span class="m-ico">&#127911;</span><span>Lo-Fi</span></button>
      <button class="m-btn" id="a-rain" onclick="toggleAudio('rain')"><span class="m-ico">&#127783;&#65039;</span><span>Rain</span></button>
    </div>
  </div>
</div>

<!-- Custom Modal -->
<div class="modal-bg" id="cModal">
  <div class="modal-box">
    <div class="modal-title">Set Time</div>
    <div class="modal-sub">Choose your focus duration</div>
    <div class="stepper">
      <button class="st-btn" onclick="stepC(-5)">&#8722;</button>
      <div class="st-val" id="cVal">25</div>
      <button class="st-btn" onclick="stepC(5)">+</button>
    </div>
    <div class="st-unit">minutes</div>
    <div class="modal-btns">
      <button class="mb mb-x" onclick="closeC()">Cancel</button>
      <button class="mb mb-go" onclick="applyC()">Set</button>
    </div>
  </div>
</div>

<audio id="p-lofi" loop src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"></audio>
<audio id="p-rain" loop src="https://upload.wikimedia.org/wikipedia/commons/transcoded/8/8a/Sound_of_rain.ogg/Sound_of_rain.ogg.mp3"></audio>

<script>
/* === PARTICLE SYSTEM === */
var canvas = document.getElementById('particles');
var ctx = canvas.getContext('2d');
var pts = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas(); window.addEventListener('resize', resizeCanvas);
for (var i = 0; i < 40; i++) {
  pts.push({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.3, dx: (Math.random() - 0.5) * 0.3, dy: (Math.random() - 0.5) * 0.3,
    o: Math.random() * 0.3 + 0.05
  });
}
function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < pts.length; i++) {
    var p = pts[i];
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(139,92,246,' + p.o + ')'; ctx.fill();
    p.x += p.dx; p.y += p.dy;
    if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
  }
  requestAnimationFrame(drawParticles);
}
drawParticles();

/* === TIMER === */
var mode = 'custom', duration = 1500, timeLeft = 1500, timerId = null, isRunning = false, sessions = 0;
var timeEl = document.getElementById('time');
var labelEl = document.getElementById('label');
var playBtn = document.getElementById('playBtn');
var prog = document.getElementById('prog');
var countEl = document.getElementById('count');

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function updateDisplay() {
  timeEl.innerText = pad(Math.floor(timeLeft / 60)) + ':' + pad(timeLeft % 60);
  prog.style.strokeDashoffset = 282.7 * (1 - timeLeft / duration);
}

function setMode(el, m, mins) {
  var btns = document.querySelectorAll('.mode-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  el.classList.add('active');
  mode = m; duration = mins * 60; timeLeft = duration;
  labelEl.innerText = 'Break';
  prog.style.stroke = 'url(#grad-break)';
  pauseTimer(); updateDisplay();
}

function skipMode() {
  var btns = document.querySelectorAll('.mode-btn');
  if (mode === 'custom') {
    setMode(btns[0], 'break', 5);
  } else {
    mode = 'custom'; duration = cMins * 60; timeLeft = duration;
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    btns[1].classList.add('active');
    labelEl.innerText = 'Focus'; prog.style.stroke = 'url(#grad)';
    pauseTimer(); updateDisplay();
  }
}

/* Custom modal */
var cMins = 25;
function openCustom(el) {
  cMins = Math.floor(duration / 60) || 25;
  document.getElementById('cVal').innerText = cMins;
  document.getElementById('cModal').classList.add('show');
}
function closeC() { document.getElementById('cModal').classList.remove('show'); }
function stepC(d) { cMins = Math.max(1, Math.min(180, cMins + d)); document.getElementById('cVal').innerText = cMins; }
function applyC() {
  closeC();
  var btns = document.querySelectorAll('.mode-btn');
  for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  btns[1].classList.add('active');
  mode = 'custom'; duration = cMins * 60; timeLeft = duration;
  labelEl.innerText = 'Focus'; prog.style.stroke = 'url(#grad)';
  pauseTimer(); updateDisplay();
}

function toggleTimer() { isRunning ? pauseTimer() : startTimer(); }
function startTimer() {
  isRunning = true;
  playBtn.innerHTML = '<svg style="width:22px;height:22px;fill:currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
  timerId = setInterval(function() {
    if (timeLeft > 0) { timeLeft--; updateDisplay(); }
    else {
      clearInterval(timerId);
      if (mode === 'custom') { sessions = Math.min(sessions + 1, 4); updateDots(); }
      resetTimer();
    }
  }, 1000);
}
function pauseTimer() {
  isRunning = false;
  playBtn.innerHTML = '<svg style="width:22px;height:22px;fill:currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
  clearInterval(timerId);
}
function resetTimer() { pauseTimer(); timeLeft = duration; updateDisplay(); }

function updateDots() {
  var dots = document.querySelectorAll('.s-dot');
  for (var i = 0; i < dots.length; i++) {
    if (i < sessions) dots[i].classList.add('done'); else dots[i].classList.remove('done');
  }
}

function toggleAudio(type) {
  var btn = document.getElementById('a-' + type);
  var player = document.getElementById('p-' + type);
  if (player.paused) {
    player.volume = 0; player.play(); btn.classList.add('on');
    var v = 0; var fi = setInterval(function() { if (v < 0.3) { v += 0.04; player.volume = v; } else clearInterval(fi); }, 35);
  } else {
    var v2 = player.volume;
    var fo = setInterval(function() { if (v2 > 0.04) { v2 -= 0.04; player.volume = v2; } else { player.pause(); btn.classList.remove('on'); clearInterval(fo); } }, 35);
  }
}

/* === MQTT REAL PRESENCE === */
var userId = ${JSON.stringify(String(odUserId))};
var activeUsers = {};
try {
  var client = new Paho.MQTT.Client('api.studifysuccess.com', 443, '/', 'focus-' + userId + '-' + Date.now());
  client.onConnectionLost = function() { setTimeout(mqttGo, 5000); };
  client.onMessageArrived = function(msg) {
    try { var p = JSON.parse(msg.payloadString); if (p.uid) { activeUsers[p.uid] = Date.now(); refreshC(); } } catch(e) {}
  };
  function mqttGo() {
    try { client.connect({ useSSL: true, onSuccess: function() { client.subscribe('studify/focus/presence'); hb(); }, onFailure: function() { setTimeout(mqttGo, 8000); } }); } catch(e) {}
  }
  function hb() {
    try { if (client.isConnected()) { var m = new Paho.MQTT.Message(JSON.stringify({uid:userId,t:Date.now()})); m.destinationName='studify/focus/presence'; client.send(m); } } catch(e) {}
  }
  function refreshC() {
    var now = Date.now(); for (var id in activeUsers) { if (now - activeUsers[id] > 20000) delete activeUsers[id]; }
    countEl.innerText = Math.max(1, Object.keys(activeUsers).length);
  }
  mqttGo(); setInterval(hb, 8000); setInterval(refreshC, 3000);
} catch(e) { countEl.innerText = '1'; }

updateDisplay();
</script>
</body>
</html>`;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: bgColor}}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(139,92,246,0.06)',
        backgroundColor: dark ? 'rgba(8,12,24,0.95)' : 'rgba(240,242,255,0.95)',
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 6}}>
          <View><Icon name="close" size={22} color={colors.onSurface} /></View>
        </TouchableOpacity>
        <Text style={{fontSize: 15, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.5}}>Focus Space</Text>
        <View style={{width: 34}} />
      </View>
      <WebView
        source={{html: htmlContent}}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        style={{flex: 1, backgroundColor: bgColor}}
        renderLoading={() => (
          <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor}}>
            <ActivityIndicator size="large" color="#8b5cf6" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
