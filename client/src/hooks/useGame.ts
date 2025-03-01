import { MoveSystem } from "@game/src/systems/moveSystem";
import { EngineType } from "@engine/src/engine";
import { Keyboard } from "@engine/src/input/keyboard";
import { Mouse } from "@engine/src/input/mouse";
import { Renderer } from "@engine/src/rendering/renderer";
// import PhysicsEntitySpriteCreator from "@engine/src/rendering/sprite-creators/physics-entity-sprite-creator";
import Game from "@game/src/game";
import { sharedEngineOptions } from "@shared/src/engine";
import Player from "@state/src/Player";
import { State } from "@state/src/state";
import { Room } from "colyseus.js";
import { useEffect, useState } from "react";
import { ColyseusClient } from "@/api/colyseus";
import { Transform } from "@engine/src/core/transform";
import { AttackSystem } from "@game/src/systems/attackSystem";
import SpriteSpriteCreator, {
	SpriteImage,
	SpriteImageType,
} from "@engine/src/rendering/sprite-creators/sprite-sprite-creator";
import { SpriteType } from "@shared/src/enums";

export function useGame(state: State | null, player?: Player, room?: Room<State>) {
	const [game, setGame] = useState<Game | null>(null);
	const [renderer, setRenderer] = useState<Renderer | null>(null);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		if (!state || !player) {
			return;
		}

		setIsReady(false);

		const game = new Game({
			...sharedEngineOptions,
			type: EngineType.CLIENT,
			state: state,
			autoStart: true,
		});
		setGame(game);

		const renderer = new Renderer({
			autoInit: false,
			autoSize: true,
			backgroundColor: 0xffffff,
		});

		// const spriteCreator = new PhysicsEntitySpriteCreator(0xff0000);
		// renderer.registerSpriteCreator(spriteCreator);

		const spriteImageMap = new Map<SpriteType, SpriteImage>();
		spriteImageMap.set(SpriteType.PLAYER_1, { type: SpriteImageType.SINGLE, src: "/assets/images/Rangers0.png" });
		spriteImageMap.set(SpriteType.PLAYER_2, { type: SpriteImageType.SINGLE, src: "/assets/images/Celtic0.png" });
		spriteImageMap.set(SpriteType.FIST, { type: SpriteImageType.SINGLE, src: "/assets/images/Fist.png" });
		spriteImageMap.set(SpriteType.PORTAL_GUN, {
			type: SpriteImageType.SINGLE,
			src: "/assets/images/TennentsBlaster.png",
		});
		spriteImageMap.set(SpriteType.GROUND, {
			type: SpriteImageType.TILE,
			src: "/assets/images/Tile1.png",
			tileWidth: 32,
			tileHeight: 32,
		});

		renderer.camera.options.zoom = 0.5;
		renderer.getCameraTarget = () => game.registry.get(player.entity, Transform).position;

		setRenderer(renderer);

		game.registry.addSystem(renderer);
		game.registry.addSystem(new MoveSystem(player, room, () => (room ? ColyseusClient.getPing(room.id) : 0)));
		game.registry.addSystem(new AttackSystem(player, room, () => (room ? ColyseusClient.getPing(room.id) : 0)));

		// initalise async engine dependencies
		new Promise<void>(async (resolve) => {
			Keyboard.enable();
			Mouse.enable();

			await renderer.init();

			const spriteCreator = new SpriteSpriteCreator(spriteImageMap);
			await spriteCreator.preloadTextures();
			renderer.registerSpriteCreator(spriteCreator);

			resolve();
		})
			.then(() => {
				setIsReady(true);
			})
			.catch((error) => {
				console.error(error);
				alert(`An error occurred while starting the game: ${error.message}`);
			});

		return () => {
			setIsReady(false);
			setGame(null);
			setRenderer(null);

			return game?.destroy();
		};
	}, [state, player, room]);

	return [game, renderer, isReady && game !== null && renderer !== null] as const;
}
