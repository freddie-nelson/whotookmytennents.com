import { type } from "@colyseus/schema";
import { Component } from "@engine/src/ecs/component";

export class GoalComponent extends Component {
	public static readonly COMPONENT_ID: number = 3;

	@type("boolean") public player1Collided: boolean = false;
	@type("boolean") public player2Collided: boolean = false;

	constructor() {
		super(GoalComponent.COMPONENT_ID);
	}
}
