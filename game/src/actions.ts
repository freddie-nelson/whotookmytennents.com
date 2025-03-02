import { ActionDataValidator, ActionHandler } from "@engine/src/core/actions";
import { Transform } from "@engine/src/core/transform";
import { Vec2 } from "@engine/src/math/vec";
import { Collider, ColliderEvent, RectangleCollider } from "@engine/src/physics/collider";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import { GROUND_GROUP, PLAYER_GROUP } from "@shared/src/groups";
import Player from "@state/src/Player";
import { CombatType, PortalType } from "./systems/attackSystem";
import { PlayerAttackMode, PlayerComponent } from "./components/player";
import { SpriteTag } from "@engine/src/rendering/spriteTag";
import { SpriteType } from "@shared/src/enums";
import { PortalGroundComponent } from "./components/portalGroundTag";

export enum ActionType {
  MOVE_PLAYER,
  TOGGLE_ATTACK_MODE,
  PORTAL_ATTACK,
  COMBAT_ATTACK,
  MOUSE_DIR,
}

export const PLAYER_MOVE_FORCE = 0.5;
export const PLAYER_AIR_MOVE_FORCE = PLAYER_MOVE_FORCE / 2;
export const PLAYER_WALL_JUMP_FORCE = 0.5;
export const PLAYER_JUMP_FORCE = 1.4;

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

  const portalGunSpriteTag = registry.get(player.portalGunEntity, SpriteTag);
  if (type === PlayerAttackMode.PORTAL_MODE) {
    portalGunSpriteTag.opacity = 1;
  } else {
    portalGunSpriteTag.opacity = 0;
  }
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

  const physics = engine.physics;
  const portalGunTransform = registry.get(player.portalGunEntity, Transform);

  const projectile = registry.create();
  registry.add(projectile, new Transform(Vec2.copy(portalGunTransform.position)));
  registry.add(
    projectile,
    new SpriteTag(
      type === PortalType.BLUE ? SpriteType.BLUE_PORTAL_PROJECTILE : SpriteType.ORANGE_PORTAL_PROJECTILE
    )
  );

  const projectileRigidbody = registry.add(projectile, new Rigidbody());
  projectileRigidbody.velocity = Vec2.mul(mouseDir, 2);

  const projectileCollider = registry.add(projectile, new RectangleCollider(0.1, 0.1));
  projectileCollider.isSensor = true;
  projectileCollider.group = PLAYER_GROUP;

  Collider.on(projectileCollider, ColliderEvent.COLLISION_START, (pair, a, b) => {
    if (!registry.has(b.id, PortalGroundComponent)) {
      return;
    }

    console.log("projectile", projectile);
    // registry.destroy(projectile);
  });
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

export interface MouseDirData {
  player: Player;
  dir: Vec2;
}

export const mouseDirAction: ActionHandler<ActionType, MouseDirData> = (engine, action, data, dt) => {
  data.player.mouseDir = data.dir;
};

export const mouseDirActionValidator: ActionDataValidator<ActionType> = (action, data) => {
  return data.player && typeof data.player === "object" && typeof data.dir === "object";
};
