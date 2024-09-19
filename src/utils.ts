import * as vscode from 'vscode';
import { getEAW } from 'meaw';
import { FloatingBox, FloatingText, RangedText } from './types';
import { Decorator } from './decorator';

const decorator = new Decorator();
export function assert(value: boolean, msg: string) {
    if (!value) throw new Error(`assertion error: ${msg}`);
}
export function stringDump(msg: string, str: string) {
    const m: string[] = [];
    for (const c of str) {
        m.push(`[${c}:${c.charCodeAt(0)}]`);
    }
    console.log(`${msg}: "${m.join('')}"`);
}
export function padding(len: number, str: string) {
    return ''.padEnd(len, str);
}
export function evToString(ev: vscode.TextDocumentContentChangeEvent) {
    return `(len:${ev.rangeLength}, text:${ev.text})`;
}
export function posToString(pos: vscode.Position) {
    return `(${pos.line}:${pos.character})`;
}
export function selToString(sel: vscode.Selection) {
    return `${posToString(sel.anchor)}-${posToString(sel.active)}`;
}
export function selsToString(sels: readonly vscode.Selection[]) {
    const part: string[] = [];
    for (let i = 0; i < sels.length; ++i) {
        const sel = sels[i];
        part.push(`[${i}/${sels.length}]: ${selToString(sel)}`);
    }
    return '[' + part.join(', ') + ']';
}
export function computeWidth(str: string) {
    let w = 0;
    for (const c of str.split('')) {
        const eaw = getEAW(c);
        w += (eaw === 'F' || eaw === 'W') ? 2 : 1;
    }
    return w;
}
export function getWidthArray(str: string) {
    const widthAry: number[] = [0];
    let w = 0;
    for (const c of str.split('')) {
        const eaw = getEAW(c);
        w += (eaw === 'F' || eaw === 'W') ? 2 : 1;
        widthAry.push(w);
    }
    return widthAry;
}
export function getOffsetForWidth(widthAry: number[], w: number) {
    for (let i = 0; i < widthAry.length; ++i) {
        if (widthAry[i] >= w) {
            return i;
        }
    }
    return -1;
}
export function isSameSelection(sels1: vscode.Selection, sels2: vscode.Selection) {
    return (sels1.start.line === sels2.start.line &&
        sels1.start.character === sels2.start.character &&
        sels1.end.line === sels2.end.line &&
        sels1.end.character === sels2.end.character);
}
/**
 * get different Selection element
 * @param {vscode.Selection[]} sels1
 * @param {vscode.Selection[]} sels2
 * @return {vscode.Selection|null|true}
 *      different Selection element if sels1 have 1 more than sels2
 *      null if no match
 *      true if exact match
 */
