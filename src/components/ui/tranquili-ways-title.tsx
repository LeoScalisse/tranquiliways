import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

const blurIn = {
  hidden: { opacity: 0, filter: "blur(10px)" },
  show: { opacity: 1, filter: "blur(0px)" },
};

const blurOut = {
  visible: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(10px)" },
};

export const TranquiliWaysTitle: React.FC = () => {
  const [phase, setPhase] = React.useState<"full" | "ways">("full");

  const tranquiliChars = "Tranquili".split("");
  const waysChars = "Ways".split("");

  const containerIn = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.015 },
    },
  };

  const containerOut = {
    visible: {},
    exit: {
      transition: { staggerChildren: 0.02 },
    },
  };

  React.useEffect(() => {
    const timer = setTimeout(() => setPhase("ways"), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex justify-center mb-8">
      <div className="relative flex items-center justify-center">
        {/* Full title phase */}
        <AnimatePresence>
          {phase === "full" && (
            <motion.div
              className="flex"
              variants={containerIn}
              initial="hidden"
              animate="show"
              exit="hidden"
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
        </AnimatePresence>

        {/* Ways only phase */}
        <AnimatePresence>
          {phase === "ways" && (
            <motion.div className="flex">
              {/* Tranquili fading out */}
              <motion.span
                className="flex overflow-hidden"
                variants={containerOut}
                initial="visible"
                animate="exit"
              >
                {tranquiliChars.map((char, i) => (
                  <motion.span
                    key={`to-${i}`}
                    variants={blurOut}
                    className="text-4xl sm:text-5xl md:text-6xl font-bold text-white"
                    transition={{ duration: 0.3 }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.span>

              {/* Ways staying */}
              <motion.div
                className="flex"
                variants={containerIn}
                initial="hidden"
                animate="show"
              >
                {waysChars.map((char, i) => (
                  <motion.span
                    key={`ws-${i}`}
                    variants={blurIn}
                    className="text-4xl sm:text-5xl md:text-6xl font-bold"
                    style={{ color: "#ffdb58" }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
