import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 50%, #6d28d9 100%)',
          borderRadius: '40px',
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Compass Outer Ring */}
          <circle
            cx="12"
            cy="12"
            r="9.5"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.2"
          />
          {/* Degree Ticks */}
          <line x1="12" y1="2.8" x2="12" y2="4" stroke="white" strokeWidth="1" strokeLinecap="round" />
          <line x1="12" y1="20" x2="12" y2="21.2" stroke="white" strokeWidth="1" strokeLinecap="round" />
          <line x1="2.8" y1="12" x2="4" y2="12" stroke="white" strokeWidth="1" strokeLinecap="round" />
          <line x1="20" y1="12" x2="21.2" y2="12" stroke="white" strokeWidth="1" strokeLinecap="round" />

          {/* North Needle */}
          <polygon
            points="12,3.5 15,12 12,10.2"
            fill="#ff3b5c"
          />
          <polygon
            points="12,3.5 9,12 12,10.2"
            fill="#ff6b8b"
          />

          {/* South Needle */}
          <polygon
            points="12,20.5 15,12 12,13.8"
            fill="#cbd5e1"
          />
          <polygon
            points="12,20.5 9,12 12,13.8"
            fill="#f8fafc"
          />

          {/* Center Hub & Glow */}
          <circle cx="12" cy="12" r="2.4" fill="#0ea5e9" />
          <circle cx="12" cy="12" r="1.1" fill="#ffffff" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
