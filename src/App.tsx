import { useEffect, useRef, useState } from "react";

function App() {
  const MINUTES = 60 * 1000;

  const startTimeRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<"focus" | "break">("focus");
  const focusMinRef = useRef(25);
  const breakMinRef = useRef(5);
  const totalMsRef = useRef(25 * MINUTES);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [thinkMinutes, setThinkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [remainingMs, setRemainingMs] = useState(25 * MINUTES);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [muted, setMuted] = useState(false);

  const mutedRef = useRef(false);
  mutedRef.current = muted;

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    return audioCtxRef.current;
  };

  const playTick = (isLoud: boolean) => {
    if (mutedRef.current) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(isLoud ? 200 : 150, ctx.currentTime);
      gain.gain.setValueAtTime(isLoud ? 0.4 : 0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) { }
  };

  const stopTicking = () => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  };

  const startTicking = () => {
    stopTicking();
    let loud = true;
    playTick(loud);
    loud = false;
    tickIntervalRef.current = setInterval(() => {
      playTick(loud);
      loud = !loud;
    }, 1000);
  };

  const getDurationMs = (m?: "focus" | "break") => {
    const target = m ?? modeRef.current;
    return (
      (target === "focus" ? focusMinRef.current : breakMinRef.current) * MINUTES
    );
  };

  const tick = () => {
    if (startTimeRef.current === null) return;

    const elapsed =
      elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current);
    const remaining = Math.max(0, totalMsRef.current - elapsed);

    setRemainingMs(remaining);

    if (remaining === 0) {
      const nextMode = modeRef.current === "focus" ? "break" : "focus";
      modeRef.current = nextMode;
      setMode(nextMode);

      stopTicking();
      if (nextMode === "focus") startTicking();

      const nextDuration = getDurationMs(nextMode);
      totalMsRef.current = nextDuration;
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
      setRemainingMs(nextDuration);

      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  const start = () => {
    if (isRunning) return;
    try {
      getAudioCtx().resume();
    } catch (e) { }

    startTimeRef.current = Date.now();
    setIsRunning(true);
    if (modeRef.current === "focus") startTicking();
    rafRef.current = requestAnimationFrame(tick);
  };

  const pause = () => {
    if (!isRunning || startTimeRef.current === null) return;

    elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
    startTimeRef.current = null;
    stopTicking();

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    setIsRunning(false);
  };

  const stop = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    stopTicking();
    startTimeRef.current = null;
    elapsedBeforePauseRef.current = 0;

    const duration = getDurationMs();
    totalMsRef.current = duration;
    setRemainingMs(duration);
    setIsRunning(false);
  };

  const selectMode = (newMode: "focus" | "break") => {
    if (isRunning) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      startTimeRef.current = null;
      setIsRunning(false);
    }

    stopTicking();
    modeRef.current = newMode;
    setMode(newMode);
    elapsedBeforePauseRef.current = 0;

    const duration = getDurationMs(newMode);
    totalMsRef.current = duration;
    setRemainingMs(duration);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopTicking();
    };
  }, []);

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  const buttonStyle = {
    height: "22px",
    padding: 0,
    fontSize: "11px",
    lineHeight: 1,
  };
  const labelStyle = {
    flex: 1,
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "2px",
    fontSize: "12px",
  };
  const inputStyle = {
    width: "100%",
    minWidth: 0,
    height: "20px",
    padding: "0 2px",
    boxSizing: "border-box" as const,
    fontSize: "12px",
  };

  return (
    <div
      style={{
        width: "92px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <h1
        style={{
          width: "100%",
          fontSize: "36px",
          lineHeight: "48px",
          margin: 0,
          whiteSpace: "nowrap",
        }}
      >
        <strong
          style={{
            display: "block",
            backgroundColor: mode === "focus" ? "#e42e2e" : "#3b9e14",
            padding: "1px",
            paddingRight: "3px",
            paddingLeft: 0,
            borderRadius: "8px",
          }}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </strong>
      </h1>

      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "2px",
        }}
      >
        <button
          style={buttonStyle}
          title="Iniciar"
          onClick={start}
          disabled={isRunning}
        >
          ▶️
        </button>
        <button
          style={buttonStyle}
          title="Pausar"
          onClick={pause}
          disabled={!isRunning}
        >
          ⏸️
        </button>
        <button style={buttonStyle} title="Parar e zerar o tempo" onClick={stop}>
          ⏹️
        </button>
        <button
          style={buttonStyle}
          title={muted ? "Ativar som" : "Desativar som"}
          onClick={() => setMuted((m) => !m)}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <button
          style={buttonStyle}
          title="Mudar para Foco"
          onClick={() => selectMode("focus")}
          disabled={isRunning}
        >
          🎯
        </button>
        <button
          style={buttonStyle}
          title="Mudar para Descanso"
          onClick={() => selectMode("break")}
          disabled={isRunning}
        >
          ☕
        </button>
      </div>

      <div style={{ width: "100%", display: "flex", gap: "4px" }}>
        <label style={labelStyle} title="Tempo de Foco">
          F
          <input
            style={inputStyle}
            type="number"
            min={1}
            value={thinkMinutes}
            disabled={isRunning}
            onChange={(e) => {
              const mins = Number(e.target.value);
              setThinkMinutes(mins);
              focusMinRef.current = mins;
              if (modeRef.current === "focus") {
                const duration = mins * MINUTES;
                totalMsRef.current = duration;
                elapsedBeforePauseRef.current = 0;
                setRemainingMs(duration);
              }
            }}
          />
        </label>
        <label style={labelStyle} title="Tempo de Descanso">
          D
          <input
            style={inputStyle}
            type="number"
            min={1}
            value={breakMinutes}
            disabled={isRunning}
            onChange={(e) => {
              const mins = Number(e.target.value);
              setBreakMinutes(mins);
              breakMinRef.current = mins;
              if (modeRef.current === "break") {
                const duration = mins * MINUTES;
                totalMsRef.current = duration;
                elapsedBeforePauseRef.current = 0;
                setRemainingMs(duration);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

export default App;
