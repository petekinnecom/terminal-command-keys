# Terminal Command Keys

Assign terminal commands to a keybinding.

Open your keybindings.json (Command Palette => 'Preferences: Open Keyboard Shortcut File') and add an entries like these:

```
  {
      "key": "cmd+ctrl+r",
      "command": "terminalCommandKeys.run",
      "args": {
          "cmd": "echo 'hello world'"
      }
  },
  {
      "key": "cmd+shift+r",
      "command": "terminalCommandKeys.run",
      "args": {
          "cmd": "echo 'hello from file: ${file}'",
          "newTerminal": false,
          "saveAllFiles": true,
          "showTerminal": true,
          "focus": true
      }
  }
```

The `args` entry has these entries:

---
### "cmd" : required

This is the command that will be passed to the terminal when it is opened. The following substitutions are available to be used:

- ${line}
- ${relativeFile}
- ${file}
- ${workspaceRoot}

Here are some examples:

- "cmd": "rspec ${file}"
- "cmd": "rspec ${file}:${line}"

If you need to run different commands for different file types, but wish to use the same keycombo, check out [vscode's "when" clauses](https://code.visualstudio.com/docs/getstarted/keybindings#_when-clause-contexts).

---

### "newTerminal" : optional, default false

 If true, the terminal is destroyed and a fresh terminal is created for each run. You cannot scroll up to review previous commands/results.

If false, re-uses the same terminal for each command run. You can scroll up to review previous commands/results.

---

### "saveAllFiles" : optional, default true

If true, saves all files before running the command.

If false, does not save all files before running the command.

---

### "showTerminal" : options, default true

If true, ensures that the terminal is showing when running the command.

If false, does not change the visibility of the terminal when running the command.

---
### "focus" : options, default false, locked to false if "showTerminal" is false

If true, ensures that the terminal is focused when running the command.

If false, focus is not applied to the terminal when running the command.

---

## About

This extension inspired by [run-in-terminal](https://github.com/kortina/run-in-terminal) and [send-to-terminal](https://github.com/malkomalko/send-to-terminal).

The differences (at this time):

- All config lives in keybindings file (no entries in user settings)
- Configuration per command
- Option to save all files before execution
- Option to reveal the terminal before execution
- Option to use a new terminal for each execution
- Scrolls to bottom of terminal when running a command
