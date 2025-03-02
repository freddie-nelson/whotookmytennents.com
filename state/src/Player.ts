import { ArraySchema, Schema, type } from "@colyseus/schema";
import { Vec2 } from "@engine/src/math/vec";

export default class Player extends Schema {
  @type("string") public sessionId: string = "";
  @type("string") public name: string = "";
  @type("boolean") public isHost: boolean = false;
  @type("string") public entity = "";
  @type("string") public fistEntity = "";
  @type("string") public portalGunEntity = "";
  @type(Vec2) public dir = new Vec2();
  @type(Vec2) public mouseDir = new Vec2();
  @type(["string"]) public portalEntities: ArraySchema<string> = new ArraySchema<string>();

  constructor(sessionId: string, name: string, isHost: boolean) {
    super();

    this.sessionId = sessionId;
    this.name = name;
    this.isHost = isHost;
  }
}
