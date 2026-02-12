"use client";

import { cn } from "@/app/lib/utils";
import React, { ReactNode, useEffect, useRef, useState } from "react";

interface MousePosition {
  x: number;
  y: number;
}

function useMousePosition(): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMouseMove = (event: globalThis.MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return mousePosition;
}

interface MagicCardProps {
  children: ReactNode;
  className?: string;
  gradientColor?: string;
  gradientOpacity?: number;
  gradientSize?: number;
}

export function MagicCard({
  children,
  className,
  gradientColor = "#262626",
  gradientOpacity = 0.8,
  gradientSize = 200,
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mousePosition = useMousePosition();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setPosition({
        x: mousePosition.x - rect.left,
        y: mousePosition.y - rect.top,
      });
    }
  }, [mousePosition]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative flex size-full overflow-hidden rounded-xl border bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-black dark:text-white",
        className,
      )}
    >
      <div className="relative z-10">{children}</div>
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(${gradientSize}px circle at ${position.x}px ${position.y}px, ${gradientColor}, transparent 100%)`,
          opacity: gradientOpacity,
        }}
      />
    </div>
  );
}
