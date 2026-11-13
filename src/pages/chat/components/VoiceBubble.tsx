import { useEffect, useRef, useState } from "react";

type VoiceBubbleProps = {
  audioUrl?: string;
  duration?: number;
  mine: boolean;
};

const BAR_HEIGHTS = [7, 12, 16, 9, 14, 18, 10, 15, 8, 13, 6, 11];

export default function VoiceBubble({ audioUrl, duration = 6, mine }: VoiceBubbleProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const simRef = useRef<number | null>(null);

  const clearSim = () => {
    if (simRef.current) {
      window.clearInterval(simRef.current);
      simRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clearSim();
      audioRef.current?.pause();
    },
    [],
  );

  const reset = () => {
    setPlaying(false);
    setProgress(0);
  };

  const start = () => {
    if (audioUrl) {
      if (!audioRef.current) {
        const audio = new Audio(audioUrl);
        audio.onended = reset;
        audio.ontimeupdate = () => {
          const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration;
          setProgress(Math.min(1, audio.currentTime / total));
        };
        audio.onerror = reset;
        audioRef.current = audio;
      }
      void audioRef.current.play().catch(reset);
      setPlaying(true);
      return;
    }

    // 早期的演示语音没有音频文件，这里按标注时长模拟播放进度
    setPlaying(true);
    setProgress(0);
    const startedAt = Date.now();
    clearSim();
    simRef.current = window.setInterval(() => {
      const ratio = (Date.now() - startedAt) / (Math.max(duration, 1) * 1000);
      if (ratio >= 1) {
        clearSim();
        reset();
        return;
      }
      setProgress(ratio);
    }, 80);
  };

  const toggle = () => {
    if (playing) {
      audioRef.current?.pause();
      clearSim();
      reset();
      return;
    }
    start();
  };

  const width = Math.min(212, 96 + Math.max(duration, 1) * 4.5);
  const activeBars = Math.round(progress * BAR_HEIGHTS.length);

  return (
    <button
      type="button"
      onClick={toggle}
      title={audioUrl ? "播放语音" : "演示语音（无音频文件）"}
      className={[
        "flex items-center gap-2 px-3 h-10 rounded text-[13px] shrink-0 cursor-pointer transition-colors",
        mine
          ? "bg-primary-300 text-foreground-950 hover:bg-primary-400/80"
          : "bg-background-50 text-foreground-950 hover:bg-background-100",
      ].join(" ")}
      style={{ width }}
    >
      <i
        className={`${
          playing ? "ri-pause-circle-fill" : mine ? "ri-voiceprint-line" : "ri-volume-up-line"
        } text-[16px] shrink-0`}
      ></i>

      <span className="flex items-center gap-[3px] h-4">
        {BAR_HEIGHTS.map((height, index) => (
          <span
            key={index}
            className={`w-[2px] rounded-full transition-colors duration-150 ${
              index < activeBars
                ? mine
                  ? "bg-foreground-900/80"
                  : "bg-primary-600"
                : mine
                  ? "bg-foreground-900/30"
                  : "bg-foreground-300"
            } ${playing && index === activeBars ? "wx-voice-bar" : ""}`}
            style={{ height }}
          ></span>
        ))}
      </span>

      <span className="ml-auto text-[11px] text-foreground-600 tabular-nums shrink-0">
        {duration}&quot;
      </span>
    </button>
  );
}