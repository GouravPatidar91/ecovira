
import { motion } from "framer-motion";
import React from "react";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
}

const animation = {
  initial: { y: 40, opacity: 0, scale: 0.94 },
  animate: { y: 0, opacity: 1, scale: 1 },
  whileHover: { scale: 1.04, boxShadow: "0 8px 32px 0 rgba(31,38,135,0.2)" },
  transition: { duration: 0.42, type: "spring", damping: 20, stiffness: 250 },
};

const AnimatedCard: React.FC<AnimatedCardProps> = ({ children, className }) => (
  <motion.div
    initial={animation.initial}
    animate={animation.animate}
    whileHover={animation.whileHover}
    transition={animation.transition}
    className={`rounded-xl bg-white/80 backdrop-blur-lg shadow-xl border border-white/30 ${className || ""}`}
  >
    {children}
  </motion.div>
);

export default AnimatedCard;
