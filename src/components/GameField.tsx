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
 * - Destroy Pixi app on unmount
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

  useEffect(() => {
    // Create PixiJS Application
    const app = new Application();

    // Initialize the application
    const initApp = async () => {
      await app.init({
        width: 1200,
        height: 600,
        backgroundColor: 0x1099bb,
        resizeTo: containerRef.current || undefined
      });

      // Append canvas to container
      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }

      // Store reference for cleanup
      appRef.current = app;

      // Notify parent that app is ready
      if (onAppReady) {
        onAppReady(app);
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (appRef.current && containerRef.current) {
        appRef.current.renderer.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      id="game-canvas"
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        zIndex: 1
      }}
    />
  );
};
