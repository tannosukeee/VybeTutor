import * as vscode from 'vscode';

export const DEFAULT_MIN_INSERT_LINES = 3;

export interface DetectedInsertion {
  uri: vscode.Uri;
  range: vscode.Range;
}

/**
 * Detects when a large block of text appears in a single atomic edit —
 * the signature of a pasted snippet or an accepted AI completion, as
 * opposed to a human typing character-by-character.
 */
export class AutoInsertDetectionService {
  handleDocumentChange(
    event: vscode.TextDocumentChangeEvent,
    onDetect: (insertion: DetectedInsertion) => void
  ): void {
    if (event.document.uri.scheme !== 'file') {
      return;
    }

    if (
      event.reason === vscode.TextDocumentChangeReason.Undo ||
      event.reason === vscode.TextDocumentChangeReason.Redo
    ) {
      return;
    }

    if (event.contentChanges.length !== 1) {
      return;
    }

    const config = vscode.workspace.getConfiguration('vybeTutor');
    if (!config.get<boolean>('autoDetect.enabled', true)) {
      return;
    }
    const minLines = config.get<number>('autoDetect.minLines', DEFAULT_MIN_INSERT_LINES);

    const change = event.contentChanges[0];
    const insertedLines = change.text.split('\n').length - 1;
    if (insertedLines < minLines) {
      return;
    }

    const startOffset = event.document.offsetAt(change.range.start);
    const endPosition = event.document.positionAt(startOffset + change.text.length);

    onDetect({
      uri: event.document.uri,
      range: new vscode.Range(change.range.start, endPosition),
    });
  }
}
