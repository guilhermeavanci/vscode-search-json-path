# search-json-path

Extension to find every JSON file and the respective key containing the specified path.

![Example animated image](https://raw.githubusercontent.com/guilhermeavanci/vscode-search-json-path/main/images/example.gif)

## Motivation

The creation of this extension was motivated by the usage of the [i18next](https://www.i18next.com/) library. While using i18next I felt the need to quickly access the internationalization JSON files through the path already defined inside the code. Well, that's what this extension resolve.

This extension is inspired by [copy-json-path](https://marketplace.visualstudio.com/items?itemName=nidu.copy-json-path) extension, which helps you out copying the JSON key full path. Also pretty useful while using i18next.

## Path format

The extension currently supports simple paths. See some example below:

`this.is.a.path`
```JSON
{
	"this": {
		"is": {
			"a": {
				"path": "yes, it is"
			}
		}
	}
}
```

`take.the.second.1`
```JSON
{
	"take": {
		"the": {
			"second": [
				"not here",
				"here it is"
			]
		}
	}
}
```

## Features and Usage

### Search Interface

An input interface is invoked by the extension. Type the desired path and press `Enter`. All `.json` files inside your workspace containing the path specified must be showed in a list above the input.

![Search Interface animated image](https://raw.githubusercontent.com/guilhermeavanci/vscode-search-json-path/main/images/search-interface.gif)

### Search Json Path command

`Ctrl+P` and type `Search Json Path` to open the search interface. Type the desired path and press `Enter`. The [**Search Interface**](#search-interface) must appear waiting for the path insertion.

![Search Interface image](https://raw.githubusercontent.com/guilhermeavanci/vscode-search-json-path/main/images/command.png)

### Right-click and use Search JSON Path

Right-click in the document give you the option `Search Json Path`. It does exactly the same thing as [**Search Json Path command**](#search-json-path-command) with the exception that if some text is already selected in the document it automatically fills the [**Search Interface**](#search-interface) input.

![Right-click and use Search JSON Path image](https://raw.githubusercontent.com/guilhermeavanci/vscode-search-json-path/main/images/menu.png)

### Code Lenses

The [code lens](https://code.visualstudio.com/api/language-extensions/programmatic-language-features#codelens-show-actionable-context-information-within-source-code) feature is shown inside the document directly above the line where the extension identifies a path. It's another quick way to open the [**Search Interface**](#search-interface) automatically passing the path identified.

![Code Lenses image](https://raw.githubusercontent.com/guilhermeavanci/vscode-search-json-path/main/images/code-lenses.png)

Note that the code lens feature is disabled by default to prevent undesired IDE noises because its default way to find out the paths is considering all strings a path. If you want to use this feature, the suggestion is to carefully set the `prefixAndSuffix` extension in a way to guarantee the extension can identify exactly what you want.

> See more in the [**Extension Settings**](#extension-settings) section.

The [**Code Lenses**](#code-lenses) supports the following documment languages:

```
javascript
jsx
typescript
typescriptreact
```

## Extension Settings

The extension default settings are the following:

```JSON
{
	"search-json-path": {
		"enable": true,
		"prefixAndSuffix": ["'", "\""],
		"codeLenses": {
			"enable": false
		}
	}
}
```

| Syntax | Type | Default Value | Description |
| ----------- | ----------- | ----------- | ----------- |
| enable | `boolean` | `true` | Define if the extension is currently active |
| prefixAndSuffix | `String \| Array<String> \| Array<Array<String>>` | `["'", "\""]` | Can have many formats dependending on your needs (See more at [prefixAndSuffix formats](#prefixandsuffix-formats) section). The `String` ocurrencies can be a `Regex`. |`
| codeLenses.enable | `boolean` | `false` | Define if the code lens feature is active |

### prefixAndSuffix formats

There are many ways to configure the `prefixAndSuffix` option depending on your needs. The recommendation is to look below and prioritize the simplest way which effectively finds the match you want.

#### *Same* prefix and suffix
```javascript
"'"
```
> `'`this.is.a.path`'`

#### *Multiple* prefix and suffix
```javascript
["'", "\""]
```
> `'`this.is.a.path`'`
> 
> `"`this.is.a.path`"`

#### *Different* prefix and suffix
```javascript
[
	["prefix-", "-suffix"]
]
```
> `prefix-`this.is.a.path`-suffix`

#### *Multiple and Different* prefix and suffix
```javascript
[
	["prefix-", "-suffix"],
	["t('", "')"]
]
```
> `prefix-`this.is.a.path`-suffix`
> 
> `t('`this.is.a.path`')`

## Release Notes

### 0.0.1

The initial release.

### 0.0.2

Fixing images.


### 0.0.3

Improving project description.
