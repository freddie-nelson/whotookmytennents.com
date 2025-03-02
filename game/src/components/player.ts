import { type } from "@colyseus/schema";
import { Component } from "@engine/src/ecs/component";
import { Vec2 } from "@engine/src/math/vec";

export enum PlayerAttackMode {
	PORTAL_MODE,
	COMBAT_MODE,
}

export class PlayerComponent extends Component {
	public static readonly COMPONENT_ID: number = 0;

	@type("number") playerNumber: number;
	@type(Vec2) spawn: Vec2;
	@type("number") attackMode: PlayerAttackMode = PlayerAttackMode.PORTAL_MODE;

	constructor(playerNumber: number, spawn: Vec2, attackMode: PlayerAttackMode = PlayerAttackMode.PORTAL_MODE) {
		super(PlayerComponent.COMPONENT_ID);
		this.playerNumber = playerNumber;
		this.spawn = spawn;
		this.attackMode = attackMode;
	}
}
