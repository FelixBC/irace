import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SportAnimation: React.FC = () => {
  const [currentSport, setCurrentSport] = useState(0);
  const [position, setPosition] = useState(0);
  
  const sports = [
    { name: 'running', frames: 4 },
    { name: 'swimming', frames: 4 },
    { name: 'biking', frames: 4 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSport((prev) => (prev + 1) % sports.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      setPosition((prev) => {
        if (prev >= 100) return 0; // Reset to start when reaching finish line
        return prev + 1;
      });
    }, 100); // Move every 100ms for smooth movement

    return () => clearInterval(moveInterval);
  }, []);

  const getRunningFrames = () => (
    <div className="relative w-8 h-8">
      {/* Frame 1 - Legs apart */}
      <motion.div
        animate={{ opacity: [1, 0, 0, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="w-8 h-8 relative">
          {/* Head */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
          {/* Body */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-black"></div>
          {/* Arms */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black -rotate-12 origin-left"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black rotate-12 origin-right"></div>
          {/* Legs */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black -rotate-12 origin-top"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black rotate-12 origin-top"></div>
        </div>
      </motion.div>

      {/* Frame 2 - Legs together */}
      <motion.div
        animate={{ opacity: [0, 1, 0, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="w-8 h-8 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-black"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black"></div>
        </div>
      </motion.div>

      {/* Frame 3 - Legs apart */}
      <motion.div
        animate={{ opacity: [0, 0, 1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="w-8 h-8 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-black"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black rotate-12 origin-left"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black -rotate-12 origin-right"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black rotate-12 origin-top"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black -rotate-12 origin-top"></div>
        </div>
      </motion.div>

      {/* Frame 4 - Back to frame 1 */}
      <motion.div
        animate={{ opacity: [0, 0, 0, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="w-8 h-8 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-black"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black -rotate-12 origin-left"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black rotate-12 origin-right"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black -rotate-12 origin-top"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black rotate-12 origin-top"></div>
        </div>
      </motion.div>
    </div>
  );

  const getSwimmingFrames = () => (
    <div className="relative w-8 h-8">
      {/* Frame 1 - Freestyle stroke */}
      <motion.div
        animate={{ opacity: [1, 0, 0, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="w-8 h-8 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-black"></div>
          {/* Arms in freestyle position */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black rotate-45 origin-left"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black -rotate-45 origin-right"></div>
          {/* Legs kicking */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black -rotate-12 origin-top"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black rotate-12 origin-top"></div>
          {/* Water waves */}
          <div className="absolute top-7 left-0 w-8 h-1 bg-black opacity-30"></div>
        </div>
      </motion.div>

      {/* Frame 2 - Arms back */}
      <motion.div
        animate={{ opacity: [0, 1, 0, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="w-8 h-8 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-black"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black -rotate-45 origin-left"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black rotate-45 origin-right"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black rotate-12 origin-top"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black -rotate-12 origin-top"></div>
          <div className="absolute top-7 left-0 w-8 h-1 bg-black opacity-30"></div>
        </div>
      </motion.div>

      {/* Frame 3 - Recovery stroke */}
      <motion.div
        animate={{ opacity: [0, 0, 1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="w-8 h-8 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-black"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black rotate-12 origin-left"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black -rotate-12 origin-right"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black -rotate-12 origin-top"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black rotate-12 origin-top"></div>
          <div className="absolute top-7 left-0 w-8 h-1 bg-black opacity-30"></div>
        </div>
      </motion.div>

      {/* Frame 4 - Back to frame 1 */}
      <motion.div
        animate={{ opacity: [0, 0, 0, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="w-8 h-8 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-black"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black rotate-45 origin-left"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black -rotate-45 origin-right"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black -rotate-12 origin-top"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black rotate-12 origin-top"></div>
          <div className="absolute top-7 left-0 w-8 h-1 bg-black opacity-30"></div>
        </div>
      </motion.div>
    </div>
  );

  const getBikingFrames = () => (
    <div className="relative w-8 h-8">
      {/* Frame 1 - Pedaling down */}
      <motion.div
        animate={{ opacity: [1, 0, 0, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="w-8 h-8 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-black"></div>
          {/* Arms holding handlebars */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black"></div>
          {/* Legs pedaling down */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black rotate-45 origin-top"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black -rotate-45 origin-top"></div>
          {/* Bike frame */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-black"></div>
          <div className="absolute top-7 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-black"></div>
        </div>
      </motion.div>

      {/* Frame 2 - Pedaling up */}
      <motion.div
        animate={{ opacity: [0, 1, 0, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="w-8 h-8 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-black"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black"></div>
          {/* Legs pedaling up */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black -rotate-45 origin-top"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black rotate-45 origin-top"></div>
          {/* Bike frame */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-black"></div>
          <div className="absolute top-7 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-black"></div>
        </div>
      </motion.div>

      {/* Frame 3 - Pedaling down */}
      <motion.div
        animate={{ opacity: [0, 0, 1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="w-8 h-8 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-black"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black"></div>
          {/* Legs pedaling down */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black rotate-45 origin-top"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black -rotate-45 origin-top"></div>
          {/* Bike frame */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-black"></div>
          <div className="absolute top-7 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-black"></div>
        </div>
      </motion.div>

      {/* Frame 4 - Back to frame 1 */}
      <motion.div
        animate={{ opacity: [0, 0, 0, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0"
      >
        <div className="w-8 h-8 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-black rounded-full"></div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-black"></div>
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-black"></div>
          {/* Legs pedaling down */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black rotate-45 origin-top"></div>
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-black -rotate-45 origin-top"></div>
          {/* Bike frame */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-black"></div>
          <div className="absolute top-7 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-black"></div>
        </div>
      </motion.div>
    </div>
  );

  const getCurrentSportAnimation = () => {
    switch (currentSport) {
      case 0: return getRunningFrames();
      case 1: return getSwimmingFrames();
      case 2: return getBikingFrames();
      default: return getRunningFrames();
    }
  };

  const getCurrentSportName = () => {
    return sports[currentSport].name;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Game Scene */}
      <div className="relative w-80 h-20 bg-white border-2 border-black">
        {/* Ground Line */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black"></div>
        
        {/* Scattered pebbles on ground */}
        <div className="absolute bottom-1 left-4 w-1 h-1 bg-black"></div>
        <div className="absolute bottom-1 left-12 w-1 h-1 bg-black"></div>
        <div className="absolute bottom-1 left-20 w-1 h-1 bg-black"></div>
        <div className="absolute bottom-1 left-28 w-1 h-1 bg-black"></div>
        <div className="absolute bottom-1 left-36 w-1 h-1 bg-black"></div>
        <div className="absolute bottom-1 left-44 w-1 h-1 bg-black"></div>
        <div className="absolute bottom-1 left-52 w-1 h-1 bg-black"></div>
        <div className="absolute bottom-1 left-60 w-1 h-1 bg-black"></div>
        <div className="absolute bottom-1 left-68 w-1 h-1 bg-black"></div>
        <div className="absolute bottom-1 left-76 w-1 h-1 bg-black"></div>
        
        {/* Cloud */}
        <div className="absolute top-2 left-4 w-6 h-2 bg-gray-300">
          <div className="absolute top-0 left-1 w-1 h-1 bg-gray-300"></div>
          <div className="absolute top-0 left-3 w-1 h-1 bg-gray-300"></div>
          <div className="absolute top-1 left-0 w-1 h-1 bg-gray-300"></div>
          <div className="absolute top-1 left-2 w-1 h-1 bg-gray-300"></div>
          <div className="absolute top-1 left-4 w-1 h-1 bg-gray-300"></div>
        </div>
        
        {/* Moving Character */}
        <motion.div
          animate={{ x: `${position * 2.4}px` }}
          transition={{ duration: 0.1 }}
          className="absolute bottom-1 left-4"
        >
          {getCurrentSportAnimation()}
        </motion.div>
        
        {/* Finish Line */}
        <div className="absolute bottom-0 right-0 w-8 h-8">
          <div className="absolute bottom-0 left-0 w-1 h-8 bg-black"></div>
          <div className="absolute bottom-0 left-2 w-1 h-8 bg-black"></div>
          <div className="absolute bottom-0 left-4 w-1 h-8 bg-black"></div>
          <div className="absolute bottom-0 left-6 w-1 h-8 bg-black"></div>
        </div>
        
        {/* Progress Bar */}
        <div className="absolute top-1 left-0 w-full h-1 bg-gray-200">
          <motion.div
            animate={{ width: `${position}%` }}
            transition={{ duration: 0.1 }}
            className="h-full bg-black"
          />
        </div>
      </div>
      
      {/* Sport Label */}
      <div className="text-center">
        <div className="text-sm font-mono text-gray-600 uppercase tracking-wider">
          {getCurrentSportName()}
        </div>
        <div className="text-xs text-gray-400 font-mono">
          {currentSport + 1} / {sports.length}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex space-x-2">
        {sports.map((_, index) => (
          <motion.div
            key={index}
            animate={{
              scale: currentSport === index ? 1.2 : 1,
              opacity: currentSport === index ? 1 : 0.3,
            }}
            transition={{ duration: 0.2 }}
            className={`w-2 h-2 rounded-full ${
              currentSport === index ? 'bg-black' : 'bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default SportAnimation;
