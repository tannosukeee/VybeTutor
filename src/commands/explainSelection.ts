import * as vscode from 'vscode';
import { TutorViewProvider } from '../views/TutorViewProvider';
import { getTutorResponse } from '../ai/geminiService';
import { TutorResponse } from '../shared/contracts';

const GENERIC_HINT = 'Re-read the explanation above, then think about what each part of the code is doing.';

export function registerExplainSelectionCommand(
  context: vscode.ExtensionContext,
  provider: TutorViewProvider
): void {
  const disposable = vscode.commands.registerCommand('vybeTutor.explainSelection', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('Vybe Tutor: Select some code first.');
      return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (!selectedText || selectedText.trim().length === 0) {
      vscode.window.showInformationMessage('Vybe Tutor: Select some code first.');
      return;
    }

    const languageId = editor.document.languageId;
    const fileName = editor.document.fileName.split(/[\\/]/).pop() || 'unknown';
    const startLine = selection.start.line + 1;
    const lineReference = `Line ${startLine} · ${fileName}`;

    await vscode.commands.executeCommand('vybeTutor.tutorView.focus');

    try {
      const response = await getTutorResponse({
        context,
        selectedCode: selectedText,
        languageId,
        useMock: false,
      });

      const mapped = toMockShape(response, lineReference, languageId, fileName);

      setTimeout(() => {
        provider.postMessage({
          type: 'mockExplanation',
          data: mapped,
        });
      }, 100);
    } catch {
      vscode.window.showErrorMessage('Vybe Tutor could not generate an explanation. Try again.');
    }
  });
  context.subscriptions.push(disposable);
}

interface MockTutorResponse {
  concept: string;
  lineReference: string;
  explanation: string;
  codeTokens: string[];
  language: string;
  fileName: string;
  quiz: {
    question: string;
    choices: string[];
    correctAnswerIndex: number;
    hint: string;
    explanation: string;
  };
}

/**
 * Maps the real TutorResponse schema (title/keyConcepts/quiz[].options) onto
 * the shape MockExplainPreview already renders (concept/codeTokens/quiz.choices),
 * so the existing gamified webview UI keeps working unchanged.
 */
function toMockShape(
  response: TutorResponse,
  lineReference: string,
  languageId: string,
  fileName: string
): MockTutorResponse {
  const firstQuiz = response.quiz[0];
  const choices = firstQuiz.options.map((option) => option.text);
  const correctAnswerIndex = firstQuiz.options.findIndex(
    (option) => option.id === firstQuiz.correctOptionId
  );

  return {
    concept: response.title,
    lineReference,
    explanation: response.explanation,
    codeTokens: response.keyConcepts,
    language: languageId,
    fileName,
    quiz: {
      question: firstQuiz.question,
      choices,
      correctAnswerIndex: correctAnswerIndex === -1 ? 0 : correctAnswerIndex,
      hint: GENERIC_HINT,
      explanation: firstQuiz.explanation,
    },
  };
}
