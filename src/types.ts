import * as vscode from 'vscode';

export type FloatingText = {
    // relative position
    dx: number,
    dy: number,
    // display width of text
    w: number,
    text: string,
};
export type RangedText = {
    range: vscode.Range,
    text: string,
};
export type FloatingBox = {
    // bounding box
    x: number,
    y: number,
    w: number,
    h: number,
    copy: FloatingText[],
    diff: RangedText[],
    sels: vscode.Selection[],
};
