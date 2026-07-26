import * as vscode from "vscode";
import { GameState, GameStateSchema } from "../shared/contracts";

const GAME_STATE_KEY = "vybeTutor.gameState";

export function getStoredGameState(
  context: vscode.ExtensionContext
): GameState | undefined {
  const raw = context.globalState.get<unknown>(GAME_STATE_KEY);
  if (!raw) {
    return undefined;
  }

  const parsed = GameStateSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export async function saveGameState(
  context: vscode.ExtensionContext,
  state: GameState
): Promise<void> {
  await context.globalState.update(GAME_STATE_KEY, state);
}
