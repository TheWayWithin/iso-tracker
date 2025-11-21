'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { raDecToCartesian, projectTo2D, calculateAutoScale, PLANETS, Cartesian3D } from '@/lib/nasa/coordinates';

interface EphemerisPoint {
  datetime_jd: string;
  calendar_date: string;
  ra: number;
  dec: number;
  delta: number;
  deldot: number;
  mag: number | null;
  phase_angle: number | null;
}

interface OrbitalPlot2DProps {
  isoId: string;
  isoName: string;
}

export function OrbitalPlot2D({ isoId, isoName }: OrbitalPlot2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<EphemerisPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Visualization state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(0.05); // AU per pixel
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fetch ephemeris data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch 60 days of data for smooth trajectory
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        const params = new URLSearchParams({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          step_size: '1d',
        });

        const response = await fetch(`/api/iso/${isoId}/ephemeris?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch ephemeris data');
        }

        const result = await response.json();
        const ephemerisData = result.ephemeris || [];
        setData(ephemerisData);

        // Calculate appropriate scale
        if (ephemerisData.length > 0) {
          const trajectory = ephemerisData.map((p: EphemerisPoint) =>
            raDecToCartesian(p.ra, p.dec, p.delta)
          );
          const canvas = canvasRef.current;
          if (canvas) {
            const autoScale = calculateAutoScale(trajectory, canvas.width, canvas.height, 50);
            setScale(autoScale);
          }
        }

        // Set current index to middle of dataset (today)
        setCurrentIndex(Math.floor(ephemerisData.length / 2));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orbital data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isoId]);

  // Draw visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0A1628'; // Dark space background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw grid (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 10; i++) {
      const radius = (i * 20) / scale;
      ctx.beginPath();
      ctx.arc(centerX + pan.x, centerY + pan.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw planetary orbits
    PLANETS.forEach(planet => {
      const radius = planet.radius / scale;
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)'; // Gray, semi-transparent
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX + pan.x, centerY + pan.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw planet name
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px sans-serif';
      ctx.fillText(planet.name, centerX + pan.x + radius - 30, centerY + pan.y);
    });

    // Draw Sun
    const sunRadius = 8;
    const sunGradient = ctx.createRadialGradient(
      centerX + pan.x, centerY + pan.y, 0,
      centerX + pan.x, centerY + pan.y, sunRadius * 2
    );
    sunGradient.addColorStop(0, '#FFD700');
    sunGradient.addColorStop(0.5, '#FFA500');
    sunGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(centerX + pan.x, centerY + pan.y, sunRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX + pan.x, centerY + pan.y, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // Convert ephemeris to 3D coordinates
    const trajectory = data.map(p => raDecToCartesian(p.ra, p.dec, p.delta));

    // Draw trajectory line
    if (trajectory.length > 1) {
      ctx.strokeStyle = '#FFB84D'; // Golden/orange
      ctx.lineWidth = 2;
      ctx.beginPath();

      let started = false;
      for (let i = 0; i < trajectory.length; i++) {
        const point2D = projectTo2D(trajectory[i], canvas.width, canvas.height, scale, pan.x, pan.y);

        if (!started) {
          ctx.moveTo(point2D.x, point2D.y);
          started = true;
        } else {
          ctx.lineTo(point2D.x, point2D.y);
        }
      }
      ctx.stroke();
    }

    // Draw current position (animated pulsing dot)
    if (trajectory[currentIndex]) {
      const currentPos = projectTo2D(
        trajectory[currentIndex],
        canvas.width,
        canvas.height,
        scale,
        pan.x,
        pan.y
      );

      // Pulsing effect (time-based)
      const pulseSize = 8 + Math.sin(Date.now() / 200) * 2;

      // Outer glow
      const glowGradient = ctx.createRadialGradient(
        currentPos.x, currentPos.y, 0,
        currentPos.x, currentPos.y, pulseSize * 2
      );
      glowGradient.addColorStop(0, 'rgba(46, 91, 255, 0.8)');
      glowGradient.addColorStop(1, 'rgba(46, 91, 255, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(currentPos.x, currentPos.y, pulseSize * 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner dot
      ctx.fillStyle = '#2E5BFF'; // Blue
      ctx.beginPath();
      ctx.arc(currentPos.x, currentPos.y, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // White center
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(currentPos.x, currentPos.y, pulseSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw scale indicator
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Scale: ${(1 / scale).toFixed(1)} AU`, 10, canvas.height - 10);

  }, [data, currentIndex, scale, pan]);

  // Animation loop for pulsing effect
  useEffect(() => {
    if (data.length === 0) return;

    const animate = () => {
      // Force re-render for pulsing animation
      const canvas = canvasRef.current;
      if (canvas) {
        // Trigger re-draw by updating a dummy state or just re-calling the effect
        requestAnimationFrame(animate);
      }
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [data]);

  // Mouse handlers for pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setScale(prev => Math.max(prev * 0.8, 0.001)); // Zoom in (decrease AU per pixel)
  };

  const handleZoomOut = () => {
    setScale(prev => Math.min(prev * 1.25, 1)); // Zoom out (increase AU per pixel)
  };

  const handleResetView = () => {
    if (data.length > 0) {
      const trajectory = data.map((p: EphemerisPoint) =>
        raDecToCartesian(p.ra, p.dec, p.delta)
      );
      const canvas = canvasRef.current;
      if (canvas) {
        const autoScale = calculateAutoScale(trajectory, canvas.width, canvas.height, 50);
        setScale(autoScale);
      }
    }
    setPan({ x: 0, y: 0 });
    setCurrentIndex(Math.floor(data.length / 2));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold mb-4">2D Orbital Visualization</h3>
        <div className="flex items-center justify-center h-[600px] bg-gray-100 rounded">
          <div className="text-gray-500">Loading orbital data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-red-200">
        <h3 className="text-lg font-bold mb-2 text-red-700">Error Loading Visualization</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold mb-2">No Orbital Data</h3>
        <p className="text-gray-600">No orbital data available for visualization.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-bold mb-4">2D Orbital Trajectory</h3>

      {/* Canvas */}
      <div className="mb-4 border border-gray-300 rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="cursor-move w-full h-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          role="img"
          aria-label={`2D orbital plot showing ${isoName}'s trajectory through the solar system. Use zoom controls and time slider below to explore the orbital path.`}
          tabIndex={0}
        />
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium text-gray-900 min-h-[44px]"
            aria-label="Zoom out to see more of the solar system"
          >
            − Zoom Out
          </button>
          <button
            onClick={handleZoomIn}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium text-gray-900 min-h-[44px]"
            aria-label="Zoom in for closer view of trajectory"
          >
            + Zoom In
          </button>
          <button
            onClick={handleResetView}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium text-gray-900 min-h-[44px]"
            aria-label="Reset view to default zoom and position"
          >
            Reset View
          </button>
          <div className="ml-auto text-sm font-medium text-gray-700">
            Click and drag to pan
          </div>
        </div>

        {/* Time scrubber */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-900">Time Position</label>
            <span className="text-sm font-medium text-gray-700">
              {new Date(data[currentIndex].calendar_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={data.length - 1}
            value={currentIndex}
            onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            aria-label={`Time slider: ${data[currentIndex] ? new Date(data[currentIndex].calendar_date).toLocaleDateString() : 'loading'}. Use arrow keys to scrub through time.`}
            aria-valuemin={0}
            aria-valuemax={data.length - 1}
            aria-valuenow={currentIndex}
            aria-valuetext={data[currentIndex] ? new Date(data[currentIndex].calendar_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Loading'}
          />
          <div className="flex justify-between text-xs text-gray-700 font-medium mt-1">
            <span>
              {new Date(data[0].calendar_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span>
              {new Date(data[data.length - 1].calendar_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-gray-200 text-xs text-gray-700">
          <p className="font-semibold text-gray-900 mb-2">Legend:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Sun</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9CA3AF' }}></div>
              <span>Planetary orbits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-orange-400"></div>
              <span>Object trajectory</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span>Current position</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoized export for performance
export const OrbitalPlot2DMemo = memo(OrbitalPlot2D);
