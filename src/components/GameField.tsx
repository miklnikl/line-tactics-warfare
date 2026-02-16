import React, { useRef, useEffect } from 'react';
import { Application } from 'pixi.js';

interface GameFieldProps {
  onAppReady?: (app: Application) => void;
}

/**
 * GameField component responsible for initializing and mounting the PixiJS application.
 * 
 * Responsibilities:
 * - Create PIXI.Application on mount
 * - Attach canvas to a div ref
 * - Destroy Pixi app on unmount (prevents memory leaks)
 * - Receive GameState as a prop (for future use)
 * 
 * Design rules:
 * - Use useRef for canvas container
 * - Use useEffect for lifecycle
 * - No game logic inside the component
 */
export const GameField: React.FC<GameFieldProps> = ({ onAppReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const onAppReadyRef = useRef(onAppReady);

  // Keep the callback ref updated
  useEffect(() => {
    onAppReadyRef.current = onAppReady;
  }, [onAppReady]);

  useEffect(() => {
    // Create PixiJS Application
    const app = new Application();

    // Initialize the application
    const initApp = async () => {
      try {
        // Get container dimensions to initialize canvas with proper size
        const width = containerRef.current?.clientWidth || window.innerWidth;
        const height = containerRef.current?.clientHeight || window.innerHeight;

        await app.init({
          width,
          height,
          backgroundColor: 0x1099bb,
          resizeTo: containerRef.current || window
        });

        // Append canvas to container
        if (containerRef.current) {
          containerRef.current.appendChild(app.canvas);
        }

        // Store reference for cleanup
        appRef.current = app;

        // Notify parent that app is ready (using ref to get latest callback)
        if (onAppReadyRef.current) {
          onAppReadyRef.current(app);
        }
      } catch (error) {
        console.error('Failed to initialize PixiJS Application:', error);
      }
    };

    initApp();

    // Cleanup on unmount
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, {
          children: true,
          texture: true,
          textureSource: true
        });
        appRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount



  return (
    <div 
      ref={containerRef} 
      id="game-canvas"
      style={{ 
        width: '100%', 
        height: '100%'
      }}
    />
  );
};
