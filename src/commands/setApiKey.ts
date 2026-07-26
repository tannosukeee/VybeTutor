import * as vscode from 'vscode';
import { storeGeminiApiKey } from '../ai/geminiService';

export function registerSetApiKeyCommand(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('vybeTutor.setApiKey', async () => {
    const apiKey = await vscode.window.showInputBox({
      title: 'Vybe Tutor: Gemini API Key',
      prompt: 'Enter your Gemini API key (stored securely, never leaves this machine)',
      password: true,
      ignoreFocusOut: true,
    });

    if (!apiKey) {
      return;
    }

    await storeGeminiApiKey(context, apiKey);
    vscode.window.showInformationMessage('Vybe Tutor: Gemini API key saved.');
  });

  context.subscriptions.push(disposable);
}
