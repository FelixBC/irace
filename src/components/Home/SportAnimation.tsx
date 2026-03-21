import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const SPORTS = [
  { name: 'running' },
  { name: 'swimming' },
  { name: 'biking' },
] as const;

const SportAnimation: React.FC = () => {
  const [currentSport, setCurrentSport] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSport((prev) => (prev + 1) % SPORTS.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      setPosition((prev) => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(moveInterval);
  }, []);

  const sport = SPORTS[currentSport];

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-80 h-20 bg-white border-2 border-black">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black" />

        <div className="absolute bottom-1 left-4 w-1 h-1 bg-black" />
        <div className="absolute bottom-1 left-12 w-1 h-1 bg-black" />
        <div className="absolute bottom-1 left-20 w-1 h-1 bg-black" />
        <div className="absolute bottom-1 left-28 w-1 h-1 bg-black" />
        <div className="absolute bottom-1 left-36 w-1 h-1 bg-black" />
        <div className="absolute bottom-1 left-44 w-1 h-1 bg-black" />
        <div className="absolute bottom-1 left-52 w-1 h-1 bg-black" />
        <div className="absolute bottom-1 left-60 w-1 h-1 bg-black" />
        <div className="absolute bottom-1 left-68 w-1 h-1 bg-black" />
        <div className="absolute bottom-1 left-76 w-1 h-1 bg-black" />

        <div className="absolute top-2 left-4 w-6 h-2 bg-gray-300">
          <div className="absolute top-0 left-1 w-1 h-1 bg-gray-300" />
          <div className="absolute top-0 left-3 w-1 h-1 bg-gray-300" />
          <div className="absolute top-1 left-0 w-1 h-1 bg-gray-300" />
          <div className="absolute top-1 left-2 w-1 h-1 bg-gray-300" />
          <div className="absolute top-1 left-4 w-1 h-1 bg-gray-300" />
        </div>

        <motion.div
          animate={{ x: `${position * 2.4}px` }}
          transition={{ duration: 0.1 }}
          className="absolute bottom-1 left-4 flex items-end"
        >
          <img
            src={`/animations/${sport.name}.gif`}
            alt={`${sport.name} sport animation`}
            className="h-8 w-8 object-contain object-bottom select-none pointer-events-none"
            draggable={false}
          />
        </motion.div>

        <div className="absolute bottom-0 right-0 w-8 h-8">
          <div className="absolute bottom-0 left-0 w-1 h-8 bg-black" />
          <div className="absolute bottom-0 left-2 w-1 h-8 bg-black" />
          <div className="absolute bottom-0 left-4 w-1 h-8 bg-black" />
          <div className="absolute bottom-0 left-6 w-1 h-8 bg-black" />
        </div>

        <div className="absolute top-1 left-0 w-full h-1 bg-gray-200">
          <motion.div
            animate={{ width: `${position}%` }}
            transition={{ duration: 0.1 }}
            className="h-full bg-black"
          />
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm font-mono text-gray-600 uppercase tracking-wider">
          {sport.name}
        </div>
        <div className="text-xs text-gray-400 font-mono">
          {currentSport + 1} / {SPORTS.length}
        </div>
      </div>

      <div className="flex space-x-2">
        {SPORTS.map((_, index) => (
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
