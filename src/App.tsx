import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MainCard } from "@/components/MainCard";
import { StopMessingAround } from "@/components/StopMessingAround";

const queryClient = new QueryClient();

type Scene = "main" | "stop";
type MusicScene = "valentine" | "stop" | "goodgirl";

const STOP_AFTER_ATTEMPTS = 5;

const HomeController = () => {
  const [scene, setScene] = useState<Scene>("main");
  const [doubleYes, setDoubleYes] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [resetToken, setResetToken] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);

  const handleNoAttempt = useCallback((attemptCount: number) => {
    if (attemptCount >= STOP_AFTER_ATTEMPTS) setScene("stop");
  }, []);

  const handleOk = useCallback(() => {
    setDoubleYes(true);
    setResetToken((value) => value + 1);
    setCelebrating(false);
    setScene("main");
  }, []);

  const musicScene: MusicScene = useMemo(() => {
    if (scene === "stop") return "stop";
    if (celebrating) return "goodgirl";
    return "valentine";
  }, [celebrating, scene]);

  const musicSrc = useMemo(() => {
    switch (musicScene) {
      case "valentine":
        return "/audio/Aylex-Italy.mp3";
      case "stop":
        return "/audio/Clowns.mp3";
      case "goodgirl":
        return "/audio/faster.mp3";
    }
  }, [musicScene]);

  const attemptPlayCurrent = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      const playResult = audio.play();
      if (playResult && typeof playResult.then === "function") {
        await playResult;
      }
      setPlaybackBlocked(false);
    } catch {
      setPlaybackBlocked(true);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    audio.src = musicSrc;

    void attemptPlayCurrent();
  }, [attemptPlayCurrent, musicSrc]);

  return (
    <>
      <audio ref={audioRef} preload="auto" playsInline />
      {playbackBlocked ? (
        <button
          type="button"
          onClick={() => void attemptPlayCurrent()}
          className="fixed right-4 top-4 z-[10000] rounded-2xl border border-border/50 bg-card/85 px-4 py-2 text-sm font-semibold text-foreground shadow-lg backdrop-blur-md"
        >
          Enable sound
        </button>
      ) : null}
      <AnimatePresence mode="wait">
        {scene === "stop" ? (
          <StopMessingAround key="stop" onOk={handleOk} />
        ) : (
          <MainCard
            key="main"
            doubleYes={doubleYes}
            resetToken={resetToken}
            onNoAttempt={handleNoAttempt}
            onCelebratingChange={setCelebrating}
          />
        )}
      </AnimatePresence>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeController />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
