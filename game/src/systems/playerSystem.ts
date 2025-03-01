import { Transform } from "@engine/src/core/transform";
import { System, SystemType, SystemUpdateData } from "@engine/src/ecs/system";
import { Vec2 } from "@engine/src/math/vec";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import { State } from "@state/src/state";

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

      // const t = registry.get(p.entity, Transform);
      // console.log(id, t.position.x, t.position.y);
    }
  };
}
