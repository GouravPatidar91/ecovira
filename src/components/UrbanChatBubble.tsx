
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type UrbanChatBubbleProps = {
  message: string;
  isCurrentUser: boolean;
  timestamp: string;
  isRead?: boolean;
  statusSlot?: React.ReactNode;
  className?: string;
};

const UrbanChatBubble: React.FC<UrbanChatBubbleProps> = ({
  message,
  isCurrentUser,
  timestamp,
  isRead,
  statusSlot,
  className
}) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 20, 
        scale: 0.98 
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1 
      }}
      transition={{ 
        duration: 0.24, 
        type: "spring", 
        damping: 22, 
        stiffness: 200 
      }}
      className={cn(
        "max-w-[80%] px-4 py-2 rounded-lg shadow-lg mb-3",
        isCurrentUser
          ? "bg-gradient-to-br from-market-600/90 via-market-700/80 to-zinc-900/95 text-white self-end mr-2 glassmorphic"
          : "bg-gradient-to-br from-zinc-800/80 via-market-600/70 to-zinc-900/95 text-market-100 self-start ml-2 glassmorphic",
        "backdrop-blur-md border border-market-500/25",
        className
      )}
      style={{
        borderWidth: 1.5,
        boxShadow: isCurrentUser
          ? "0 2px 12px 0 #a3e63528, 0 6px 32px 0 #1e293b33"
          : "0 1.5px 8px 0 #a3e63518, 0 5px 22px 0 #25381d33",
        background:
          isCurrentUser
            ? "linear-gradient(112deg,#84cc1699 60%,#25381dcc 120%)"
            : "linear-gradient(112deg,#25381dcc 60%,#27652acc 120%)"
      }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-base">{message}</span>
        <div className="flex gap-3 items-center mt-0.5">
          <span className="text-xs opacity-70">{timestamp}</span>
          {isCurrentUser && statusSlot}
        </div>
      </div>
    </motion.div>
  );
};

export default UrbanChatBubble;
