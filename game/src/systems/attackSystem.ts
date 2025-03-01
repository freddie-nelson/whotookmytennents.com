import { System, SystemType, SystemUpdateData } from "@engine/src/ecs/system";
import { Keyboard } from "@engine/src/input/keyboard";
import { Vec2 } from "@engine/src/math/vec";
import { ClientToRoomMessage, GameActionMessage } from "@shared/src/room";
import Player from "@state/src/Player";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { ActionType, CombatAttackData, PortalAttackData, ToggleAttackModeData } from "../actions";
import { Mouse, MouseButton } from "@engine/src/input/mouse";
import { PlayerAttackMode, PlayerComponent } from "../components/player";

export enum PortalType {
	ORANGE,
	BLUE,
}

export enum CombatType {
	SHOOT,
	MELEE,
}

export class AttackSystem extends System {
	private readonly player: Player;
	private readonly room?: Room<State>;
	private readonly getActionDelay?: () => number;

	constructor(player: Player, room?: Room<State>, getActionDelay?: () => number) {
		super(SystemType.CLIENT, new Set([]));

		this.player = player;
		this.room = room;
		this.getActionDelay = getActionDelay;
	}

	public update = ({ engine, registry }: SystemUpdateData) => {
		if (!registry.has(this.player.entity)) {
			return;
		}

		const player = registry.get(this.player.entity, PlayerComponent);
		const qClicked = Keyboard.isKeyPressedThisUpdate("q");

		if (qClicked) {
			const newAttackMode =
				player.attackMode === PlayerAttackMode.PORTAL_MODE
					? PlayerAttackMode.COMBAT_MODE
					: PlayerAttackMode.PORTAL_MODE;

			engine.actions.enqueue(
				ActionType.TOGGLE_ATTACK_MODE,
				{
					player: this.player,
					type: newAttackMode,
				} satisfies ToggleAttackModeData,
				this.getActionDelay?.()
			);

			this.room?.send(ClientToRoomMessage.GAME_ACTION, {
				action: ActionType.TOGGLE_ATTACK_MODE,
				data: { type: newAttackMode },
			} satisfies GameActionMessage);
		}

		const leftClick = Mouse.isButtonPressedThisUpdate(MouseButton.LEFT);
		const rightClick = Mouse.isButtonPressedThisUpdate(MouseButton.RIGHT);

		if (leftClick || rightClick) {
			if (player.attackMode === PlayerAttackMode.PORTAL_MODE) {
				engine.actions.enqueue(
					ActionType.PORTAL_ATTACK,
					{
						player: this.player,
						type: leftClick ? PortalType.ORANGE : PortalType.BLUE,
					} satisfies PortalAttackData,
					this.getActionDelay?.()
				);

				this.room?.send(ClientToRoomMessage.GAME_ACTION, {
					action: ActionType.PORTAL_ATTACK,
					data: { type: leftClick ? PortalType.ORANGE : PortalType.BLUE },
				} satisfies GameActionMessage);
			} else if (player.attackMode === PlayerAttackMode.COMBAT_MODE) {
				engine.actions.enqueue(
					ActionType.COMBAT_ATTACK,
					{
						player: this.player,
						type: leftClick ? CombatType.SHOOT : CombatType.MELEE,
					} satisfies CombatAttackData,
					this.getActionDelay?.()
				);

				this.room?.send(ClientToRoomMessage.GAME_ACTION, {
					action: ActionType.COMBAT_ATTACK,
					data: { type: leftClick ? CombatType.SHOOT : CombatType.MELEE },
				} satisfies GameActionMessage);
			}
		}
	};
}
