import {
	Color,
	ColorSource,
	ContainerChild,
	Graphics,
	Assets,
	Sprite,
	Texture,
	Container,
	TilingSprite,
} from "pixi.js";
import { SpriteCreator, SpriteCreatorCreate, SpriteCreatorDelete, SpriteCreatorUpdate } from "../renderer";
import { Rigidbody } from "../../physics/rigidbody";
import { CircleCollider, ColliderType, PolygonCollider, RectangleCollider } from "../../physics/collider";
import { PhysicsWorld } from "../../physics/world";
import { Transform } from "../../core/transform";
import { Logger } from "@shared/src/Logger";
import { Entity } from "../../ecs/entity";
import { ColorTag } from "../colorTag";
import { Vec2 } from "../../math/vec";
import { lerp } from "../../math/lerp";
import { CLIENT_LERP_RATE } from "../../engine";
import { SpriteTag } from "../spriteTag";

export enum SpriteImageType {
	SINGLE,
	TILE,
	ANIMATED,
}

export interface SpriteImage {
	type: SpriteImageType;
	src: string;
	tileWidth?: number;
	tileHeight?: number;
}

/**
 * Creates sprites based on entities with the SpriteTag component.
 *
 * @note YOU MUST CALL `preloadTextures` BEFORE USING THE SPRITE CREATOR
 */
export default class SpriteSpriteCreator implements SpriteCreator {
	public readonly query = new Set([Transform, SpriteTag]);

	private readonly spriteImageMap: Map<number, SpriteImage>;
	private readonly textureCache: Map<string, Texture>;

	constructor(spriteImageMap: Map<number, SpriteImage> = new Map()) {
		this.spriteImageMap = spriteImageMap;
		this.textureCache = new Map();
	}

	public readonly create: SpriteCreatorCreate = ({ app, registry, world, entity }) => {
		const e = registry.get(entity);

		const transform = Entity.getComponent(e, Transform);
		const spriteTag = Entity.getComponent(e, SpriteTag);

		const collider = PhysicsWorld.getCollider(e);

		if (!this.spriteImageMap.has(spriteTag.spriteType)) {
			Logger.errorAndThrow(
				"RENDERER",
				`Sprite image map does not contain an image for type '${spriteTag.spriteType}'.`
			);
		}

		const image = this.spriteImageMap.get(spriteTag.spriteType)!;
		const texture = this.getTexture(image.src);
		if (!texture) {
			Logger.errorAndThrow("RENDERER", `Texture for image '${image}' not found.`);
		}

		let width = 0;
		let height = 0;

		if (!collider) {
			width = spriteTag.overrideWidth;
			height = spriteTag.overrideHeight;
		} else {
			switch (collider.type) {
				case ColliderType.CIRCLE: {
					const circle = collider as CircleCollider;
					width = circle.radius * 2;
					height = circle.radius * 2;
					break;
				}
				case ColliderType.RECTANGLE: {
					const rect = collider as RectangleCollider;
					width = rect.width;
					height = rect.height;
					break;
				}
				case ColliderType.POLYGON:
					// ! TODO: Implement this at some point <3
					Logger.errorAndThrow("RENDERER", "Polygon colliders are not supported in sprite sprite creator.");
					break;
				default:
					Logger.errorAndThrow(
						"RENDERER",
						`Unsupported collider type in sprite sprite creator: ${collider.type}`
					);
					break;
			}
		}

		width = spriteTag.overrideWidth || width;
		height = spriteTag.overrideHeight || height;

		const container = new Container();
		container.pivot.set(width / 2, height / 2);

		let s: ContainerChild;
		switch (image.type) {
			case SpriteImageType.SINGLE:
				s = new Sprite({
					texture,
					width,
					height,
				});
				break;
			case SpriteImageType.TILE:
				if (typeof image.tileWidth !== "number" || typeof image.tileHeight !== "number") {
					Logger.errorAndThrow("RENDERER", "Tile image must have tileWidth and tileHeight defined.");

					// this will never happen
					return container;
				}

				s = new TilingSprite({
					texture,
					width,
					height,
				});
				(s as TilingSprite).tileScale.set(1 / image.tileWidth!, 1 / image.tileHeight!);
				break;
			case SpriteImageType.ANIMATED:
			default:
				Logger.errorAndThrow("RENDERER", `Unsupported sprite image type: ${image.type}`);

				// will never happen
				return container;
		}

		container.addChild(s);
		world.addChild(container);

		const position = Vec2.lerp(new Vec2(container.position.x, container.position.y), transform.position, 0.2);
		container.position.set(position.x, position.y);

		container.rotation = transform.rotation;
		container.scale.set(transform.scale.x, -transform.scale.y);
		container.zIndex = transform.zIndex;

		return container;
	};

	public readonly update: SpriteCreatorUpdate = ({ registry, app, entity, sprite, dt }) => {
		const e = registry.get(entity);
		const s = sprite!;

		const collider = PhysicsWorld.getCollider(e);
		const transform = Entity.getComponent(e, Transform);

		const position = Vec2.lerp(new Vec2(s.position.x, s.position.y), transform.position, CLIENT_LERP_RATE);
		s.position.set(position.x, position.y);

		s.rotation = lerp(s.rotation, transform.rotation, CLIENT_LERP_RATE);
		s.scale.set(transform.scale.x, -transform.scale.y);
		s.zIndex = transform.zIndex;
	};

	public readonly delete: SpriteCreatorDelete = ({ registry, app, entity, sprite }) => {
		sprite!.removeFromParent();
		sprite!.destroy();
	};

	/**
	 * Preload textures into the sprite creator.
	 *
	 * @note YOU MUST CALL THIS BEFORE USING THE SPRITE CREATOR
	 */
	public async preloadTextures() {
		for (const image of this.spriteImageMap.values()) {
			const res = await Assets.load(image);
			this.textureCache.set(image.src, res);
		}
	}

	private getTexture(image: string) {
		return this.textureCache.get(image);
	}
}
