import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api, API, INTERVIEW_CODE_KEY } from "../lib/api";
import { Mic, Square, Loader2, CheckCircle2, Camera, AudioLines, ArrowRight } from "lucide-react";
import { toast } from "sonner";

// Helper for the raw fetch() calls (FormData uploads + TTS) so they also send
// the candidate's interview code via header — required for browsers that block
// the cross-site cookie (Safari, iOS, Brave, Firefox strict).
function candidateHeaders() {
  try {
    const code = localStorage.getItem(INTERVIEW_CODE_KEY);
    return code ? { "x-interview-code": code } : {};
  } catch { return {}; }
}

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const checkVideoRef = useRef(null);
  const sessionVideoRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const countdownTimer = useRef(null);

  const [phase, setPhase] = useState("check"); // check | countdown | interview | done
  const [interview, setInterview] = useState(null);
  const [currentQ, setCurrentQ] = useState("");
  const [qIndex, setQIndex] = useState(1);
  const [totalQ, setTotalQ] = useState(0);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [micLevel, setMicLevel] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/interviews/${id}`);
        setInterview(data);
        const answered = data.questions.filter((q) => q.a).length;
        const lastQ = data.questions.find((q) => !q.a) || data.questions[data.questions.length - 1];
        setCurrentQ(lastQ.q);
        setTotalQ(data.questions.length);
        setQIndex(answered + 1);
        // If resuming, skip device check + countdown
        if (answered > 0) {
          await initMedia(true);
          setPhase("interview");
          await speak(lastQ.q);
        } else {
          await initMedia(false);
        }
      } catch (e) {
        toast.error("Could not load interview"); navigate("/");
      }
    })();
    return () => {
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { audioCtxRef.current?.close(); } catch {}
    };
    // eslint-disable-next-line
  }, [id]);

  async function initMedia(bindSessionVideo) {
    // Older iOS Safari (< 14.3) and some embedded browsers don't support MediaRecorder.
    // Detect early and surface a clear, friendly message instead of failing silently mid-interview.
    if (typeof window.MediaRecorder === "undefined") {
      toast.error("Your browser doesn't support video recording. Please use Chrome, Safari 14.3+, or update your browser.");
      setMediaReady(false);
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Your browser cannot access the camera/mic. Please use the latest Chrome or Safari.");
      setMediaReady(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setMediaReady(true);
      // Bind to device-check video immediately
      if (checkVideoRef.current) {
        checkVideoRef.current.srcObject = stream;
        checkVideoRef.current.muted = true;
        checkVideoRef.current.play().catch(()=>{});
      }
      if (bindSessionVideo && sessionVideoRef.current) {
        sessionVideoRef.current.srcObject = stream;
        sessionVideoRef.current.muted = true;
        sessionVideoRef.current.play().catch(()=>{});
      }
      // Mic level meter
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs(data[i] - 128);
          if (v > peak) peak = v;
        }
        setMicLevel(Math.min(100, Math.round((peak / 128) * 200)));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      toast.error("Could not access camera or microphone. Please grant permissions and refresh.");
    }
  }

  async function proceedFromCheck() {
    setPhase("countdown");
    // Bind stream to session video element now that it's mounted
    requestAnimationFrame(() => {
      if (sessionVideoRef.current && streamRef.current) {
        sessionVideoRef.current.srcObject = streamRef.current;
        sessionVideoRef.current.muted = true;
        sessionVideoRef.current.play().catch(()=>{});
      }
    });
    await runCountdown(30);
    setPhase("interview");
    await speak(currentQ);
  }

  function runCountdown(s) {
    return new Promise((resolve) => {
      setCountdown(s);
      countdownTimer.current = setInterval(() => {
        setCountdown((c) => {
          if (c === null) return null;
          if (c <= 1) {
            clearInterval(countdownTimer.current);
            countdownTimer.current = null;
            setCountdown(null);
            resolve();
            return null;
          }
          return c - 1;
        });
      }, 1000);
    });
  }
  function skipCountdown() {
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    countdownTimer.current = null;
    setCountdown(null);
  }

  async function speak(text) {
    setAiSpeaking(true);
    try {
      const res = await fetch(`${API}/tts`, {
        method: "POST", headers: { "Content-Type": "application/json", ...candidateHeaders() },
        credentials: "include", body: JSON.stringify({ text, voice: "nova" }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await new Promise((r) => { audio.onended = r; audio.onerror = r; audio.play().catch(() => r()); });
    } catch {}
    setAiSpeaking(false);
  }

  function startRec() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    // Pick a mimeType the current browser actually supports.
    // iOS Safari, for example, cannot record video/webm and needs video/mp4.
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4;codecs=h264,aac",
      "video/mp4",
    ];
    const mimeType = candidates.find((mt) =>
      typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mt)
    );
    // Cap bitrate so a 2-minute answer is ~25MB instead of 200-500MB.
    // 1.2 Mbps video + 64 kbps audio is plenty for face-cam at 720p.
    const opts = { videoBitsPerSecond: 1_200_000, audioBitsPerSecond: 64_000 };
    let rec;
    try {
      rec = new MediaRecorder(streamRef.current, mimeType ? { mimeType, ...opts } : opts);
    } catch {
      try { rec = new MediaRecorder(streamRef.current); }
      catch { toast.error("Recording isn't supported on this browser. Please use Chrome or Safari 14.3+."); return; }
    }
    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.start();
    recorderRef.current = rec;
    setRecording(true);
  }

  const [processingMsg, setProcessingMsg] = useState("");

  async function stopRecAndSubmit() {
    setRecording(false); setBusy(true);
    try {
      const rec = recorderRef.current;
      await new Promise((res) => { rec.onstop = res; rec.stop(); });
      const recordedType = rec.mimeType || "video/webm";
      const ext = recordedType.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type: recordedType });
      const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);
      setProcessingMsg(`Uploading & transcribing (${sizeMb} MB) — runs in parallel`);

      // ⚡️ Run video upload + Whisper transcription IN PARALLEL.
      // Previously these ran sequentially, doubling the wait time on every question.
      const uploadFD = new FormData(); uploadFD.append("file", blob, `q${qIndex}.${ext}`);
      const sttFD = new FormData(); sttFD.append("file", blob, `q${qIndex}.${ext}`);

      const uploadPromise = fetch(`${API}/upload/video`, {
        method: "POST", body: uploadFD, credentials: "include", headers: candidateHeaders(),
      }).then((r) => r.json()).then((j) => j.url || "").catch(() => "");

      const sttPromise = fetch(`${API}/stt`, {
        method: "POST", body: sttFD, credentials: "include", headers: candidateHeaders(),
      }).then((r) => r.json()).then((j) => j.text || "").catch(() => "");

      const [videoUrl, sttText] = await Promise.all([uploadPromise, sttPromise]);
      const text = sttText || "(no audio detected)";

      setProcessingMsg("Saving answer…");
      const { data } = await api.post(`/interviews/${id}/respond`, { answer: text, video_url: videoUrl });

      if (data.is_final) {
        setProcessingMsg("Finalizing…");
        await finishInterview();
      } else if (data.next_question) {
        setQIndex((n) => n + 1);
        setTotalQ(data.questions?.length || totalQ);
        setCurrentQ(data.next_question);
        setProcessingMsg("Loading next question…");
        await speak(data.next_question);
      }
    } catch (e) { toast.error("Submit failed"); }
    finally { setBusy(false); setProcessingMsg(""); }
  }

  async function finishInterview() {
    setBusy(true);
    try {
      await api.post(`/interviews/${id}/complete`, {});
      setPhase("done");
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      setTimeout(() => navigate(`/interview/${id}/thanks`), 1200);
    } catch { toast.error("Could not finalize"); }
    finally { setBusy(false); }
  }

  if (!interview) return <div className="p-12">Loading…</div>;

  // ----- PHASE 1: Device check -----
  if (phase === "check") {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Navbar/>
        <main className="max-w-5xl mx-auto px-6 sm:px-8 py-10" data-testid="device-check">
          <div className="overline text-[#002FA7] mb-2">// PRE-INTERVIEW CHECK — {interview.role}</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tighter">Let's make sure you're ready.</h1>
          <p className="text-gray-600 text-sm mt-3">Check your camera and microphone. When everything looks and sounds good, proceed to the 30-second get-ready countdown.</p>

          <div className="grid lg:grid-cols-5 gap-8 mt-10">
            <div className="lg:col-span-3">
              <div className="card-bold bg-black overflow-hidden">
                <video ref={checkVideoRef} className="w-full aspect-video object-cover" data-testid="check-video" playsInline autoPlay muted/>
              </div>
              <div className="mt-3 text-xs text-gray-500 flex items-center gap-2"><Camera className="w-3 h-3"/> Camera preview</div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="card-flat p-6">
                <div className="overline mb-3 text-gray-500 flex items-center gap-2"><Mic className="w-3 h-3"/> Microphone level</div>
                <div className="h-4 bg-gray-200 relative overflow-hidden border border-gray-300">
                  <div className="absolute inset-y-0 left-0 bg-[#002FA7] transition-[width] duration-75" style={{width:`${micLevel}%`}} data-testid="mic-level-bar"/>
                </div>
                <p className="text-xs text-gray-500 mt-3">Say something to see the bar move. Aim for consistent motion when you speak at a normal volume.</p>
              </div>

              <div className="card-flat p-6 text-sm space-y-2">
                <div className="overline text-gray-500 mb-2">Tips</div>
                <p>· Find a quiet room with good lighting on your face.</p>
                <p>· Keep your camera at eye level.</p>
                <p>· Headphones reduce echo.</p>
              </div>

              <button onClick={proceedFromCheck} disabled={!mediaReady} className="btn-primary w-full inline-flex items-center justify-center gap-2" data-testid="proceed-button">
                {mediaReady ? <>Proceed <ArrowRight className="w-4 h-4"/></> : "Waiting for permissions…"}
              </button>
              <p className="text-xs text-gray-500 text-center">You'll get a 30-second countdown next.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ----- PHASE 2+3: Countdown + Interview (share same layout; camera visible throughout) -----
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar/>
      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-8" data-testid="session-page">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="overline text-[#002FA7] mb-2">// LIVE — {interview.role}</div>
            <h1 className="font-display text-2xl font-bold tracking-tighter">Question {qIndex}<span className="text-gray-400 font-mono text-base"> / {totalQ}</span></h1>
          </div>
          <div className={`overline ${aiSpeaking ? "text-[#002FA7]" : recording ? "text-[#FF3B30]" : "text-gray-400"}`} data-testid="status-indicator">
            {countdown !== null ? "Get ready" : aiSpeaking ? "Scorebar speaking" : recording ? "● Recording" : "Idle"}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 mt-8">
          {/* Question card (prominent) */}
          <div style={{backgroundColor:"#111827", color:"#fff"}} className={`lg:col-span-3 card-bold overflow-hidden relative p-6 sm:p-8 min-h-[320px] flex flex-col ${recording ? "recording-ring" : ""}`} data-testid="question-card">
            <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none"/>
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="overline text-[#FF3B30]">Scorebar asks</div>
              {countdown !== null && (
                <div className="flex items-center gap-2 bg-black/60 border border-white/30 px-3 py-1.5" data-testid="countdown-badge">
                  <span className="overline text-[#FF3B30]">Starts in</span>
                  <span className="font-display text-xl font-bold tabular-nums" data-testid="countdown-number">{countdown}s</span>
                </div>
              )}
            </div>
            <div className="relative z-10 flex-1 flex items-center">
              <p className="font-display text-xl sm:text-2xl lg:text-3xl tracking-tight leading-snug break-words w-full" data-testid="current-question">
                {currentQ || "Preparing your question…"}
              </p>
            </div>
            <div className="relative z-10 mt-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <AudioLines className={`w-4 h-4 ${aiSpeaking ? "animate-pulse text-[#002FA7]" : ""}`} strokeWidth={1.5}/>
                {aiSpeaking ? "Scorebar is reading the question aloud" : recording ? "Your answer is being recorded" : countdown !== null ? "Get ready — Scorebar will begin automatically" : "Take your time — press Record when ready"}
              </div>
              {countdown !== null && (
                <button onClick={skipCountdown} className="text-xs underline text-white hover:text-gray-300" data-testid="skip-countdown">Skip &amp; start now</button>
              )}
            </div>
          </div>

          {/* Camera preview (always visible during interview) */}
          <div className="lg:col-span-2">
            <div className={`card-bold bg-black overflow-hidden ${recording ? "recording-ring" : ""}`}>
              <video ref={sessionVideoRef} className="w-full aspect-video object-cover" data-testid="session-video" playsInline autoPlay muted/>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2"><Camera className="w-3 h-3"/> You</div>
              <div className="flex items-center gap-2"><Mic className="w-3 h-3"/>
                <div className="h-1.5 w-20 bg-gray-200 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-[#10B981]" style={{width:`${micLevel}%`}}/>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="mt-8 flex flex-wrap gap-3">
          {!recording && phase !== "done" && <button onClick={startRec} disabled={busy||aiSpeaking||countdown!==null} className="btn-primary inline-flex items-center gap-2" data-testid="record-button"><Mic className="w-4 h-4"/> Record answer</button>}
          {recording && <button onClick={stopRecAndSubmit} className="btn-secondary inline-flex items-center gap-2" data-testid="stop-button"><Square className="w-4 h-4"/> Stop &amp; submit</button>}
          <button onClick={finishInterview} disabled={busy||recording||phase==="done"} className="btn-secondary" data-testid="finish-button">Finish interview</button>
          {busy && <span className="inline-flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin"/> {processingMsg || "Processing…"}</span>}
          {phase === "done" && <span className="inline-flex items-center gap-2 text-sm text-[#10B981]"><CheckCircle2 className="w-4 h-4"/> Scoring…</span>}
        </div>

        <p className="text-xs text-gray-500 mt-6">Tip: speak at a natural pace. Each answer is recorded as a separate clip — HR reviews each one individually.</p>
      </main>
    </div>
  );
}
