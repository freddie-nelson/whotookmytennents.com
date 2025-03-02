import { System, SystemType, SystemUpdateData } from "@engine/src/ecs/system";
import { Keyboard } from "@engine/src/input/keyboard";
import { Vec2 } from "@engine/src/math/vec";
import { ClientToRoomMessage, GameActionMessage } from "@shared/src/room";
import Player from "@state/src/Player";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { ActionType, MouseDirData, MovePlayerData } from "../actions";
import { Mouse } from "@engine/src/input/mouse";

export class MouseSystem extends System {
	private static readonly TIMEOUT_TIME = 0.075;

	private readonly player: Player;
	private readonly room?: Room<State>;
	private readonly getActionDelay?: () => number;

	private timer = 0;

	constructor(player: Player, room?: Room<State>, getActionDelay?: () => number) {
		super(SystemType.CLIENT, new Set([]));

		this.player = player;
		this.room = room;
		this.getActionDelay = getActionDelay;
	}

	public update = ({ engine, registry, dt }: SystemUpdateData) => {
		if (!registry.has(this.player.entity)) {
			return;
		}

		if (this.timer > 0) {
			this.timer -= dt;
			return;
		}

		this.timer = MouseSystem.TIMEOUT_TIME;

		const mouseDir = Mouse.getDirection();

		if (!Vec2.equals(mouseDir, this.player.mouseDir)) {
			engine.actions.enqueue(
				ActionType.MOUSE_DIR,
				{
					player: this.player,
					dir: mouseDir,
				} satisfies MouseDirData,
				this.getActionDelay?.()
			);

			this.room?.send(ClientToRoomMessage.GAME_ACTION, {
				action: ActionType.MOUSE_DIR,
				data: { dir: mouseDir },
			} satisfies GameActionMessage);
		}
	};
}
