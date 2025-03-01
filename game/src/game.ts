import Engine, { EngineOptions } from "@engine/src/engine";
import { ActionType, movePlayerAction, movePlayerActionValidator } from "./actions";
import { PlayerSystem } from "./systems/playerSystem";
import Player from "@state/src/Player";
import { Vec2 } from "@engine/src/math/vec";
import { Rigidbody } from "@engine/src/physics/rigidbody";
import { CircleCollider, RectangleCollider } from "@engine/src/physics/collider";
import { Renderable } from "@engine/src/rendering/renderable";
import { Transform } from "@engine/src/core/transform";
import { ColorTag } from "@engine/src/rendering/colorTag";
import { GROUND_GROUP } from "@shared/src/groups";

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
  public createPlayer(player: Player) {
    const registry = this.registry;

    const playerEntity = registry.create();
    registry.add(playerEntity, new Transform(new Vec2((Math.random() - 0.5) * 2)));
    registry.add(playerEntity, new Rigidbody());
    registry.add(playerEntity, new RectangleCollider(1.5, 1.5));
    registry.add(playerEntity, new Renderable());
    registry.add(playerEntity, new ColorTag(0xff0000));

    const rigidbody = registry.get(playerEntity, Rigidbody);
    rigidbody.inertia = Infinity;
    rigidbody.frictionAir = 0.2;
    rigidbody.friction = 0;

    player.entity = playerEntity;

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
