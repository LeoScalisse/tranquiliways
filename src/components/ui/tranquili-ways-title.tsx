import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

const blurIn = {
  hidden: { opacity: 0, filter: "blur(8px)" },
  show: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.3 } },
};

export const TranquiliWaysTitle: React.FC = () => {
  const [phase, setPhase] = React.useState<"full" | "transition" | "ways">("full");

  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase("transition"), 3000);
    const t2 = setTimeout(() => setPhase("ways"), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const containerIn = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: 0.1 },
    },
  };

  const tranquiliChars = "Tranquili".split("");
  const waysChars = "Ways".split("");

  return (
    <div className="flex justify-center mb-16 mt-[-40px]">
      <div className="relative flex items-center justify-center min-h-[80px]">
        <AnimatePresence mode="wait">
          {phase === "full" && (
            <motion.div
              key="full"
              className="flex"
              variants={containerIn}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
            >
              {tranquiliChars.map((char, i) => (
                <motion.span
                  key={`t-${i}`}
                  variants={blurIn}
                  className="text-4xl sm:text-5xl md:text-6xl font-bold text-white"
                >
                  {char}
                </motion.span>
              ))}
              {waysChars.map((char, i) => (
                <motion.span
                  key={`w-${i}`}
                  variants={blurIn}
                  className="text-4xl sm:text-5xl md:text-6xl font-bold"
                  style={{ color: "#ffdb58" }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>
          )}

          {phase === "transition" && (
            <motion.div
              key="transition"
              className="flex"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            >
              <motion.span
                className="flex overflow-hidden"
                animate={{ width: 0, opacity: 0 }}
                transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
              >
                {tranquiliChars.map((char, i) => (
                  <motion.span
                    key={`to-${i}`}
                    animate={{ opacity: 0, filter: "blur(10px)" }}
                    transition={{ duration: 0.4, delay: i * 0.03 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-bold text-white whitespace-nowrap"
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.span>
              <motion.div className="flex">
                {waysChars.map((char, i) => (
                  <motion.span
                    key={`ws-${i}`}
                    className="text-4xl sm:text-5xl md:text-6xl font-bold"
                    style={{ color: "#ffdb58" }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}

          {phase === "ways" && (
            <motion.div
              key="ways"
              className="flex"
              initial={{ opacity: 0, filter: "blur(8px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {waysChars.map((char, i) => (
                <motion.span
                  key={`wf-${i}`}
                  className="text-4xl sm:text-5xl md:text-6xl font-bold"
                  style={{ color: "#ffdb58" }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
