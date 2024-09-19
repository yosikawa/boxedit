import * as vscode from 'vscode';
import {commandToRegister, Command} from './command';

export function activate(context: vscode.ExtensionContext) {
	console.log('boxedit is now active');
	for (const name of commandToRegister) {
		const disposable = vscode.commands.registerCommand('boxedit.' + name, function() {
			(Command.getInstance()?.[name] as () => void)?.();
		});
		context.subscriptions.push(disposable);
	}
}
export function deactivate() {}
