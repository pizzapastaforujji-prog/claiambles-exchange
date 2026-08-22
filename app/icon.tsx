import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 48,
  height: 48,
};
export const contentType = "image/png";

// Image generation for favicon / Google Search icon
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 26,
          background: "linear-gradient(135deg, #1E5E3A 0%, #2A8251 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: 12,
        }}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 8C4 6.89543 4.89543 6 6 6H18C19.1046 6 20 6.89543 20 8V9C18.8954 9 18 9.89543 18 11C18 12.1046 18.8954 13 20 13V16C20 17.1046 19.1046 18 18 18H6C4.89543 18 4 17.1046 4 16V13C5.10457 13 6 12.1046 6 11C6 9.89543 5.10457 9 4 9V8Z"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 11L14 11M14 11L12 9M14 11L12 13"
            stroke="#FDE68A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
