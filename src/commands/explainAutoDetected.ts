import * as vscode from 'vscode';
import { AutoExplainCodeLensProvider } from '../providers/AutoExplainCodeLensProvider';

/**
 * Registers the command backing the auto-detect CodeLens. Selects the
 * detected range and delegates to explainSelection, the same way
 * showMoreFromInline reuses it from the hover link.
 */
export function registerExplainAutoDetectedCommand(
  context: vscode.ExtensionContext,
  codeLensProvider: AutoExplainCodeLensProvider
): void {
  const disposable = vscode.commands.registerCommand(
    'vybeTutor.explainAutoDetected',
    async (uri: vscode.Uri, range: vscode.Range) => {
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      editor.selection = new vscode.Selection(range.start, range.end);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);

      codeLensProvider.clearPending(uri);

      await vscode.commands.executeCommand('vybeTutor.explainSelection');
    }
  );

  context.subscriptions.push(disposable);
}
