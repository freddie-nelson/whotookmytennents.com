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
import { CircleCollider, ColliderEvent, RectangleCollider } from "@engine/src/physics/collider";
import { Renderable } from "@engine/src/rendering/renderable";
import { Transform } from "@engine/src/core/transform";
import { ColorTag } from "@engine/src/rendering/colorTag";
import { GROUND_GROUP, PLAYER_GROUP, SPIKE_GROUP } from "@shared/src/groups";
import { PlayerComponent } from "./components/player";
import { SpriteTag } from "@engine/src/rendering/spriteTag";
import { SpriteType } from "@shared/src/enums";
import { PortalGroundComponent } from "./components/portalGroundTag";
import { ProjectileSystem } from "./systems/projectileSystem";
import { levels } from "./maps";
import { Logger } from "@shared/src/Logger";

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
		this.registry.addSystem(new ProjectileSystem());

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
	public createPlayer(player: Player, playerCount: number, spawn: Vec2) {
		const registry = this.registry;

		const playerPos = Vec2.copy(spawn);
		const playerWidth = 1;
		const playerHeight = 1.7;

		// PLAYER ENTITY
		const playerEntity = registry.create();
		registry.add(playerEntity, new Renderable());
		registry.add(playerEntity, new ColorTag(0xff0000));
		registry.add(playerEntity, new PlayerComponent(playerCount, spawn));
		registry.add(playerEntity, new SpriteTag(playerCount === 1 ? SpriteType.PLAYER_1 : SpriteType.PLAYER_2));

		const playerTransform = registry.add(playerEntity, new Transform(playerPos));
		playerTransform.zIndex = 1;

		const playerCollider = registry.add(playerEntity, new RectangleCollider(playerWidth, playerHeight));
		playerCollider.group = PLAYER_GROUP;

		const playerRigidbody = registry.add(playerEntity, new Rigidbody());
		playerRigidbody.inertia = Infinity;
		playerRigidbody.frictionAir = 0.2;
		playerRigidbody.friction = 0;

		// FIST ENTITY
		const fistEntity = registry.create();
		registry.add(fistEntity, new Renderable());
		registry.add(fistEntity, new ColorTag(0xff00ff));
		registry.add(fistEntity, new Rigidbody());
		registry.add(fistEntity, new SpriteTag(SpriteType.FIST));

		const fistTransform = registry.add(fistEntity, new Transform(Vec2.copy(playerPos)));
		fistTransform.zIndex = 2;

		const fistCollider = registry.add(fistEntity, new RectangleCollider(playerWidth * 0.35, playerWidth * 0.35));
		fistCollider.group = PLAYER_GROUP;
		fistCollider.isSensor = true;

		// PORTAL GUN ENTITY
		const portalGunEntity = registry.create();
		registry.add(portalGunEntity, new Renderable());
		registry.add(portalGunEntity, new ColorTag(0x00ff00));
		registry.add(portalGunEntity, new SpriteTag(SpriteType.PORTAL_GUN, playerWidth * 0.85, playerWidth * 0.85));

		const portalGunTransform = registry.add(portalGunEntity, new Transform(Vec2.copy(playerPos)));
		portalGunTransform.zIndex = 3;

		player.entity = playerEntity;
		player.fistEntity = fistEntity;
		player.portalGunEntity = portalGunEntity;

		return playerEntity;
	}

	public createLevel() {
		const level = levels[0];
		const spawns = [];

		for (const { type, x, y, width, height } of level) {
			switch (type) {
				case "ground":
					this.createGround(x, -y, width, height);
					break;

				case "spike":
					this.createSpike(x, -y, width, height);
					break;

				case "spawn":
					this.createSpawn(x, -y, width, height);
					spawns.push(new Vec2(x, -y));
					break;

				default:
					Logger.errorAndThrow("GAME", `Unknown level object type: ${type}`);
			}
		}

		if (spawns.length === 0) {
			Logger.errorAndThrow("GAME", "No spawn points found in level");
		}

		return spawns;
	}

	private createGround(x: number, y: number, width: number, height: number) {
		const entity = this.registry.create();
		this.registry.add(entity, new Transform(new Vec2(x, y)));
		this.registry.add(entity, new Renderable());
		this.registry.add(entity, new ColorTag(0x0000ff));
		this.registry.add(entity, new SpriteTag(SpriteType.GROUND));
		this.registry.add(entity, new PortalGroundComponent());

		const rigidbody = this.registry.add(entity, new Rigidbody());
		rigidbody.isStatic = true;
		rigidbody.friction = 0;
		rigidbody.frictionAir = 0;
		rigidbody.frictionStatic = 0;

		const collider = this.registry.add(entity, new RectangleCollider(width, height));
		collider.group = GROUND_GROUP;
	}

	private createSpike(x: number, y: number, width: number, height: number) {
		const entity = this.registry.create();
		this.registry.add(entity, new Transform(new Vec2(x, y)));
		this.registry.add(entity, new Renderable());
		this.registry.add(entity, new ColorTag(0xff0000));
		this.registry.add(entity, new SpriteTag(SpriteType.SPIKE));

		const rigidbody = this.registry.add(entity, new Rigidbody());
		rigidbody.isStatic = true;
		rigidbody.friction = 0;
		rigidbody.frictionAir = 0;
		rigidbody.frictionStatic = 0;

		const collider = this.registry.add(entity, new RectangleCollider(width, height));
		collider.group = SPIKE_GROUP;
		RectangleCollider.on(collider, ColliderEvent.COLLISION_START, (pair, a, b) => {
			if (!this.registry.has(b.id, PlayerComponent)) {
				return;
			}

			const playerPlayerComponent = this.registry.get(b.id, PlayerComponent);
			const playerRigidbody = this.registry.get(b.id, Rigidbody);
			Rigidbody.setPosition(
				playerRigidbody,
				new Vec2(playerPlayerComponent.spawn.x, playerPlayerComponent.spawn.y)
			);
		});
	}

	private createSpawn(x: number, y: number, width: number, height: number) {
		const entity = this.registry.create();
		this.registry.add(entity, new Transform(new Vec2(x, y)));
		this.registry.add(entity, new Renderable());
		this.registry.add(entity, new ColorTag(0x00ff00));
		this.registry.add(entity, new SpriteTag(SpriteType.NONE, width, height));
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
