const vscode = require('vscode');
const path = require('path')

// BEGIN TERMINAL
//
// _terminals is a mapper of our terminal. However, sometimes we
// dispose the terminal and sometimes the user does. The 'onDidCloseTerminal'
// callback is called in both cases. This opens us to a timing issue, because we
// could do:
//
//   _terminals[name].dispose();  // _terminals[name].id = 1
//   _terminals[name] = createTerminal();  // _terminals[name].id = 2
//   onDidCloseTerminal runs and nulls out _terminals[name] with id 2  which is
//     the new terminal we just created.
//
// To avoid this issue, we track 'tckDispose' so that we know whether the
// event was triggered by the user or the extension.
let _terminals = {};
vscode.window.onDidCloseTerminal((terminal) => {
    if (_terminals[terminal.name]) {
        if (!terminal.tckDisposed) {
            disposeTerminal(terminal.name);
        }
    }
});
function createTerminal(terminalName) {
    _terminals[terminalName] = vscode.window.createTerminal(terminalName);
    return _terminals[terminalName];
}
function disposeTerminal(terminalName) {
    if (!_terminals[terminalName]) {
        return;
    }
    _terminals[terminalName].tckDisposed = true;
    _terminals[terminalName].dispose();
    delete _terminals[terminalName];
}
function getTerminal(newTerminal, terminalName) {
    let terminal = _terminals[terminalName];
    if (newTerminal && terminal) {
        disposeTerminal(terminalName);
    }

    if (!terminal) {
        terminal = createTerminal(terminalName);
    }

    return terminal;
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

function run(command, showTerminal, newTerminal, focus, terminalName) {
    const terminal = getTerminal(newTerminal, terminalName);

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
            args.focus,
            args.terminalName
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
            terminalName: 'terminal-command-keys',
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
