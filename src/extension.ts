import * as vscode from 'vscode';
import {commandToRegister, Command} from './command';

export function activate(context: vscode.ExtensionContext) {
	console.log('boxedit is now active');
	const cmd = new Command();
	for (const name of commandToRegister) {
		const disposable = vscode.commands.registerCommand('boxedit.' + name, function() {
			if (!vscode.window.activeTextEditor) return;
			(cmd[name] as () => void)?.();
		});
		context.subscriptions.push(disposable);
	}
}
export function deactivate() {}
