import Engine, { EngineOptions } from "@engine/src/engine";
import {
	ActionType,
	combatAttackAction,
	combatAttackActionValidator,
	mouseDirAction,
	mouseDirActionValidator,
	movePlayerAction,
	movePlayerActionValidator,
	portalAttackAction,
	portalAttackActionValidator,
	toggleAttackModeAction,
	toggleAttackModeActionValidator,
} from "./actions";
import { PlayerSystem } from "./systems/playerSystem";
import Player from "@state/src/Player";
import { Vec2 } from "@engine/src/math/vec";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import { CircleCollider, RectangleCollider } from "@engine/src/physics/collider";
import { Renderable } from "@engine/src/rendering/renderable";
import { Transform } from "@engine/src/core/transform";
import { ColorTag } from "@engine/src/rendering/colorTag";
import { GROUND_GROUP, PLAYER_GROUP } from "@shared/src/groups";
import { PlayerComponent } from "./components/player";
import { SpriteTag } from "@engine/src/rendering/spriteTag";
import { SpriteType } from "@shared/src/enums";

export default class Game {
	private readonly options: EngineOptions;
	private _engine: Engine;

	constructor(options: EngineOptions) {
		const autoStart = options.autoStart;
		if (autoStart) {
			options.autoStart = false;
		}

		this.options = options;
		this._engine = new Engine(options);

		if (autoStart) {
			this.start();
		}
	}

	/**
	 * Initialises the game and starts the engine/game.
	 */
	public start() {
		// initialise game here
		this._engine.actions.register(ActionType.MOVE_PLAYER, movePlayerAction, movePlayerActionValidator);
		this._engine.actions.register(
			ActionType.TOGGLE_ATTACK_MODE,
			toggleAttackModeAction,
			toggleAttackModeActionValidator
		);
		this._engine.actions.register(ActionType.PORTAL_ATTACK, portalAttackAction, portalAttackActionValidator);
		this._engine.actions.register(ActionType.COMBAT_ATTACK, combatAttackAction, combatAttackActionValidator);
		this._engine.actions.register(ActionType.MOUSE_DIR, mouseDirAction, mouseDirActionValidator);

		this.registry.addSystem(new PlayerSystem(this.options.state.players));

		// start engine
		this._engine.start();
	}

	/**
	 * Stops the game loop.
	 */
	public stop() {
		// stop game here

		// stop engine
		this._engine.stop();
	}

	/**
	 * This calls `update` on the engine.
	 *
	 * @see Engine.update()
	 */
	public update() {
		this._engine.update();
	}

	/**
	 * Destroys the game and engine.
	 *
	 * Creates a new engine ready to be started again.
	 */
	public destroy() {
		// destroy game here

		// destroy engine
		this._engine.dispose();
		this._engine.stop();
		this._engine = new Engine(this.options);
	}

	// game logic
	public createPlayer(player: Player, playerCount: number) {
		const registry = this.registry;

		const playerPos = new Vec2(0, 0);
		const playerWidth = 1;
		const playerHeight = 1.7;

		// PLAYER ENTITY
		const playerEntity = registry.create();
		registry.add(playerEntity, new Transform(playerPos));
		registry.add(playerEntity, new Renderable());
		registry.add(playerEntity, new ColorTag(0xff0000));
		registry.add(playerEntity, new PlayerComponent());
		registry.add(playerEntity, new SpriteTag(playerCount === 1 ? SpriteType.PLAYER_1 : SpriteType.PLAYER_2));

		const playerCollider = registry.add(playerEntity, new RectangleCollider(playerWidth, playerHeight));
		playerCollider.group = PLAYER_GROUP;

		const playerRigidbody = registry.add(playerEntity, new Rigidbody());
		playerRigidbody.inertia = Infinity;
		playerRigidbody.frictionAir = 0.2;
		playerRigidbody.friction = 0;

		// FIST ENTITY
		const fistEntity = registry.create();
		registry.add(fistEntity, new Transform(Vec2.copy(playerPos)));
		registry.add(fistEntity, new Renderable());
		registry.add(fistEntity, new ColorTag(0xff00ff));
		registry.add(fistEntity, new Rigidbody());
		registry.add(fistEntity, new SpriteTag(SpriteType.FIST));

		const fistCollider = registry.add(fistEntity, new RectangleCollider(playerWidth * 0.35, playerWidth * 0.35));
		fistCollider.group = PLAYER_GROUP;
		fistCollider.isSensor = true;

		// PORTAL GUN ENTITY
		const portalGunEntity = registry.create();
		registry.add(portalGunEntity, new Transform(Vec2.copy(playerPos)));
		registry.add(portalGunEntity, new Renderable());
		registry.add(portalGunEntity, new ColorTag(0x00ff00));
		registry.add(portalGunEntity, new SpriteTag(SpriteType.PORTAL_GUN, playerWidth * 0.85, playerWidth * 0.85));

		player.entity = playerEntity;
		player.fistEntity = fistEntity;
		player.portalGunEntity = portalGunEntity;

		return playerEntity;
	}

	public createLevel() {
		const registry = this.registry;

		const map = [
			{ x: 0, y: -5, width: 40, height: 1.5 }, // floor
			{ x: -20, y: 0, width: 1.5, height: 20 }, // left wall
			{ x: 20, y: 0, width: 1.5, height: 20 }, // right wall
		];

		for (const { x, y, width, height } of map) {
			const entity = registry.create();
			registry.add(entity, new Transform(new Vec2(x, y)));
			registry.add(entity, new Rigidbody());
			registry.add(entity, new RectangleCollider(width, height));
			registry.add(entity, new Renderable());
			registry.add(entity, new ColorTag(0x0000ff));
			registry.add(entity, new SpriteTag(SpriteType.GROUND));

			const rigidbody = registry.get(entity, Rigidbody);
			rigidbody.isStatic = true;
			rigidbody.friction = 0;
			rigidbody.frictionAir = 0;
			rigidbody.frictionStatic = 0;

			const collider = registry.get(entity, RectangleCollider);
			collider.group = GROUND_GROUP;
		}
	}

	// getters

	public get engine() {
		return this._engine;
	}

	public get registry() {
		return this._engine.registry;
	}

	public get actions() {
		return this._engine.actions;
	}
}
