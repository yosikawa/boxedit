import * as vscode from 'vscode';

export class Decorator {
    private floatingBoxDecorationType: vscode.TextEditorDecorationType;
    constructor() {
        this.floatingBoxDecorationType =
            vscode.window.createTextEditorDecorationType({
                borderWidth: '1px',
                borderStyle: 'solid',
                overviewRulerColor: { id: 'boxedit.floatingBoxBackgroundColor' },
                overviewRulerLane: vscode.OverviewRulerLane.Left,
                borderColor: { id: 'boxedit.floatingBoxBorderColor' },
                backgroundColor: { id: 'boxedit.floatingBoxBackgroundColor' }
            });
    }
    showFloatingBox(editor: vscode.TextEditor, ranges: vscode.Range[]) {
        editor.setDecorations(this.floatingBoxDecorationType, ranges);
    }
    hideFloatingBox(editor: vscode.TextEditor) {
        editor.setDecorations(this.floatingBoxDecorationType, []);
    }
}
