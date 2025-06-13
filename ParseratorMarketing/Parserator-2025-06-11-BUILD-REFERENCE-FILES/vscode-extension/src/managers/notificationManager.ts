import * as vscode from 'vscode';

export class NotificationManager {
	private shouldShowNotifications(): boolean {
		const config = vscode.workspace.getConfiguration('parserator');
		return config.get('showNotifications') as boolean;
	}

	showSuccess(message: string): void {
		if (this.shouldShowNotifications()) {
			vscode.window.showInformationMessage(message);
		}
	}

	showError(message: string): void {
		if (this.shouldShowNotifications()) {
			vscode.window.showErrorMessage(message);
		}
	}

	showWarning(message: string): void {
		if (this.shouldShowNotifications()) {
			vscode.window.showWarningMessage(message);
		}
	}

	async showActionMessage(message: string, ...actions: string[]): Promise<string | undefined> {
		if (this.shouldShowNotifications()) {
			return await vscode.window.showInformationMessage(message, ...actions);
		}
		return undefined;
	}

	async showErrorWithActions(message: string, ...actions: string[]): Promise<string | undefined> {
		if (this.shouldShowNotifications()) {
			return await vscode.window.showErrorMessage(message, ...actions);
		}
		return undefined;
	}

	async showProgress<T>(
		title: string,
		task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<T>
	): Promise<T> {
		return await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: title,
			cancellable: false
		}, task);
	}

	showStatusBarMessage(message: string, timeout?: number): vscode.Disposable {
		if (timeout !== undefined) {
			return vscode.window.setStatusBarMessage(message, timeout);
		} else {
			return vscode.window.setStatusBarMessage(message);
		}
	}

	createStatusBarItem(alignment: vscode.StatusBarAlignment = vscode.StatusBarAlignment.Right, priority?: number): vscode.StatusBarItem {
		return vscode.window.createStatusBarItem(alignment, priority);
	}
}