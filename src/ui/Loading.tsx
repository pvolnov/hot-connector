export function Loading() {
  return (
    <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="20"
          cy="20"
          r="18"
          stroke="#555"
          stroke-width="4"
          fill="none"
          stroke-linecap="round"
          stroke-dasharray="90"
          stroke-dashoffset="60"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 20 20"
            to="360 20 20"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
