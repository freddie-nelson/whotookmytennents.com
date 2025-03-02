import { useGameStore, useIsRoomConnected } from "@/stores/game";
import { PropsWithChildren, useEffect } from "react";
import { LoadingOverlay } from "./LoadingOverlay";

export function NoGameRoute(props: PropsWithChildren) {
  const isRoomConnected = useIsRoomConnected();
  const leaveGame = useGameStore((state) => state.leaveGame);

  useEffect(() => {
    leaveGame();
  }, []);

  if (isRoomConnected) {
    <LoadingOverlay text="Leaving Game" />;
  }

  return props.children;
}
