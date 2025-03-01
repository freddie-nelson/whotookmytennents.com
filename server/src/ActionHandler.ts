import { Vec2 } from "@engine/src/math/vec";
import { ActionType, MovePlayerData } from "@game/src/actions";
import { PlayerAttackMode } from "@game/src/components/player";
import Game from "@game/src/game";
import { CombatType, PortalType } from "@game/src/systems/attackSystem";
import { Logger } from "@shared/src/Logger";
import Player from "@state/src/Player";
import { z } from "zod";

export const vec2Schema = z.object({
	x: z.number().min(-1).max(1),
	y: z.number().min(-1).max(1),
});

export const movePlayerSchema = vec2Schema;

export const toggleAttackModeSchema = z.object({
	type: z.nativeEnum(PlayerAttackMode),
});

export const portalAttackSchema = z.object({
	type: z.nativeEnum(PortalType),
	mouseDir: vec2Schema,
});

export const combatAttackSchema = z.object({
	type: z.nativeEnum(CombatType),
	mouseDir: vec2Schema,
});

export const mouseDirSchema = z.object({
	dir: vec2Schema,
});

export class ActionHandler {
	static handleAction(game: Game, player: Player, action: ActionType, data: any) {
		switch (action) {
			case ActionType.MOVE_PLAYER:
				this.handleMovePlayer(game, player, data);
				break;

			case ActionType.TOGGLE_ATTACK_MODE:
				this.handleToggleAttackMode(game, player, data);
				break;

			case ActionType.PORTAL_ATTACK:
				this.handlePortalAttack(game, player, data);
				break;

			case ActionType.COMBAT_ATTACK:
				this.handleCombatAttack(game, player, data);
				break;

			case ActionType.MOUSE_DIR:
				this.handleMouseDir(game, player, data);
				break;

			default:
				Logger.errorAndThrow("ACTIONHANDLER", `Unsupported action type '${action}'`);
				break;
		}
	}

	static handleMovePlayer(game: Game, player: Player, d: any) {
		const { success, data } = movePlayerSchema.safeParse(d);
		if (!success) {
			return;
		}

		game.actions.enqueue(ActionType.MOVE_PLAYER, {
			player: player,
			dir: new Vec2(data.x, data.y),
		} satisfies MovePlayerData);
	}

	static handleToggleAttackMode(game: Game, player: Player, d: any) {
		const { success, data } = toggleAttackModeSchema.safeParse(d);
		if (!success) {
			return;
		}

		game.actions.enqueue(ActionType.TOGGLE_ATTACK_MODE, {
			player: player,
			type: data.type,
		});
	}

	static handlePortalAttack(game: Game, player: Player, d: any) {
		const { success, data } = portalAttackSchema.safeParse(d);
		if (!success) {
			return;
		}

		game.actions.enqueue(ActionType.PORTAL_ATTACK, {
			player: player,
			type: data.type,
			mouseDir: new Vec2(data.mouseDir.x, data.mouseDir.y),
		});
	}

	static handleCombatAttack(game: Game, player: Player, d: any) {
		const { success, data } = combatAttackSchema.safeParse(d);
		if (!success) {
			return;
		}

		game.actions.enqueue(ActionType.COMBAT_ATTACK, {
			player: player,
			type: data.type,
			mouseDir: new Vec2(data.mouseDir.x, data.mouseDir.y),
		});
	}

	static handleMouseDir(game: Game, player: Player, d: any) {
		const { success, data } = mouseDirSchema.safeParse(d);
		if (!success) {
			return;
		}

		game.actions.enqueue(ActionType.MOUSE_DIR, {
			player: player,
			dir: new Vec2(data.dir.x, data.dir.y),
		});
	}
}
