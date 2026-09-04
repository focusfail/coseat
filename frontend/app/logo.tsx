import * as React from "react";
const SVGComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 1250 299"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    xmlSpace="preserve"
    xmlns:serif="http://www.serif.com/"
    style={{
      fillRule: "evenodd",
      clipRule: "evenodd",
      strokeLinejoin: "round",
      strokeMiterlimit: 2,
    }}
    {...props}
  >
    <g transform="matrix(1,0,0,1,-2.66579,38.7241)">
      <g
        id="airplane.svg"
        transform="matrix(12.4583,0,0,12.4583,152.166,110.776)"
      >
        <g transform="matrix(1,0,0,1,-12,-12)">
          <path
            d="M20.56,3.91C21.15,4.5 21.15,5.45 20.56,6.03L16.67,9.92L18.79,19.11L17.38,20.53L13.5,13.1L9.6,17L9.96,19.47L8.89,20.53L7.13,17.35L3.94,15.58L5,14.5L7.5,14.87L11.37,11L3.94,7.09L5.36,5.68L14.55,7.8L18.44,3.91C19,3.33 20,3.33 20.56,3.91Z"
            style={{
              fillRule: "nonzero",
              fill: "var(--logo-color, rgb(142,0,69))",
            }}
          />
        </g>
      </g>
      <g transform="matrix(1.10293,0,0,1.10293,-3.12304,-167.489)">
        <g transform="matrix(266.645,0,0,266.645,1143.8,381)" />
        <text
          x="282px"
          y="381px"
          style={{
            fontFamily: "'Lexend-Regular', 'Lexend'",
            fontSize: "266.645px",
            fill: "var(--logo-text-color, rgb(142,0,69))",
          }}
        >
          {"coseat"}
        </text>
      </g>
    </g>
  </svg>
);
export default SVGComponent;
