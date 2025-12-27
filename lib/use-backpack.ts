import { useState, useEffect, useCallback, useRef } from "react";

export const useBackpack = (initialPoints, maxPoints, delayTimeMs) => {
  const [anchorTime, setAnchorTime] = useState(Date.now());
  const [anchorPoints, setAnchorPoints] = useState(initialPoints);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const timePassed = now - anchorTime;
  const recovered = Math.floor(timePassed / delayTimeMs);

  const currentPoints = Math.min(maxPoints, anchorPoints + recovered);

  const nextRecoverIn =
    currentPoints >= maxPoints ? 0 : delayTimeMs - (timePassed % delayTimeMs);

  // Optimistic Update
  const consumePoint = useCallback(() => {
    const currentTime = Date.now();
    const currentPassed = currentTime - anchorTime;
    const currentRecovered = Math.floor(currentPassed / delayTimeMs);
    const realCurrentPoints = Math.min(
      maxPoints,
      anchorPoints + currentRecovered,
    );

    if (realCurrentPoints > 0) {
      const newPoints = realCurrentPoints - 1;

      let newAnchorTime = currentTime;

      if (realCurrentPoints < maxPoints) {
        const remainder = currentPassed % delayTimeMs;
        newAnchorTime = currentTime - remainder;
      }

      setAnchorPoints(newPoints);
      setAnchorTime(newAnchorTime);
      return true;
    }
    return false;
  }, [anchorPoints, anchorTime]);

  // sync from server
  const syncFromServer = useCallback((points: number, lastUpdate: number) => {
    setAnchorPoints(points);
    setAnchorTime(lastUpdate);
  }, []);

  return {
    points: Math.max(currentPoints, 0),
    nextRecoverIn,
    consumePoint,
    syncFromServer,
  };
};
