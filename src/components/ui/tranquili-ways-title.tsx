import * as React from "react";
import { motion } from "motion/react";
import { ShimmerText } from "./shimmer-text";

interface TranquiliWaysTitleProps {
  shimmerActive?: boolean;
}

export const TranquiliWaysTitle: React.FC<TranquiliWaysTitleProps> = ({
  shimmerActive = true,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [animKey, setAnimKey] = React.useState(0);

  const tranquiliChars = "Tranquili".split("");
  const waysChars = "Ways".split("");

  React.useEffect(() => {
    const timer = setTimeout(() => setCollapsed(true), 2800);
    return () => clearTimeout(timer);
  }, [animKey]);

  const handleRestart = () => {
    if (collapsed) {
      setCollapsed(false);
      setAnimKey((k) => k + 1);
    }
  };

  const charStagger = {
    hidden: { opacity: 0, filter: "blur(10px)" },
    show: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.35, delay: i * 0.03, ease: [0.4, 0, 0.2, 1] },
    }),
  };

  const headingClass =
    "app-heading text-4xl font-bold sm:text-5xl md:text-6xl";

  return (
    <div className="flex w-full justify-center">
      <div
        className="relative flex min-h-[72px] items-center justify-center sm:min-h-[88px] cursor-pointer"
        onClick={handleRestart}
      >
        <motion.div
          key={animKey}
          className="flex items-center justify-center"
          layout
          transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Tranquili — collapses smoothly */}
          <motion.span
            className="flex overflow-hidden whitespace-nowrap"
            animate={
              collapsed
                ? { width: 0, opacity: 0 }
                : { width: "auto", opacity: 1 }
            }
            transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
          >
            {tranquiliChars.map((char, i) => (
              <motion.span
                key={`t-${i}`}
                custom={i}
                initial="hidden"
                animate="show"
                variants={charStagger}
                className={`${headingClass} text-white`}
              >
                {char}
              </motion.span>
            ))}
          </motion.span>

          {/* Ways — always visible, shimmer after collapse */}
          {collapsed ? (
            <ShimmerText
              active={shimmerActive}
              duration={1}
              delay={0.8}
              className={headingClass}
            >
              <span style={{ color: "#ffdb58" }}>
                {waysChars.map((char, i) => (
                  <motion.span
                    key={`ws-${i}`}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                  >
                    {char}
                  </motion.span>
                ))}
              </span>
            </ShimmerText>
          ) : (
            waysChars.map((char, i) => (
              <motion.span
                key={`w-${i}`}
                custom={tranquiliChars.length + i}
                initial="hidden"
                animate="show"
                variants={charStagger}
                className={headingClass}
                style={{ color: "#ffdb58" }}
              >
                {char}
              </motion.span>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};
