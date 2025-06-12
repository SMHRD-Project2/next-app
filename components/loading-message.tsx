"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function LoadingMessage() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const messages = [
    "AI가 발음을 분석하고 있습니다...",
    "분석 시간이 오래 걸릴 수도 있습니다."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 500); // Fade out duration
    }, 3000); // Message display duration

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <p 
        className={`text-onair-text-sub text-sm transition-opacity duration-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {messages[messageIndex]}
      </p>
      <div className="absolute bottom-0 right-0">
        <Loader2 className="w-4 h-4 text-onair-mint animate-spin" />
      </div>
    </div>
  );
} 