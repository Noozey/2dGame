import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

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

  const totalHearts = 10;
  const filledHearts = Math.ceil(health / 10);

  return (
    <div id="ui-root" className="">
      {/* Hearts Display */}
      <div className="flex justify-center gap-1 mb-2">
        {Array.from({ length: totalHearts }).map((_, index) => (
          <Heart
            key={index}
            size={24}
            className={index < filledHearts ? "text-red-600" : "text-gray-400"}
            fill={index < filledHearts ? "#DC2626" : "#9CA3AF"}
          />
        ))}
      </div>
    </div>
  );
}
