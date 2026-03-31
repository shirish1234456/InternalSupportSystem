'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

interface CounterProps {
  value: number;
  suffix?: string;
  className?: string;
}

export default function Counter({ value, suffix = '', className = '' }: CounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(0, value, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate(v) {
          node.textContent = Math.round(v).toString() + suffix;
        }
      });
      return () => controls.stop();
    }
  }, [value, suffix]);

  return <span ref={nodeRef} className={className}>0{suffix}</span>;
}
