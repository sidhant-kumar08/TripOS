'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface DottedGlobeProps {
  className?: string;
  size?: number;
}

// Generate spherical dot matrix for Earth
export function DottedGlobe({ className = '', size = 560 }: DottedGlobeProps) {
  // Pre-generate static dots on a sphere with 3D projection
  const dots = React.useMemo(() => {
    const points: Array<{
      cx: number;
      cy: number;
      r: number;
      opacity: number;
      isContinent?: boolean;
    }> = [];

    const radius = 200;
    const center = 250;

    // Latitude rings
    const latSteps = 18;
    for (let i = 1; i < latSteps; i++) {
      const lat = (i / latSteps) * Math.PI - Math.PI / 2; // -PI/2 to PI/2
      const rRing = radius * Math.cos(lat);
      const y = center + radius * Math.sin(lat);
      const lonCount = Math.max(8, Math.floor(48 * Math.cos(lat)));

      for (let j = 0; j < lonCount; j++) {
        const lon = (j / lonCount) * 2 * Math.PI;
        // Project onto 3D orthographic sphere
        const z = Math.cos(lon) * rRing;
        const x = center + Math.sin(lon) * rRing;

        // Front-facing points have higher opacity, back-facing points have subtle opacity
        const isFront = z > 0;
        const depth = (z + radius) / (2 * radius); // 0 to 1

        if (isFront) {
          points.push({
            cx: x,
            cy: y,
            r: 1.2 + depth * 1.4,
            opacity: 0.35 + depth * 0.55,
            isContinent: (i % 2 === 0 && j % 3 === 0) || (i > 6 && i < 14 && j % 2 === 0),
          });
        } else {
          // Soft back dots for 3D depth
          if (j % 2 === 0) {
            points.push({
              cx: x,
              cy: y,
              r: 0.85,
              opacity: 0.12,
            });
          }
        }
      }
    }

    // Continent-like dense dot clusters (Americas, Eurasia, Africa, Australia)
    const continentPoints = [
      // North America
      { lat: 0.7, lon: -1.7, spread: 0.45, count: 28 },
      // Europe
      { lat: 0.85, lon: 0.2, spread: 0.35, count: 22 },
      // Asia
      { lat: 0.65, lon: 1.5, spread: 0.55, count: 36 },
      // Africa
      { lat: 0.1, lon: 0.35, spread: 0.45, count: 30 },
      // South America
      { lat: -0.35, lon: -1.0, spread: 0.4, count: 25 },
      // Australia / Oceania
      { lat: -0.45, lon: 2.3, spread: 0.35, count: 18 },
    ];

    continentPoints.forEach((c) => {
      for (let k = 0; k < c.count; k++) {
        const dLat = (Math.random() - 0.5) * c.spread;
        const dLon = (Math.random() - 0.5) * c.spread * 1.5;
        const lat = c.lat + dLat;
        const lon = c.lon + dLon;

        const rRing = radius * Math.cos(lat);
        const y = center - radius * Math.sin(lat);
        const z = Math.cos(lon) * rRing;
        const x = center + Math.sin(lon) * rRing;

        if (z > -radius * 0.2) {
          const depth = (z + radius) / (2 * radius);
          points.push({
            cx: x,
            cy: y,
            r: 1.8 + depth * 1.2,
            opacity: 0.55 + depth * 0.45,
            isContinent: true,
          });
        }
      }
    });

    return points;
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      {/* Atmosphere radial glow */}
      <div
        className="absolute rounded-full bg-indigo-300/20 blur-3xl"
        style={{
          width: size * 0.85,
          height: size * 0.85,
        }}
      />

      <motion.svg
        viewBox="0 0 500 500"
        width={size}
        height={size}
        className="relative z-0 opacity-80"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 90,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <defs>
          <radialGradient id="globeAtmosphere" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="65%" stopColor="#a5b4fc" stopOpacity="0.04" />
            <stop offset="90%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
          </radialGradient>

          <linearGradient id="orbitLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
          </linearGradient>

          <filter id="whiteGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer spherical atmosphere rim */}
        <circle
          cx="250"
          cy="250"
          r="200"
          fill="url(#globeAtmosphere)"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeDasharray="4 8"
          strokeOpacity="0.35"
        />

        {/* Latitude parallel dotted arcs */}
        {[-140, -90, -40, 0, 40, 90, 140].map((offset, idx) => {
          const r = Math.sqrt(Math.max(0, 200 * 200 - offset * offset));
          return (
            <ellipse
              key={`lat-${idx}`}
              cx="250"
              cy={250 + offset * 0.9}
              rx={r}
              ry={r * 0.28}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeDasharray="2 6"
              strokeOpacity="0.22"
            />
          );
        })}

        {/* Longitude meridian dotted ellipses */}
        {[0, 30, 60, 90, 120, 150].map((angle, idx) => (
          <ellipse
            key={`lon-${idx}`}
            cx="250"
            cy="250"
            rx={Math.abs(200 * Math.cos((angle * Math.PI) / 180))}
            ry="200"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.75"
            strokeDasharray="2 7"
            strokeOpacity="0.2"
          />
        ))}

        {/* Dotted Spherical Matrix Nodes */}
        <g filter="url(#whiteGlow)">
          {dots.map((dot, idx) => (
            <circle
              key={idx}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill="#ffffff"
              fillOpacity={dot.opacity}
            />
          ))}
        </g>

        {/* Orbit Flight Arcs */}
        <path
          d="M 120,200 Q 250,70 380,210"
          fill="none"
          stroke="url(#orbitLineGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M 140,320 Q 250,420 370,290"
          fill="none"
          stroke="url(#orbitLineGrad)"
          strokeWidth="1.2"
          strokeDasharray="3 5"
        />

        {/* Glowing Connected Flight Nodes */}
        <circle cx="120" cy="200" r="3" fill="#ffffff" fillOpacity="0.9" />
        <circle cx="380" cy="210" r="3.5" fill="#ffffff" fillOpacity="0.95" />
        <circle cx="250" cy="120" r="2.5" fill="#ffffff" fillOpacity="0.8" />
        <circle cx="370" cy="290" r="3" fill="#ffffff" fillOpacity="0.9" />
      </motion.svg>
    </div>
  );
}
