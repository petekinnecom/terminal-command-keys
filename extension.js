const vscode = require('vscode');
const path = require('path')

// BEGIN TERMINAL
//
// _activeTerminal is a reference our terminal. However, sometimes we
// dispose the terminal and sometimes the user does. The 'onDidCloseTerminal'
// callback is called in both cases. This opens us to a timing issue, because we
// could do:
//
//   _activeTerminal.dispose();  // _activeTerminal.id = 1
//   _activeTerminal = createTerminal();  // _activeTerminal.id = 2
//   onDidCloseTerminal runs and nulls out _activeTerminal with id 2  which is
//     the new terminal we just created.
//
// To avoid this issue, we track 'tckDispose' so that we know whether the
// event was triggered by the user or the extension.
let _activeTerminal = null;
vscode.window.onDidCloseTerminal((terminal) => {
    if (terminal.name === 'terminal-command-keys') {
        if (!terminal.tckDisposed) {
            disposeTerminal();
        }
    }
});
function createTerminal() {
    _activeTerminal = vscode.window.createTerminal('terminal-command-keys');
    return _activeTerminal;
}
function disposeTerminal() {
    _activeTerminal.tckDisposed = true;
    _activeTerminal.dispose();
    _activeTerminal = null;
}
function getTerminal(newTerminal) {
    if (newTerminal && _activeTerminal) {
        disposeTerminal();
    }

    if (!_activeTerminal) {
        createTerminal();
    }

    return _activeTerminal;
}
// END TERMINAL

function resolve(editor, command) {
    // Create a workspace variable for the first workspace folder opened. 
    // May be undefined if no workspace is opened.
    var workspace = undefined;
    if (vscode.workspace.workspaceFolders) {
        workspace = vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    var relativeFile = "." + editor.document.fileName.replace(workspace, "");
    var line = editor.selection.active.line + 1;

    return command
        .replace(/\${line}/g, `${line}`)
        .replace(/\${relativeFile}/g, relativeFile)
        .replace(/\${file}/g, `${editor.document.fileName}`)
        .replace(/\${workspaceRoot}/g, `${workspace}`);
}

function run(command, showTerminal, newTerminal, focus) {
    const terminal = getTerminal(newTerminal);

    if (showTerminal) {
        terminal.show(true);
    }
    vscode.commands.executeCommand('workbench.action.terminal.scrollToBottom')
    // Focus on the terminal if focus is set to true.
    if (focus){
        vscode.commands.executeCommand('workbench.action.terminal.focus')
    }
    terminal.sendText(command, true);
}

function warn(msg) {
    var log = 'terminalCommandKeys.run: ' + msg;
    console.log(log);
    vscode.window.showWarningMessage(log);
}

function maybeSave(shouldSave) {
    if (shouldSave) {
        return vscode.workspace.saveAll(false)
    } else {
        return Promise.resolve()
    }
}

function handleInput(editor, args) {
    maybeSave(args.saveAllFiles).then(() => {
        const cmd = resolve(
            editor,
            args.cmd
        )

        run(
            cmd,
            args.showTerminal,
            args.newTerminal,
            args.focus
        );
    });
}

function activate(context) {
    let disposable = vscode.commands.registerCommand('terminalCommandKeys.run', (args) => {
        const editor = vscode.window.activeTextEditor
        if (!editor) {
            warn('There must be an active editor.');
            return;
        }

        if (!args || !args.cmd) {
            warn('Keybinding must include a "args.cmd" key');
            return;
        }

        const defaults = {
            showTerminal: true,
            saveAllFiles: true,
            newTerminal: false,
            focus: false,
        }
        const realArgs = Object.assign(defaults, args)
        // If showTerminal is false, then focus should always be false, as we do not wish to focus on a terminal that should not be shown.
        if (!realArgs.showTerminal){
            realArgs.focus = false;
        }

        handleInput(editor, realArgs)
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {
    disposeTerminal();
}
exports.deactivate = deactivate;
