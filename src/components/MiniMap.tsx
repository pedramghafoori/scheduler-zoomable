import React from 'react';
import { Pool } from '@/lib/types';
import { StateType } from 'react-zoom-pan-pinch';

// Constants needed for pool width calculation
const DAY_COLUMN_WIDTH = 200;
const HOUR_LABEL_WIDTH = 60;
const POOL_HEADER_HEIGHT = 30; // Approximate header height
const POOL_CANVAS_VIEW_HEIGHT = 400; // Approx canvas height shown

interface MiniMapProps {
  pools: Pool[];
  transformState: StateType;
  whiteboardWidth: number; // Still needed for viewport calculation relative to full canvas
  whiteboardHeight: number; // Still needed for viewport calculation relative to full canvas
  miniMapSize: number;
}

const MiniMap = ({ 
  pools, 
  transformState, 
  whiteboardWidth, 
  whiteboardHeight, 
  miniMapSize 
}: MiniMapProps) => {

  // --- Calculate Bounding Box of Pools ---
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasPools = false;

  pools.forEach((pool, index) => {
    hasPools = true;
    const defaultX = (index % 3) * 850 + 50; // Match default positioning logic from Whiteboard
    const defaultY = Math.floor(index / 3) * 500 + 50; // Match default positioning logic
    const x = pool.x ?? defaultX;
    const y = pool.y ?? defaultY;

    // Calculate actual pool width based on its days
    const poolDynamicWidth = HOUR_LABEL_WIDTH + (pool.days.length * DAY_COLUMN_WIDTH);
    const poolMinWidth = HOUR_LABEL_WIDTH + 50; // Min width if no days
    const poolActualWidth = pool.days.length > 0 ? poolDynamicWidth : poolMinWidth;
    const poolApproxHeight = POOL_CANVAS_VIEW_HEIGHT + POOL_HEADER_HEIGHT; 

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + poolActualWidth);
    maxY = Math.max(maxY, y + poolApproxHeight);
  });

  // Add padding around the bounding box
  const padding = 50; 
  if (hasPools) {
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
  } else {
    // Default view if no pools (e.g., center around origin)
    minX = -miniMapSize;
    minY = -miniMapSize;
    maxX = miniMapSize;
    maxY = miniMapSize;
  }

  const boundingBoxWidth = Math.max(1, maxX - minX); // Avoid division by zero
  const boundingBoxHeight = Math.max(1, maxY - minY); // Avoid division by zero
  // --- End Bounding Box Calculation ---


  // --- Calculate Dynamic Scale Factor ---
  const scaleFactorX = miniMapSize / boundingBoxWidth;
  const scaleFactorY = miniMapSize / boundingBoxHeight;
  const scaleFactor = Math.min(scaleFactorX, scaleFactorY);
  // --- End Scale Factor Calculation ---


  // --- Render Pools Relative to Bounding Box ---
  const poolElements = pools.map(pool => {
      // Recalculate dimensions needed for rendering
      const defaultX = (pools.indexOf(pool) % 3) * 850 + 50; // Need index again or pass from loop
      const defaultY = Math.floor(pools.indexOf(pool) / 3) * 500 + 50;
      const x = pool.x ?? defaultX;
      const y = pool.y ?? defaultY;
      const poolDynamicWidth = HOUR_LABEL_WIDTH + (pool.days.length * DAY_COLUMN_WIDTH);
      const poolMinWidth = HOUR_LABEL_WIDTH + 50;
      const poolActualWidth = pool.days.length > 0 ? poolDynamicWidth : poolMinWidth;
      const poolApproxHeight = POOL_CANVAS_VIEW_HEIGHT + POOL_HEADER_HEIGHT;
      
      // Position relative to the bounding box origin
      const scaledX = (x - minX) * scaleFactor;
      const scaledY = (y - minY) * scaleFactor;
      const scaledW = poolActualWidth * scaleFactor;
      const scaledH = poolApproxHeight * scaleFactor;
      
      const poolColor = `hsl(${pool.id.charCodeAt(5) % 360}, 70%, 70%)`; 

      return (
          <div
              key={`minimap-${pool.id}`}
              title={`${pool.title} (${pool.location})`}
              style={{
                  position: 'absolute',
                  left: `${scaledX}px`,
                  top: `${scaledY}px`,
                  width: `${Math.max(1, scaledW)}px`, 
                  height: `${Math.max(1, scaledH)}px`, 
                  backgroundColor: poolColor,
                  border: '1px solid rgba(0,0,0,0.4)',
                  borderRadius: '1px',
                  opacity: 0.8,
              }}
          />
      );
  });
  // --- End Pool Rendering ---


  // --- Render Viewport Rectangle Relative to Bounding Box ---
  let viewportElement = null;
  if (transformState) {
      // Viewport dimensions in main whiteboard pixels (approximated)
      // Refined calculation accounting for fixed headers
      const headerHeight = 112; // 64px main + 48px secondary
      const approxViewportWidth = window.innerWidth; 
      const approxViewportHeight = window.innerHeight - headerHeight;

      // Viewport dimensions scaled down by the main zoom level
      const viewportWhiteboardWidth = approxViewportWidth / transformState.scale;
      const viewportWhiteboardHeight = approxViewportHeight / transformState.scale;

      // Top-left corner of the viewport in main whiteboard coordinates
      const viewportWhiteboardX = -transformState.positionX / transformState.scale;
      const viewportWhiteboardY = -transformState.positionY / transformState.scale;

      // Translate viewport coordinates to be relative to the bounding box origin
      const viewportBBoxX = viewportWhiteboardX - minX;
      const viewportBBoxY = viewportWhiteboardY - minY;

      // Scale the viewport position and size based on the minimap's scale factor
      const viewportScaledX = viewportBBoxX * scaleFactor;
      const viewportScaledY = viewportBBoxY * scaleFactor;
      const viewportScaledWidth = viewportWhiteboardWidth * scaleFactor;
      const viewportScaledHeight = viewportWhiteboardHeight * scaleFactor;

      viewportElement = (
          <div
              style={{
                  position: 'absolute',
                  left: `${viewportScaledX}px`,
                  top: `${viewportScaledY}px`,
                  width: `${viewportScaledWidth}px`,
                  height: `${viewportScaledHeight}px`,
                  border: '1px solid rgba(0, 0, 255, 0.7)', 
                  backgroundColor: 'rgba(0, 0, 255, 0.1)', 
                  zIndex: 10, 
                  pointerEvents: 'none', // Ensure viewport doesn't block interactions
              }}
          />
      );
  }
  // --- End Viewport Rendering ---

  return (
    <div 
      // Added pointer-events-none here as well for safety
      className="fixed bottom-4 right-4 border border-gray-400 bg-gray-100 bg-opacity-90 shadow-lg rounded-lg overflow-hidden pointer-events-none" 
      style={{
        width: `${miniMapSize}px`,
        height: `${miniMapSize}px`,
        zIndex: 50, 
      }}
    >
      <div 
        className="relative w-full h-full"
        // Add a background representing the scaled bounding box area
        style={{ backgroundColor: 'rgba(200, 200, 200, 0.5)' }} 
      >
         {poolElements}
         {viewportElement}
      </div>
    </div>
  );
};

export default MiniMap; 