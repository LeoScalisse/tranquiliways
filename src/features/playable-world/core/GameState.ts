import type { PathId } from "../model.ts";

export type Scene =
  | { type: "hub-nuvem" }
  | { type: "hub-caminho"; path: PathId }
  | { type: "ambiente"; path: PathId; index: number };

interface State {
  currentScene: Scene;
  visitedScenes: Set<string>;
}

class GameStateClass {
  private state: State = {
    currentScene: { type: "hub-nuvem" },
    visitedScenes: new Set(),
  };

  get currentScene(): Scene { return this.state.currentScene; }

  setScene(scene: Scene): void {
    this.state.currentScene = scene;
    this.state.visitedScenes.add(JSON.stringify(scene));
  }

  hasVisited(scene: Scene): boolean {
    return this.state.visitedScenes.has(JSON.stringify(scene));
  }

  reset(): void {
    this.state = { currentScene: { type: "hub-nuvem" }, visitedScenes: new Set() };
  }
}

export const GameState = new GameStateClass();
