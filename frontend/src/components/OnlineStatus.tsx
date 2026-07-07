import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-red-500 text-white text-center py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2">
      <WifiOff className="w-3.5 h-3.5" />
      Anda sedang offline. Beberapa fitur mungkin tidak tersedia.
    </div>
  );
}
