"use client";

import { motion } from "framer-motion";

const AudioLoader = () => {
  return (
    <motion.div className="relative w-[100px] h-[100px] rounded-full bg-linear-to-b from-sidebar-primary via-sidebar-primary to-primary blur-[1px] shadow-[0px_-5px_20px_0px_rgb(186,66,255),0px_5px_20px_0px_rgb(0,225,255)]"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1.7,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <div className="absolute inset-0 w-[100px] h-[100px] rounded-full bg-background blur-[10px]" />
    </motion.div>
  );
};

export default AudioLoader;
