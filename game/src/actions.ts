import { ActionDataValidator, ActionHandler } from "@engine/src/core/actions";
import { Transform } from "@engine/src/core/transform";
import { Vec2 } from "@engine/src/math/vec";
import { RectangleCollider } from "@engine/src/physics/collider";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import { GROUND_GROUP } from "@shared/src/groups";
import Player from "@state/src/Player";
import { CombatType, PortalType } from "./systems/attackSystem";
import { PlayerAttackMode, PlayerComponent } from "./components/player";

export enum ActionType {
  MOVE_PLAYER,
  TOGGLE_ATTACK_MODE,
  PORTAL_ATTACK,
  COMBAT_ATTACK,
}

export const PLAYER_MOVE_FORCE = 0.6;
export const PLAYER_AIR_MOVE_FORCE = PLAYER_MOVE_FORCE / 2;
export const PLAYER_WALL_JUMP_FORCE = 0.5;
export const PLAYER_JUMP_FORCE = 1.75;

export interface MovePlayerData {
  player: Player;
  dir: Vec2;
}

export const movePlayerAction: ActionHandler<ActionType, MovePlayerData> = (engine, action, data, dt) => {
  const { player, dir } = data;
  if (!player || !dir) {
    return;
  }

  player.dir = dir;

  const registry = engine.registry;
  if (!registry.has(player.entity)) {
    return;
  }

  const rigidbody = registry.get(player.entity, Rigidbody);
  const transform = registry.get(player.entity, Transform);
  const collider = registry.get(player.entity, RectangleCollider);

  const groundCollisions = engine.physics.queryRay(
    transform.position,
    new Vec2(0, -1),
    (collider.height / 2) * 1.02
  );
  // const leftCollisions = engine.physics.queryRay(transform.position, new Vec2(-1, 0), (collider.width / 2) * 1.02);
  // const rightCollisions = engine.physics.queryRay(transform.position, new Vec2(1, 0), (collider.width / 2) * 1.02);

  const isGrounded = groundCollisions.some((c) => c.body.collisionFilter.group === GROUND_GROUP);
  // const isBlockedLeft = leftCollisions.some((c) => c.bodyA.collisionFilter.group === GROUND_GROUP);
  // const isBlockedRight = rightCollisions.some((c) => c.bodyA.collisionFilter.group === GROUND_GROUP);

  if (dir.y === 1) {
    if (isGrounded) {
      Rigidbody.setVelocity(rigidbody, new Vec2(rigidbody.velocity.x, PLAYER_JUMP_FORCE));
    }
    // else if (isBlockedLeft) {
    // 	Rigidbody.setVelocity(
    // 		rigidbody,
    // 		new Vec2(rigidbody.velocity.x + PLAYER_WALL_JUMP_FORCE, PLAYER_JUMP_FORCE)
    // 	);
    // }
    // else if (isBlockedRight) {
    // 	Rigidbody.setVelocity(
    // 		rigidbody,
    // 		new Vec2(rigidbody.velocity.x - PLAYER_WALL_JUMP_FORCE, PLAYER_JUMP_FORCE)
    // 	);
    // }
  }

  let force = PLAYER_MOVE_FORCE;
  if (!isGrounded) {
    force = PLAYER_AIR_MOVE_FORCE;
  }

  Rigidbody.setVelocity(
    rigidbody,
    new Vec2(dir.x !== 0 ? dir.x * force : rigidbody.velocity.x, rigidbody.velocity.y)
  );
};

export const movePlayerActionValidator: ActionDataValidator<ActionType> = (action, data) => {
  return data.player && data.dir && typeof data.player === "object" && typeof data.dir === "object";
};

export interface ToggleAttackModeData {
  player: Player;
  type: PlayerAttackMode;
}

export const toggleAttackModeAction: ActionHandler<ActionType, ToggleAttackModeData> = (
  engine,
  action,
  data,
  dt
) => {
  const { player, type } = data;

  if (!player) {
    return;
  }

  const registry = engine.registry;
  if (!registry.has(player.entity)) {
    return;
  }

  const playerComponent = registry.get(player.entity, PlayerComponent);
  playerComponent.attackMode = type;
};

export const toggleAttackModeActionValidator: ActionDataValidator<ActionType> = (action, data) => {
  return data.player && typeof data.player === "object" && typeof data.type === "number";
};

export interface PortalAttackData {
  player: Player;
  type: PortalType;
  mouseDir: Vec2;
}

export const portalAttackAction: ActionHandler<ActionType, PortalAttackData> = (engine, action, data, dt) => {
  const { player, type, mouseDir } = data;

  const registry = engine.registry;
  if (!registry.has(player.entity)) {
    return;
  }
};

export const portalAttackActionValidator: ActionDataValidator<ActionType> = (action, data) => {
  return (
    data.player &&
    typeof data.player === "object" &&
    typeof data.type === "number" &&
    typeof data.mouseDir === "object"
  );
};

export interface CombatAttackData {
  player: Player;
  type: CombatType;
  mouseDir: Vec2;
}

export const combatAttackAction: ActionHandler<ActionType, CombatAttackData> = (engine, action, data, dt) => {
  const { player, type, mouseDir } = data;

  const registry = engine.registry;
  if (!registry.has(player.entity)) {
    return;
  }
};

export const combatAttackActionValidator: ActionDataValidator<ActionType> = (action, data) => {
  return (
    data.player &&
    typeof data.player === "object" &&
    typeof data.type === "number" &&
    typeof data.mouseDir === "object"
  );
};
