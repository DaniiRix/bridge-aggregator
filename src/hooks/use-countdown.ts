import { useCallback, useEffect, useState } from "react";

export const useCountdown = (targetTimeMs: number) => {
  const getRemaining = useCallback(() => {
    return Math.max(Math.ceil((targetTimeMs - Date.now()) / 1000), 0);
  }, [targetTimeMs]);

  const [secondsLeft, setSecondsLeft] = useState(getRemaining());

  useEffect(() => {
    setSecondsLeft(getRemaining());

    const interval = setInterval(() => {
      setSecondsLeft(getRemaining());
    }, 100);

    return () => clearInterval(interval);
  }, [getRemaining]);

  return secondsLeft;
};
