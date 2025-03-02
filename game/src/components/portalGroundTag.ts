import { type } from "@colyseus/schema";
import { Component } from "@engine/src/ecs/component";

export enum PlayerAttackMode {
  PORTAL_MODE,
  COMBAT_MODE,
}

export class PortalGroundComponent extends Component {
  public static readonly COMPONENT_ID: number = 1;

  constructor() {
    super(PortalGroundComponent.COMPONENT_ID);
  }
}
