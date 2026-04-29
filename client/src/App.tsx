import { useEffect, useState } from "react";

export default function App() {
  const [health, setHealth] = useState(100);

  useEffect(() => {
    const handleHealth = (e: CustomEvent) => {
      setHealth(e.detail.health);
    };

    window.addEventListener("healthUpdate", handleHealth as EventListener);

    return () => {
      window.removeEventListener("healthUpdate", handleHealth as EventListener);
    };
  }, []);

  return (
    <div id="root" className="z-10 text-white">
      <div className="w-4xl h-auto">
        <div
          className="h-auto bg-red-600 font-extrabold text-center"
          style={{ width: `${health}%` }}
        >
          Health
        </div>
      </div>
    </div>
  );
}
