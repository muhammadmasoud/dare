import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

type StopMessingAroundProps = {
  imageSrc?: string;
  onOk: () => void;
};

export function StopMessingAround({ imageSrc = "/stop-messing-around.jpg", onOk }: StopMessingAroundProps) {
  return (
    <motion.div
      className="relative min-h-screen w-full overflow-hidden bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="absolute inset-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,hsl(var(--foreground)/0.08),transparent_55%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--foreground)/0.06))]" />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <motion.main
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-12 text-center"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <motion.h1
          className="font-display text-5xl font-semibold italic leading-none text-foreground sm:text-7xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
        >
          Stop Messing Around 😤
        </motion.h1>

        <motion.p
          className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.12 }}
        >
          Nice try. I fixed the options for you, so now there is only one real answer.
        </motion.p>

        <motion.div
          className="relative w-full overflow-hidden rounded-[2rem] border border-border/40 bg-card/15 p-3 backdrop-blur-md sm:p-4"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.16 }}
        >
          <motion.img
            src={imageSrc}
            alt="Stop messing around"
            className="h-[18rem] w-full rounded-[1.6rem] object-cover sm:h-[22rem]"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[linear-gradient(180deg,transparent,hsl(var(--background)/0.45))]"
            animate={{ opacity: [0.55, 0.75, 0.55], y: [0, -6, 0] }}
            transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.22 }}
          className="w-full max-w-sm"
        >
          <Button type="button" onClick={onOk} className="romantic-shadow h-12 w-full rounded-2xl text-base font-semibold">
            OK
          </Button>
        </motion.div>
      </motion.main>
    </motion.div>
  );
}

