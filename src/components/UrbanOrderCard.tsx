
import React from "react";
import { motion } from "framer-motion";

type UrbanOrderCardProps = {
  children: React.ReactNode;
  className?: string;
};

const UrbanOrderCard: React.FC<UrbanOrderCardProps> = ({ children, className }) => (
  <motion.div
    initial={{ y: 34, opacity: 0, scale: 0.99 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    whileHover={{
      scale: 1.018,
      boxShadow: "0 10px 32px 0 rgba(40, 80, 50, 0.15)"
    }}
    transition={{ duration: 0.46, type: "spring", damping: 20, stiffness: 185 }}
    className={`rounded-2xl border border-market-500/20 bg-gradient-to-br from-zinc-900/70 via-market-700/40 to-zinc-900/85 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all p-0 ${className || ""}`}
    style={{
      borderWidth: "1.5px",
      background: "linear-gradient(112deg, #25381dce 70%, #27652ac7 100%)",
      boxShadow: "0 2px 10px 0 #12271030, 0 8px 60px 0 #84cc1650"
    }}
  >
    {children}
  </motion.div>
);

export default UrbanOrderCard;

