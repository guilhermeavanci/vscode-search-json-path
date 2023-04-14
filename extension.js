const vscode = require("vscode");
const pkg = require("./package.json");

function sanitizePrefixAndSuffix(value) {
  if (typeof value === "string") {
    return [[value, value]];
  }

  if (Array.isArray(value)) {
    return value.map((v) => {
      if (typeof v === "string" || (Array.isArray(v) && v.length === 1)) {
        return [v, v];
      }
      return v;
    });
  }
}
const prefixAndSuffix = sanitizePrefixAndSuffix(
  vscode.workspace
    .getConfiguration(pkg.name)
    .get("prefixAndSuffix")
);

const pattern = getEspacedPrefixAndSuffix()
  .map((v) => `(?:${v[0]}.*?${v[1]})`)
  .join("|");
const regex = new RegExp(pattern, "g");

let inputBox, quickPick;

function search(path) {
  let pathArray = path.split(".");
  vscode.workspace.findFiles("**/*.json", "**/node_modules/").then((files) => {
    Promise.all(files.map((file) => searchPathInJson(pathArray, file))).then(
      (filesFound) =>
        showQuickPick(
          path,
          filesFound.filter((fileFound) => fileFound)
        )
    );
  });
}

function showQuickPick(path, filesFound) {
  const lastKey = path.split(".").slice(-1)[0];
  quickPick = vscode.window.createQuickPick();
  quickPick.canSelectMany = false;
  quickPick.title = "Insert the desired JSON path";
  if (filesFound) {
    quickPick.canSelectMany = filesFound.length > 1;
    quickPick.title = `${filesFound.length} file(s) found containing the path: ${path}`;
    quickPick.items = filesFound
      .filter((fileFound) => fileFound)
      .map((fileFound) => ({
        label: fileFound.json.path.split("/").slice(-1)[0],
        description: fileFound.json.path,
        file: fileFound.json,
      }));
  }
  quickPick.buttons = [
    {
      iconPath: new vscode.ThemeIcon("arrow-left"),
      tooltip: "Back to insert a new path",
    },
  ];
  quickPick.onDidAccept(() => {
    quickPick.selectedItems.forEach((item) => {
      const text = filesFound
        .map((f) => {
          if (f.json.path === item.file.path) {
            return f.jsonString;
          }
          return;
        })
        .filter((f) => f)[0];

      const changedKeys = [];

      const newText = text
        .split("\n")
        .map((t, line) => {
          const matches = [...t.matchAll(`"${lastKey}"`)];
          if (matches.length) {
            let newLine = t;
            matches.forEach((match) => {
              const newChangedKey = `${lastKey}_${pkg.name}_${line}_${match.index}`;
              changedKeys.push(newChangedKey);
              newLine = newLine.replace(`"${lastKey}"`, `"${newChangedKey}"`);
            });
            return newLine;
          }
          return t;
        })
        .join("\n");

      const newJSON = JSON.parse(newText);

      let line, column;
      changedKeys.forEach((k) => {
        const keyArray = path.split(".");
        const pathWithoutLastKey =
          keyArray.length > 1 ? `${keyArray.slice(0, -1).join(".")}.` : "";
        if (deepFind(`${pathWithoutLastKey}${k}`, newJSON)) {
          [line, column] = k
            .replace(`${lastKey}_${pkg.name}_`, "")
            .split("_")
            .map((value) => Number(value));
        }
      });

      vscode.window.showTextDocument(item.file, {
        preview: false,
        selection: new vscode.Range(
          new vscode.Position(line, column + 1),
          new vscode.Position(line, column + 1 + lastKey.length)
        ),
      });
    });
  });
  quickPick.onDidTriggerButton(() => {
    quickPick.hide();
    inputBox.show();
  });
  quickPick.show();
}

