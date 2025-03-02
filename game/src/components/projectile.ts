import { type } from "@colyseus/schema";
import { Component } from "@engine/src/ecs/component";
import { Vec2 } from "@engine/src/math/vec";

export enum PlayerAttackMode {
  PORTAL_MODE,
  COMBAT_MODE,
}

export class ProjectileComponent extends Component {
  public static readonly COMPONENT_ID: number = 2;

  @type(Vec2) velocity: Vec2 = new Vec2(0, 0);

  constructor(velocity = new Vec2(0, 0)) {
    super(ProjectileComponent.COMPONENT_ID);

    this.velocity = velocity;
  }
}
