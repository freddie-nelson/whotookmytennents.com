import { System, SystemType, SystemUpdateData } from "@engine/src/ecs/system";
import { ProjectileComponent } from "../components/projectile";
import { Rigidbody } from "@engine/src/physics/rigidbody";

export class ProjectileSystem extends System {
  constructor() {
    super(SystemType.SERVER_AND_CLIENT, new Set([Rigidbody, ProjectileComponent]));
  }

  public update = ({ registry, entities }: SystemUpdateData) => {
    for (const entity of entities) {
      const projectile = registry.get(entity, ProjectileComponent);
      const rigidbody = registry.get(entity, Rigidbody);

      Rigidbody.setVelocity(rigidbody, projectile.velocity);
    }
  };
}
