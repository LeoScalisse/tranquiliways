import * as React from "react";
import { motion } from "motion/react";

export const TranquiliWaysTitle: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  const tranquiliChars = "Tranquili".split("");
  const waysChars = "Ways".split("");

  React.useEffect(() => {
    const timer = setTimeout(() => setCollapsed(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  const charStagger = {
    hidden: { opacity: 0, filter: "blur(10px)" },
    show: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.3, delay: i * 0.025 },
    }),
  };

  return (
    <div className="flex justify-center mb-20 mt-[-60px]">
      <div className="relative flex items-center justify-center min-h-[90px]">
        <div className="flex items-center">
          {/* Tranquili — collapses smoothly */}
          <motion.span
            className="flex overflow-hidden whitespace-nowrap"
            animate={
              collapsed
                ? { width: 0, opacity: 0 }
                : { width: "auto", opacity: 1 }
            }
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {tranquiliChars.map((char, i) => (
              <motion.span
                key={`t-${i}`}
                custom={i}
                initial="hidden"
                animate="show"
                variants={charStagger}
                className="text-5xl sm:text-6xl md:text-7xl font-bold text-white"
              >
                {char}
              </motion.span>
            ))}
          </motion.span>

          {/* Ways — always visible, never unmounts */}
          {waysChars.map((char, i) => (
            <motion.span
              key={`w-${i}`}
              custom={tranquiliChars.length + i}
              initial="hidden"
              animate="show"
              variants={charStagger}
              className="text-5xl sm:text-6xl md:text-7xl font-bold"
              style={{ color: "#ffdb58" }}
            >
              {char}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
};