export function getSelsDiff(sels1: readonly vscode.Selection[], sels2: vscode.Selection[]) {
    if (sels1.length < sels2.length || sels1.length > sels2.length + 1) {
        return null;
    }
    let i = 0;
    for (; i < sels2.length; ++i) {
        if (!isSameSelection(sels1[i], sels2[i])) return null;
    }
    return (i < sels1.length) ? sels1[i] : true;
}
export function getBareFloatingBox(): FloatingBox {
    return { x: 0, y: 0, w: 0, h: 0, copy: [], sels: [], diff: [] };
}
export function getBoxFromSels(doc: vscode.TextDocument, sels: readonly vscode.Selection[]) {
    // arrange sels to the seq. of line, left, right, text
    const lines: number[] = [];
    const lefts: number[] = [];
    const rights: number[] = [];
    const texts: string[] = [];
    for (const sel of sels) {
        const y1 = sel.start.line;
        const y2 = sel.end.line;
        for (let y = y1; y <= y2; ++y) {
            const line = doc.lineAt(y);
            const widthAry = getWidthArray(line.text);
            const s = (y === y1) ? sel.start.character : 0;
            const e = (y === y2) ? sel.end.character : line.range.end.character;
            if (e <= s) continue;
            lines.push(y);
            lefts.push(widthAry[s]);
            rights.push(widthAry[e]);
            texts.push(line.text.substring(s, e));
        }
    }
    if (lines.length === 0) return getBareFloatingBox();
    // get bounding box
    const x = Math.min(...lefts);
    const y = Math.min(...lines);
    const w = Math.max(...rights) - x;
    const h = Math.max(...lines) - y + 1;
    // get copy
    const copy: FloatingText[] = [];
    for (let i = 0; i < lines.length; ++i) {
        const dx = lefts[i] - x;
        const dy = lines[i] - y;
        const w = rights[i] - lefts[i];
        const text = texts[i];
        copy.push({ dx, dy, w, text });
    }
    return { x, y, w, h, copy, sels: [], diff: [] };
}
export async function showFloatingBox(editor: vscode.TextEditor, box: FloatingBox) {
    const doc = editor.document;
    const eol = (doc.eol === vscode.EndOfLine.CRLF) ? '\r\n' : '\n';
    const diff: RangedText[] = [];
    const sels: vscode.Selection[] = [];
    for (const ftext of box.copy) {
        const x = box.x + ftext.dx;
        const y = box.y + ftext.dy;
        if (y >= doc.lineCount) {
            const y0 = doc.lineCount;
            const size = doc.getText().length;
            const p = doc.positionAt(size);
            const line = padding(x, ' ') + ftext.text;
            const s = padding(y - y0 + 1, eol) + line;
            await editor.edit((e) => e.insert(p, s));
            const p1 = doc.positionAt(size + s.length)
            const range = new vscode.Range(p, p1);
            const text = '';
            diff.push({ range, text });
            sels.push(new vscode.Selection(y, x, y, line.length));
            continue;
        }
        const line = doc.lineAt(y);
        const len = line.range.end.character;
        const widthAry = getWidthArray(line.text);
        const max = widthAry[len];
        if (max < x) {
            const p = line.range.end;
            const s = padding(x - max, ' ') + ftext.text;
            await editor.edit((e) => e.insert(p, s));
            const c = p.character;
            const range = new vscode.Range(y, c, y, c + s.length);
            const text = '';
            diff.push({ range, text });
            const c0 = c + (x - max);
            sels.push(new vscode.Selection(y, c0, y, c0 + ftext.text.length));
        } else if (max < x + ftext.w) {
            const c0 = getOffsetForWidth(widthAry, x);
            const x0 = widthAry[c0];
            const padLeft = (x0 !== x);
            const c = padLeft ? c0 - 1 : c0;
            const r = new vscode.Range(y, c, y, len);
            const s = padLeft ? ' ' + ftext.text : ftext.text;
            await editor.edit((e) => e.replace(r, s));
            const range = new vscode.Range(y, c, y, c + s.length);
            const text = line.text.substring(c, len);
            diff.push({ range, text });
            sels.push(new vscode.Selection(y, c0, y, c0 + ftext.text.length));
        } else {
            const c0 = getOffsetForWidth(widthAry, x);
            const x0 = widthAry[c0];
            const padLeft = (x0 !== x);
            const c = padLeft ? c0 - 1 : c0;
            const c1 = getOffsetForWidth(widthAry, x + ftext.w);
            const x1 = widthAry[c1];
            const padRight = (x1 !== x + ftext.w);
            const r = new vscode.Range(y, c, y, c1);
            const s = (padLeft ? ' ' : '') + ftext.text + (padRight ? ' ' : '');
            await editor.edit((e) => e.replace(r, s));
            const range = new vscode.Range(y, c, y, c + s.length);
            const text = line.text.substring(c, c1);
            diff.push({ range, text });
            sels.push(new vscode.Selection(y, c0, y, c0 + ftext.text.length));
        }
    }
    box.diff = diff;
    box.sels = sels;
    decorator.showFloatingBox(editor, sels);
}
export async function hideFloatingBox(editor: vscode.TextEditor, box: FloatingBox) {
    decorator.hideFloatingBox(editor);
    for (let i = box.diff.length - 1; i >= 0; --i) {
        const rt = box.diff[i];
        await editor.edit((e) => e.replace(rt.range, rt.text));
    }
}
export async function flipH(box: FloatingBox) {
    const copy: FloatingText[] = [];
    for (const ftext of box.copy) {
        const dx = box.w - ftext.dx - ftext.w;
        const text = ftext.text.split('').reverse().join('');
        copy.push({dx, dy: ftext.dy, w: ftext.w, text});
    }
    box.copy = copy;
}

export async function flipV(box: FloatingBox) {
    const copy: FloatingText[] = [];
    for (let i=box.copy.length-1; i>=0; --i) {
        const ftext = box.copy[i];
        const dy = box.h - ftext.dy - 1;
        copy.push({dx: ftext.dx, dy, w: ftext.w, text: ftext.text});
    }
    box.copy = copy;
}
