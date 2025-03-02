import { Transform } from "@engine/src/core/transform";
import { System, SystemType, SystemUpdateData } from "@engine/src/ecs/system";
import { Keyboard } from "@engine/src/input/keyboard";
import { Vec2 } from "@engine/src/math/vec";
import { RectangleCollider } from "@engine/src/physics/collider";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import { GROUND_GROUP } from "@shared/src/groups";
import { State } from "@state/src/state";
import { PLAYER_JUMP_FORCE } from "../actions";

export class PlayerSystem extends System {
  private readonly players: State["players"];

  constructor(players: State["players"]) {
    super(SystemType.SERVER_AND_CLIENT, new Set([]), -1);

    this.players = players;
  }

  public fixedUpdate = ({ engine, registry }: SystemUpdateData) => {
    for (const [id, p] of this.players) {
      if (!registry.has(p.entity)) {
        continue;
      }

      const rigidbody = registry.get(p.entity, Rigidbody);
      const transform = registry.get(p.entity, Transform);
      const collider = registry.get(p.entity, RectangleCollider);

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

      // const t = registry.get(p.entity, Transform);
      // console.log(id, t.position.x, t.position.y);

      p.dir = new Vec2(0, 0);
    }
  };
}
