import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Position = {
  x: number;
  y: number;
};

type Point = {
  x: number;
  y: number;
};

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

type MainCardProps = {
  doubleYes: boolean;
  resetToken: number;
  onNoAttempt: (attemptCount: number) => void;
  onCelebratingChange?: (value: boolean) => void;
};

export function MainCard({ doubleYes, resetToken, onNoAttempt, onCelebratingChange }: MainCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const zoneRef = useRef<HTMLDivElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [hoverAttempts, setHoverAttempts] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [noPosition, setNoPosition] = useState<Position>({ x: 0, y: 0 });

  const mouseRef = useRef<Point>({ x: Number.NaN, y: Number.NaN });
  const escapeRafRef = useRef<number | null>(null);
  const lastEscapeAtRef = useRef(0);
  const noPositionRef = useRef<Position>({ x: 0, y: 0 });
  const hoverAttemptsRef = useRef(0);

  const hearts = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        id: index,
        left: randomBetween(6, 94),
        drift: randomBetween(-60, 60),
        delay: index * 0.28,
        duration: randomBetween(6.5, 10.5),
        emoji: ["💖", "💘", "💕", "❤️"][index % 4],
      })),
    [],
  );

  const mainImage = "/date.webp";
  const mainImageAlt = "Date photo";
  const celebrationGifMp4 = "https://media.tenor.com/C7T4wgBoMwIAAAPo/cat-kiss-cat-meme.mp4";

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    onCelebratingChange?.(celebrating);
  }, [celebrating, onCelebratingChange]);

  const getZoneMetrics = () => {
    const zone = zoneRef.current;
    if (!zone) return null;

    const { width, height } = zone.getBoundingClientRect();
    const buttonWidth = width < 330 ? 128 : 144;
    const buttonHeight = 56;
    const gap = width < 330 ? 16 : 24;
    const totalWidth = buttonWidth * 2 + gap;
    const startX = Math.max((width - totalWidth) / 2, 0);
    const y = Math.max((height - buttonHeight) / 2, 0);

    return {
      width,
      height,
      buttonWidth,
      buttonHeight,
      gap,
      yesX: startX,
      noX: startX + buttonWidth + gap,
      y,
    };
  };

  const getViewportSize = () => {
    const viewport = window.visualViewport;
    return {
      width: viewport?.width ?? window.innerWidth,
      height: viewport?.height ?? window.innerHeight,
    };
  };

  const syncNoToYesButton = useCallback(() => {
    const yesEl = yesButtonRef.current;
    if (!yesEl) return;
    const rect = yesEl.getBoundingClientRect();
    const { width: viewportWidth, height: viewportHeight } = getViewportSize();

    const width = rect.width || 144;
    const height = rect.height || 56;
    const gap = viewportWidth < 480 ? 16 : 24;

    const padding = Math.max(16, Math.min(72, Math.round(viewportWidth * 0.08)));

    const rightCandidate = rect.left + width + gap;
    const leftCandidate = rect.left - gap - width;
    const prefersRight = rightCandidate + width <= viewportWidth - padding;
    const candidateX = prefersRight ? rightCandidate : leftCandidate;

    const x = Math.min(Math.max(candidateX, padding), viewportWidth - padding - width);
    const y = Math.min(Math.max(rect.top, padding), viewportHeight - padding - height);

    const initial = { x, y };
    setNoPosition(initial);
    noPositionRef.current = initial;
  }, []);

  useEffect(() => {
    syncNoToYesButton();
    // Ensure we resync after fonts/images/layout settle (common on mobile).
    let raf2: number | null = null;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        syncNoToYesButton();
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2 !== null) window.cancelAnimationFrame(raf2);
    };
  }, [syncNoToYesButton]);

  useEffect(() => {
    noPositionRef.current = noPosition;
  }, [noPosition]);

  useEffect(() => {
    hoverAttemptsRef.current = hoverAttempts;
  }, [hoverAttempts]);

  useEffect(() => {
    if (!celebrating || shouldReduceMotion) return;

    const burst = () => {
      confetti({
        particleCount: 140,
        spread: 110,
        startVelocity: 42,
        origin: { y: 0.55 },
        colors: ["#ff7eb6", "#ffb3d1", "#ffffff", "#d9b8ff"],
      });
    };

    burst();
    const timer = window.setTimeout(burst, 260);
    return () => window.clearTimeout(timer);
  }, [celebrating, shouldReduceMotion]);

  useEffect(() => {
    setHoverAttempts(0);
    setCelebrating(false);
    syncNoToYesButton();
    hoverAttemptsRef.current = 0;
  }, [resetToken, syncNoToYesButton]);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const triggerNoEscape = useCallback(
    (mouseX: number, mouseY: number) => {
      if (doubleYes || celebrating || shouldReduceMotion) return;
      if (hoverAttemptsRef.current >= 5) return;

      if (!Number.isFinite(mouseX) || !Number.isFinite(mouseY)) return;

      const yesEl = yesButtonRef.current;
      const yesRect = yesEl?.getBoundingClientRect();
      const buttonWidth = yesRect?.width ?? 144;
      const buttonHeight = yesRect?.height ?? 56;

      const currentNoPosition = noPositionRef.current;
      const centerX = currentNoPosition.x + buttonWidth / 2;
      const centerY = currentNoPosition.y + buttonHeight / 2;

      const dx = centerX - mouseX;
      const dy = centerY - mouseY;
      const distance = Math.hypot(dx, dy);

      const threshold = 130;
      if (distance > threshold) return;

      const now = performance.now();
      if (now - lastEscapeAtRef.current < 70) return;
      lastEscapeAtRef.current = now;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 100;

      const minX = padding;
      const maxX = Math.max(viewportWidth - padding - buttonWidth, minX);
      const minY = padding;
      const maxY = Math.max(viewportHeight - padding - buttonHeight, minY);

      let newX: number;
      let newY: number;
      do {
        newX = Math.random() * (maxX - minX) + minX;
        newY = Math.random() * (maxY - minY) + minY;
      } while (Math.abs(newX - mouseX) < 200 && Math.abs(newY - mouseY) < 200);

      if (yesRect) {
        const overlapsYes =
          newX < yesRect.left + yesRect.width + 16 &&
          newX + buttonWidth > yesRect.left - 16 &&
          newY < yesRect.top + yesRect.height + 16 &&
          newY + buttonHeight > yesRect.top - 16;

        if (overlapsYes) {
          newX = clamp(newX + (newX < yesRect.left ? -buttonWidth : buttonWidth), minX, maxX);
          newY = clamp(newY + (newY < yesRect.top ? -buttonHeight : buttonHeight), minY, maxY);
        }
      }

      const nextAttempts = hoverAttemptsRef.current + 1;
      setHoverAttempts(nextAttempts);
      onNoAttempt(nextAttempts);

      const next = { x: newX, y: newY };
      noPositionRef.current = next;
      setNoPosition(next);
    },
    [celebrating, clamp, doubleYes, onNoAttempt, shouldReduceMotion],
  );

  const stepNoEscape = useCallback(() => {
    escapeRafRef.current = null;
    const mouse = mouseRef.current;
    if (!Number.isFinite(mouse.x) || !Number.isFinite(mouse.y)) return;
    triggerNoEscape(mouse.x, mouse.y);
  }, [triggerNoEscape]);

  useEffect(() => {
    if (doubleYes || celebrating || shouldReduceMotion) return;

    const onMouseMove = (event: MouseEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY };
      if (escapeRafRef.current !== null) return;
      escapeRafRef.current = window.requestAnimationFrame(stepNoEscape);
    };

    const onResize = () => {
      if (doubleYes) return;
      syncNoToYesButton();
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
      if (escapeRafRef.current !== null) {
        window.cancelAnimationFrame(escapeRafRef.current);
        escapeRafRef.current = null;
      }
    };
  }, [celebrating, doubleYes, shouldReduceMotion, stepNoEscape, syncNoToYesButton]);

  const handleYes = () => setCelebrating(true);

  return (
    <div className="romantic-page relative min-h-screen overflow-hidden">
      {!doubleYes && !celebrating && portalReady
        ? createPortal(
            <motion.div
              className="fixed left-0 top-0 z-[9999]"
              animate={{ x: noPosition.x, y: noPosition.y }}
              transition={{
                type: "spring",
                stiffness: 520,
                damping: 20,
              }}
            >
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onPointerEnter={(event) => {
                  triggerNoEscape(event.clientX, event.clientY);
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                className="h-14 w-32 rounded-2xl border border-border/60 bg-card/85 text-base font-semibold text-foreground shadow-lg backdrop-blur-sm sm:w-36 sm:text-lg"
              >
                NO 😈
              </Button>
            </motion.div>,
            document.body,
          )
        : null}
      <motion.div
        aria-hidden="true"
        className="romantic-orb romantic-orb-1"
        animate={shouldReduceMotion ? undefined : { x: [0, 24, -18, 0], y: [0, -26, 12, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 11, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="romantic-orb romantic-orb-2"
        animate={shouldReduceMotion ? undefined : { x: [0, -32, 16, 0], y: [0, 22, -16, 0], scale: [1, 0.94, 1.06, 1] }}
        transition={{ duration: 13, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="romantic-orb romantic-orb-3"
        animate={shouldReduceMotion ? undefined : { x: [0, 12, -26, 0], y: [0, -18, 18, 0], scale: [1, 1.05, 0.92, 1] }}
        transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {celebrating ? (
            <motion.main
              key="celebration"
              className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <div className="absolute inset-0">
                <img src={mainImage} alt={mainImageAlt} className="h-full w-full object-cover opacity-20 blur-2xl" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)/0.2),hsl(var(--background)/0.92))]" />
              </div>

              {!shouldReduceMotion &&
                hearts.map((heart) => (
                  <motion.span
                    key={heart.id}
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-[-10vh] text-3xl sm:text-5xl"
                    style={{ left: `${heart.left}%` }}
                    initial={{ opacity: 0, y: "0vh", scale: 0.75 }}
                    animate={{ opacity: [0, 1, 1, 0], y: ["0vh", "-120vh"], x: [0, heart.drift, heart.drift / -2], scale: [0.75, 1, 1.15] }}
                    transition={{ duration: heart.duration, delay: heart.delay, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  >
                    {heart.emoji}
                  </motion.span>
                ))}

              <motion.div
                className="glass-panel relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-14 text-center sm:px-10"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <motion.div
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground romantic-shadow"
                  animate={shouldReduceMotion ? undefined : { scale: [1, 1.08, 1], rotate: [0, -6, 6, 0] }}
                  transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                  <Heart className="h-11 w-11 fill-current" />
                </motion.div>

                <div className="space-y-4">
                  <p className="inline-flex items-center gap-2 rounded-full bg-secondary/70 px-4 py-2 text-sm font-semibold text-secondary-foreground">
                    <Sparkles className="h-4 w-4" />
                    Mission accomplished
                  </p>
                  <h1 className="font-display text-5xl font-semibold italic leading-none text-foreground sm:text-7xl">Good Girl ❤️</h1>
                  <p className="mx-auto max-w-xl text-lg text-muted-foreground sm:text-xl">
                    You picked the right answer, and now the whole page is blushing for us.
                  </p>
                </div>

                <div className="soft-panel w-full max-w-2xl overflow-hidden rounded-[2rem] border border-border/50">
                  <div className="flex items-center justify-center p-4 sm:p-6">
                    <div className="w-full max-w-[22rem] sm:max-w-[24rem]">
                      <AspectRatio ratio={1}>
                        <div className="h-full w-full overflow-hidden rounded-[1.5rem] bg-card/20">
                          <video
                            className="h-full w-full object-cover"
                            src={celebrationGifMp4}
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        </div>
                      </AspectRatio>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.main>
          ) : (
            <motion.main
              key="question"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 1.02 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="w-full max-w-5xl"
            >
              <Card className="glass-panel overflow-hidden border-border/50">
                <CardContent className="p-0">
                  <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
                    <div className="relative p-4 sm:p-5">
                      <div className="relative overflow-hidden rounded-[2rem]">
                        <AspectRatio ratio={1}>
                          <motion.img
                            src={mainImage}
                            alt={mainImageAlt}
                            className="h-full w-full object-cover"
                            whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          />
                        </AspectRatio>
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)/0.02),hsl(var(--background)/0.38))]" />
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-6 px-6 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12">
                      <div className="space-y-4 text-left">
                        <h1 className="font-display text-5xl font-semibold italic leading-none text-foreground sm:text-6xl">Will You Be My Date?</h1>
                      </div>

                      <div ref={zoneRef} className="relative flex min-h-[5.75rem] items-center justify-center gap-4 sm:gap-6">
                        <Button
                          type="button"
                          size="lg"
                          ref={yesButtonRef}
                          onClick={handleYes}
                          className="romantic-shadow h-14 w-32 rounded-2xl text-base font-semibold sm:w-36 sm:text-lg"
                        >
                          YES 💖
                        </Button>

                        {doubleYes ? (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
                            <Button
                              type="button"
                              size="lg"
                              onClick={handleYes}
                              className="romantic-shadow h-14 w-32 rounded-2xl text-base font-semibold sm:w-36 sm:text-lg"
                            >
                              YES 💖
                            </Button>
                          </motion.div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

