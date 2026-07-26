import * as vscode from 'vscode';

const PENDING_TIMEOUT_MS = 20000;

interface PendingInsertion {
  range: vscode.Range;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * Shows a single dismissible "Explain this" CodeLens above a block of
 * code that was just pasted or inserted by an AI completion. The lens
 * expires on its own after PENDING_TIMEOUT_MS so stale prompts don't linger.
 */
export class AutoExplainCodeLensProvider implements vscode.CodeLensProvider {
  private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  private readonly _pending = new Map<string, PendingInsertion>();

  setPending(uri: vscode.Uri, range: vscode.Range): void {
    this.clearPending(uri, false);

    const timeout = setTimeout(() => {
      this._pending.delete(uri.toString());
      this._onDidChangeCodeLenses.fire();
    }, PENDING_TIMEOUT_MS);

    this._pending.set(uri.toString(), { range, timeout });
    this._onDidChangeCodeLenses.fire();
  }

  clearPending(uri: vscode.Uri, notify = true): void {
    const key = uri.toString();
    const existing = this._pending.get(key);
    if (!existing) {
      return;
    }

    clearTimeout(existing.timeout);
    this._pending.delete(key);
    if (notify) {
      this._onDidChangeCodeLenses.fire();
    }
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const pending = this._pending.get(document.uri.toString());
    if (!pending) {
      return [];
    }

    const lensRange = new vscode.Range(pending.range.start, pending.range.start);
    return [
      new vscode.CodeLens(lensRange, {
        title: '✨ Explain this — Vybe Tutor',
        command: 'vybeTutor.explainAutoDetected',
        arguments: [document.uri, pending.range],
      }),
    ];
  }

  dispose(): void {
    for (const { timeout } of this._pending.values()) {
      clearTimeout(timeout);
    }
    this._pending.clear();
    this._onDidChangeCodeLenses.dispose();
  }
}
