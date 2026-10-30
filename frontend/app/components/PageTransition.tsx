import { useLocation } from "react-router";
import { useEffect, useState } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [location.pathname]);

  return (
    <div
      key={key}
      className="animate-page-fade"
    >
      {children}
    </div>
  );
}
