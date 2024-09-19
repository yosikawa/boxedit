import * as vscode from 'vscode';
import { FloatingBox } from './types';
import {
    computeWidth,
    flipH,
    flipV,
    getBareFloatingBox, getBoxFromSels, getSelsDiff, hideFloatingBox,
    selsToString, selToString, showFloatingBox,
} from './utils';

export const commandToRegister: (keyof (Command))[] = [
    'select',
    'cancel',
    'paste',
    'pasteDone',
    'moveUp',
    'moveRight',
    'moveDown',
    'moveLeft',
    'flipH',
    'flipV',
];
export class Command {
    private enabled: boolean;
    private box: FloatingBox;
    constructor() {
        this.enabled = false;
        this.box = getBareFloatingBox();
        vscode.workspace.onDidChangeTextDocument(event => {
            const changed = event.contentChanges.find((e) =>
                e.rangeLength > 0 || e.text.length > 0);
            if (changed) void this.cancel();
        });
        vscode.window.onDidChangeTextEditorSelection(event => {
            void this.onChangeSelection();
        });
    }
    async select() {
        const editor = vscode.window.activeTextEditor!;
        const sels = editor.selections;
        console.log(`at select: sels=${selsToString(sels)}`);
        await this.cancel();
        this.box = await getBoxFromSels(editor.document, sels);
        await showFloatingBox(editor, this.box);
        const enabled = this.box.copy.length > 0;
        await vscode.commands.executeCommand('setContext', 'boxedit.floatingMode', enabled);
        // flag is set after setContext because it emits onDidChangeTextDocument event
        this.enabled = enabled;
        console.log(`done select`);
    }
    async cancel() {
        if (!this.enabled) return;
        console.log(`at cancelFloating`);
        this.enabled = false;
        const editor = vscode.window.activeTextEditor!;
        await hideFloatingBox(editor, this.box);
        await vscode.commands.executeCommand('setContext', 'boxedit.floatingMode', false);
        editor.selections = [];
        console.log(`done cancelFloating`);
    }
    async paste() {
        if (!this.enabled) return;
        console.log(`at paste`);
        this.enabled = false;
        const editor = vscode.window.activeTextEditor!;
        await showFloatingBox(editor, this.box);
        editor.selections = this.box.sels;
        this.enabled = true;
        console.log(`done paste`);
    }
    async pasteDone() {
        if (!this.enabled) return;
        console.log(`at paste`);
        this.enabled = false;
        const editor = vscode.window.activeTextEditor!;
        await showFloatingBox(editor, this.box);
        await hideFloatingBox(editor, this.box);
        await vscode.commands.executeCommand('setContext', 'boxedit.floatingMode', false);
        editor.selections = this.box.sels;
        console.log(`done paste`);
    }
    async onChangeSelection() {
        if (!this.enabled) return;
        console.log(`at onChangeSelection`);
        const editor = vscode.window.activeTextEditor!;
        console.log(`sels1=${selsToString(editor.selections)}`);
        console.log(`sels2=${selsToString(this.box.sels)}`);
        const diff = getSelsDiff(editor.selections, this.box.sels);
        if (diff === null) {
            await this.move(0, 0);
            console.log(`done onChangeSelection: ignored`);
            return;
        } else if (diff === true) {
            console.log(`done onChangeSelection: N/A`);
            return;
        }
        console.log(`diff=${selToString(diff)}`);
        editor.selections = this.box.sels;
        const c = diff.start.character;
        const y = diff.start.line;
        const doc = editor.document;
        const line = doc.lineAt(y);
        const x = computeWidth(line.text.substring(0, c));
        this.enabled = false;
        await this.doMove(x, y);
        this.enabled = true;
        console.log(`done onChangeSelection`);
    }
    async doMove(x: number, y: number) {
        console.log(`at doMove(${x}, ${y})`);
        if (x < 0 || y < 0) return;
        const editor = vscode.window.activeTextEditor!;
        await hideFloatingBox(editor, this.box);
        this.box.x = x;
        this.box.y = y;
        await showFloatingBox(editor, this.box);
        editor.selections = this.box.sels;
        console.log(`done doMove(${x}, ${y})`);
    }
    async move(dx: number, dy: number) {
        if (!this.enabled) return;
        this.enabled = false;
        await this.doMove(this.box.x + dx, this.box.y + dy);
        this.enabled = true;
    }
    async moveUp() {
        await this.move(0, -1);
    }
    async moveRight() {
        await this.move(1, 0);
    }
    async moveDown() {
        await this.move(0, 1);
    }
    async moveLeft() {
        await this.move(-1, 0);
    }
    async flipH() {
        if (!this.enabled) return;
        this.enabled = false;
        const editor = vscode.window.activeTextEditor!;
        await hideFloatingBox(editor, this.box);
        await flipH(this.box);
        await showFloatingBox(editor, this.box);
        editor.selections = this.box.sels;
        this.enabled = true;
    }
    async flipV() {
        if (!this.enabled) return;
        this.enabled = false;
        const editor = vscode.window.activeTextEditor!;
        await hideFloatingBox(editor, this.box);
        await flipV(this.box);
        await showFloatingBox(editor, this.box);
        editor.selections = this.box.sels;
        this.enabled = true;
    }
}
