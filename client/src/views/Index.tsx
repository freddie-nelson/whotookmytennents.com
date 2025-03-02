import { useState } from "react";
import { useGameStore, useIsRoomConnected } from "../stores/game";
import { Button } from "@/components/shared/Button";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import { useNavigate } from "react-router-dom";
import { Room } from "colyseus.js";
import { State } from "@state/src/state";

export function Index() {
  const navigate = useNavigate();

  const isRoomConnected = useIsRoomConnected();
  const createRoom = useGameStore((state) => state.createRoom);
  const joinRoomById = useGameStore((state) => state.joinRoomById);

  const [name, setName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const submit = async (cb: () => Promise<Room<State> | null>) => {
    if (isConnecting || isRoomConnected) {
      alert("You are already connected to a room.");
      return;
    }

    if (!name) {
      alert("Please enter a name.");
      return;
    }

    setIsConnecting(true);

    try {
      const r = await cb();
      if (!r) {
        setIsConnecting(false);
        alert("Failed to connect to room.");
        return;
      }

      navigate(`/room/${r.id}`);
    } catch (error) {
      console.error(error);
      alert(`Failed to connect to room. Error: ${(error as Error).message}`);
    }

    setIsConnecting(false);
  };

  return (
    <main className="w-full h-screen bg-[url('static/menu.png')] bg-no-repeat bg-cover bg-center flex justify-between">

      {isConnecting && <LoadingOverlay text="Connecting" />}

      <div className="flex-space-4 flex w-1/2 items-center justify-center flex-col h-screen">
        <div className="">
          <input
            className="border border-tred rounded-md p-3 m-2 text-lg flex flex-col"
            name="name"
            placeholder="Enter a username"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <Button
          className="buttonStyle"
          onClick={() =>
            submit(async () =>
              createRoom({
                name,
              })
            )
          }
        >
          Create Room
        </Button>

        <Button
          className="buttonStyle"
          onClick={() =>
            submit(async () => {
              const id = prompt("Room id: ");
              if (!id) {
                return null;
              }

              return await joinRoomById(id, {
                name,
              });
            })
          }
        >
          Join Room
        </Button>
      </div>

      <div className="flex w-1/2 items-center justify-center flex-col h-screen">
        <h1 className="tennentTitle">Who</h1>
        <h1 className="tennentTitle">Took</h1>
        <h1 className="tennentTitle">Ma</h1>
        <h1 className="tennentTitle">Tennents?</h1>
      </div>

    </main>
  );
}
