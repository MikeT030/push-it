import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface GameContextType {
  isGameActive: boolean;
  setIsGameActive: (active: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [isGameActive, setIsGameActive] = useState(false);

  // Lock scroll when game is active
  useEffect(() => {
    if (isGameActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isGameActive]);

  return (
    <GameContext.Provider value={{ isGameActive, setIsGameActive }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
