import * as React from "react"
const SvgComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={14}
    height={14}
    fill="#1f1f1f"
    viewBox="0 -960 960 960"
    style={{ display: "block", margin: "auto" }}
    {...props}
  >
    <path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z" />
  </svg>
)
export default SvgComponent