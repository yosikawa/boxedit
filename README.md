# boxedit

This extension can be used for editing ASCII art or text based field map of RPG-like game.

## Usage example

1. Open text file by default text editor.
1. Click upper-left corner. Then, hold <kbd>Alt+Shift</kbd> and click bottom-right corner. (This is the standard vscode feature to select box-shaped text)
1. Press <kbd>Alt+C</kbd> to make boxedit select the text. (background color become purple)
1. Hold <kbd>Alt</kbd> and click any where to move the selected text.
1. Or press <kbd>Alt+Up</kbd>, <kbd>Alt+Down</kbd>, <kbd>Alt+Left</kbd>, <kbd>Alt+Right</kbd> to move it.
1. Press <kbd>alt+Enter</kbd> to paste the selected text.

![boxedit-mapedit](https://github.com/user-attachments/assets/02ed82b6-8f3e-437a-aaf7-a9080e82a393)


## Features

If you do the same by normal vscode, you may feel difficult to keep the box shaped structure of text because vscode always insert the pasted text.

- Suppose as if the purple text is a floating sheet. You can move it around with out changing the underlining text.
- You can flip the purple text horizontally or vertically.
- CJK (Chinese/Japanese/Korean) character is treated appropriately so that each of these character occupies 2 ascii characters width.

# License

Copyright (c) Altalk Ltd. All rights reserved.

Licensed under the MIT License.

## Release Notes

### 0.2.0

Screen shot added.

### 0.1.0

Alpha version.
