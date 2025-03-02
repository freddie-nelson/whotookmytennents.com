import { Transform } from "@engine/src/core/transform";
import { Entity } from "@engine/src/ecs/entity";
import { System, SystemType, SystemUpdateData } from "@engine/src/ecs/system";
import { Keyboard } from "@engine/src/input/keyboard";
import { Vec2 } from "@engine/src/math/vec";
import { RectangleCollider } from "@engine/src/physics/collider";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import { SpriteTag } from "@engine/src/rendering/spriteTag";
import { SpriteType } from "@shared/src/enums";
import { GROUND_GROUP } from "@shared/src/groups";
import { State } from "@state/src/state";
import { PlayerComponent } from "../components/player";

export class PlayerSystem extends System {
  private readonly players: State["players"];

  constructor(players: State["players"]) {
    super(SystemType.SERVER_AND_CLIENT, new Set([]), -1);

    this.players = players;
  }

  public fixedUpdate = ({ engine, registry }: SystemUpdateData) => {
    for (const [id, p] of this.players) {
      if (!registry.has(p.entity) || !registry.has(p.fistEntity) || !registry.has(p.portalGunEntity)) {
        continue;
      }

      const rigidbody = registry.get(p.entity, Rigidbody);
      const transform = registry.get(p.entity, Transform);
      const collider = registry.get(p.entity, RectangleCollider);
      const spriteTag = registry.get(p.entity, SpriteTag);
      const playerComponent = registry.get(p.entity, PlayerComponent);

      const groundCollisions = engine.physics.queryRay(
        transform.position,
        new Vec2(0, -1),
        (collider.height / 2) * 1.02
      );
      const leftCollisions = engine.physics.queryRay(
        transform.position,
        new Vec2(-1, 0),
        (collider.width / 2) * 1.02
      );
      const rightCollisions = engine.physics.queryRay(
        transform.position,
        new Vec2(1, 0),
        (collider.width / 2) * 1.02
      );

      const isGrounded = groundCollisions.some((c) => c.body.collisionFilter.group === GROUND_GROUP);
      const isBlockedLeft = leftCollisions.some((c) => c.body.collisionFilter.group === GROUND_GROUP);
      const isBlockedRight = rightCollisions.some((c) => c.body.collisionFilter.group === GROUND_GROUP);

      if (isGrounded) {
        Rigidbody.setFrictionAir(rigidbody, 0.4);
      } else if ((isBlockedLeft && p.dir.x === -1) || (isBlockedRight && p.dir.x === 1)) {
        Rigidbody.setFrictionAir(rigidbody, 0.8);
      } else {
        Rigidbody.setFrictionAir(rigidbody, 0.05);
      }

      // animation
      if (isGrounded && Math.abs(rigidbody.velocity.x) > 1e-2) {
        spriteTag.spriteType =
          playerComponent.playerNumber === 1 ? SpriteType.PLAYER_1_RUN : SpriteType.PLAYER_2_RUN;
      } else if (isGrounded) {
        spriteTag.spriteType = playerComponent.playerNumber === 1 ? SpriteType.PLAYER_1 : SpriteType.PLAYER_2;
      } else {
        spriteTag.spriteType =
          playerComponent.playerNumber === 1 ? SpriteType.PLAYER_1_JUMP : SpriteType.PLAYER_2_JUMP;
      }

      // const t = registry.get(p.entity, Transform);
      // console.log(id, t.position.x, t.position.y);

      p.dir = new Vec2(0, 0);

      transform.scale.x = Math.sign(p.mouseDir.x) || 1;
      transform.rotation = 0;

      const angle = Vec2.angle(p.mouseDir);

      const fistEntity = registry.get(p.fistEntity)!;
      const fistTransform = Entity.getComponent(fistEntity, Transform);

      fistTransform.position = Vec2.add(transform.position, Vec2.mul(p.mouseDir, collider.width * 0.5));
      fistTransform.rotation = angle;

      const portalGunEntity = registry.get(p.portalGunEntity)!;
      const portalGunTransform = Entity.getComponent(portalGunEntity, Transform);

      portalGunTransform.position = Vec2.add(transform.position, Vec2.mul(p.mouseDir, collider.width * 0.5));
      portalGunTransform.rotation = angle;
      portalGunTransform.scale.y = Math.sign(p.mouseDir.x) || 1;
    }
  };
}
