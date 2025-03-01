import { ActionDataValidator, ActionHandler } from "@engine/src/core/actions";
import { Transform } from "@engine/src/core/transform";
import { Vec2 } from "@engine/src/math/vec";
import { RectangleCollider } from "@engine/src/physics/collider";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import { GROUND_GROUP } from "@shared/src/groups";
import Player from "@state/src/Player";

export enum ActionType {
	MOVE_PLAYER,
}

export const PLAYER_MOVE_FORCE = 0.000004;
export const PLAYER_JUMP_FORCE = 1;

export interface MovePlayerData {
	player: Player;
	dir: Vec2;
}

export const movePlayerAction: ActionHandler<ActionType, MovePlayerData> = (engine, action, data, dt) => {
	const { player, dir } = data;
	if (!player || !dir) {
		return;
	}

	const registry = engine.registry;
	if (!registry.has(player.entity)) {
		return;
	}

	const rigidbody = registry.get(player.entity, Rigidbody);
	const transform = registry.get(player.entity, Transform);
	const collider = registry.get(player.entity, RectangleCollider);

	const groundCollisions = engine.physics.queryRay(transform.position, new Vec2(0, -1), (collider.height / 2) * 1.02);
	const leftCollisions = engine.physics.queryRay(transform.position, new Vec2(-1, 0), (collider.width / 2) * 1.02);
	const rightCollisions = engine.physics.queryRay(transform.position, new Vec2(1, 0), (collider.width / 2) * 1.02);

	const isGrounded = groundCollisions.some((c) => c.bodyA.collisionFilter.group === GROUND_GROUP);
	const isBlockedLeft = leftCollisions.some((c) => c.bodyA.collisionFilter.group === GROUND_GROUP);
	const isBlockedRight = rightCollisions.some((c) => c.bodyA.collisionFilter.group === GROUND_GROUP);

	if (dir.y === 1 && (isGrounded || isBlockedLeft || isBlockedRight)) {
		Rigidbody.setVelocity(rigidbody, new Vec2(rigidbody.velocity.x, PLAYER_JUMP_FORCE));
	}

	Rigidbody.applyForce(rigidbody, new Vec2(dir.x * PLAYER_MOVE_FORCE, 0));
};

export const movePlayerActionValidator: ActionDataValidator<ActionType> = (action, data) => {
	return data.player && data.dir && typeof data.player === "object" && typeof data.dir === "object";
};
