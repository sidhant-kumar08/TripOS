import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Compass Outer Ring */}
          <circle
            cx="12"
            cy="12"
            r="9.5"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
          />
          {/* Compass Needles */}
          <polygon
            points="12,4 14.5,12 12,10.5"
            fill="#ff4d6d"
          />
          <polygon
            points="12,4 9.5,12 12,10.5"
            fill="#ff758f"
          />
          <polygon
            points="12,20 14.5,12 12,13.5"
            fill="#e2e8f0"
          />
          <polygon
            points="12,20 9.5,12 12,13.5"
            fill="#ffffff"
          />
          {/* Center Pin */}
          <circle cx="12" cy="12" r="1.8" fill="#38bdf8" />
          <circle cx="12" cy="12" r="0.8" fill="#ffffff" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
