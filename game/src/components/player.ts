import { type } from "@colyseus/schema";
import { Component } from "@engine/src/ecs/component";

export enum PlayerAttackMode {
  PORTAL_MODE,
  COMBAT_MODE,
}

export class PlayerComponent extends Component {
  public static readonly COMPONENT_ID: number = 0;

  @type("number") playerNumber: number;
  @type("number") attackMode: PlayerAttackMode = PlayerAttackMode.PORTAL_MODE;

  constructor(playerNumber: number, attackMode: PlayerAttackMode = PlayerAttackMode.PORTAL_MODE) {
    super(PlayerComponent.COMPONENT_ID);
    this.playerNumber = playerNumber;
    this.attackMode = attackMode;
  }
}