function searchPathInJson(pathArray, json) {
  return vscode.workspace.fs.readFile(json).then((content) => {
    const jsonString = Buffer.from(content).toString();
    try {
      const jsonObject = JSON.parse(jsonString);
      return deepFind(pathArray, jsonObject, true) && { json, jsonString };
    } catch (e) {
      console.error(`Parse error in ${json.path}`, e);
      return;
    }
  });
}

function deepFind(path, obj, getKey) {
  let pathArray = typeof path === "string" ? path.split(".") : path,
    current = obj,
    next;
  pathArray.forEach((key, i) => {
    if (current) {
      next = current[key];
    }
    if (next == undefined || next == null) {
      current = undefined;
      return;
    } else if (pathArray.length - 1 === i) {
      if (!getKey) {
        current = next;
        return;
      }
      return;
    } else {
      current = next;
    }
  });
  return current;
}

function removePrefixAndSuffix(value) {
  const currentPrefixAndSuffix = prefixAndSuffix.find(
    (tuple) => value.startsWith(tuple[0]) && value.endsWith(tuple[1])
  );
  if (currentPrefixAndSuffix) {
    return value.slice(
      currentPrefixAndSuffix[0].length,
      value.length - currentPrefixAndSuffix[1].length
    );
  }
  return value;
}

function getValue() {
  if (vscode.window.activeTextEditor) {
    const value = vscode.window.activeTextEditor.document.getText(
      vscode.window.activeTextEditor.selection
    );
    if (!value) {
      return;
    }
    return removePrefixAndSuffix(value);
  }
  return;
}

function showInput(value) {
  inputBox = vscode.window.createInputBox();
  inputBox.value = (typeof value === "string" && value) || getValue() || "";
  inputBox.title = "Insert the desired JSON path";
  inputBox.onDidAccept(() => search(inputBox.value));
  inputBox.show();
}

function activate({ subscriptions }) {
  if (
    !vscode.workspace
      .getConfiguration(pkg.name)
      .get("enable")
  ) {
    return;
  }

  let search = vscode.commands.registerCommand(`${pkg.name}.search`, showInput);

  subscriptions.push(search);

  let sel = [
    { scheme: "file", language: "javascript" },
    { scheme: "file", language: "jsx" },
    { scheme: "file", language: "typescript" },
    { scheme: "file", language: "typescriptreact" },
  ];
  subscriptions.push(
    vscode.languages.registerCodeLensProvider(sel, new CodeLensProvider())
  );
}

function escapeRegex(value) {
  return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function getEspacedPrefixAndSuffix() {
  return prefixAndSuffix.map((tuple) =>
    tuple.map((string) => escapeRegex(string))
  );
}

class CodeLensProvider {
  constructor() {
    this.codeLenses = [];
  }

  provideCodeLenses(doc) {
    if (
      vscode.workspace
        .getConfiguration(pkg.name)
        .get("codeLenses.enable")
    ) {
      this.codeLenses = [];
      const text = doc.getText();
      let matches;
      while ((matches = regex.exec(text)) !== null) {
        const line = doc.lineAt(doc.positionAt(matches.index).line);
        const indexOf = line.text.indexOf(matches[0]);
        const position = new vscode.Position(line.lineNumber, indexOf);
        const range = doc.getWordRangeAtPosition(position, new RegExp(regex));
        if (range) {
          this.codeLenses.push({
            match: matches[0],
            path: removePrefixAndSuffix(matches[0]),
            codeLens: new vscode.CodeLens(range),
          });
        }
      }
      return this.codeLenses.map((c) => c.codeLens);
    }
    return [];
  }

  resolveCodeLens(lens) {
    if (
      vscode.workspace
        .getConfiguration(pkg.name)
        .get("codeLenses.enable")
    ) {
      const selectedLens = this.codeLenses.find(
        (c) => c.codeLens.range === lens.range
      );

      lens.command = {
        title: `Search JSON with path: ${selectedLens.path}`,
        command: `${pkg.name}.search`,
        arguments: [selectedLens.path],
      };
      return lens;
    }
    return null;
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
