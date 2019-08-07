define(function(require, exports, module) {
    "use strict";

    const ProjectManager = brackets.getModule("project/ProjectManager"),
		  Dialogs = brackets.getModule("widgets/Dialogs"),
		  CommandManager = brackets.getModule("command/CommandManager"),
		  EditorManager = brackets.getModule("editor/EditorManager"),
		  Menus = brackets.getModule("command/Menus"),
		  ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
		  NewProjectDialog = require("text!dialog/dialog.html"),
		  NewFileDialog = require("text!dialog/file.html"),
		  NewFolderDialog = require("text!dialog/folder.html"),
		  HTMLTemplate = require("text!templates/stock.html"),
		  CSSTemplate = require("text!templates/stock.css"),
		  JSTemplate = require("text!templates/stock.js"),
		  JSONTemplate = require("text!templates/stock.json"),
		  MDTemplate = require("text!templates/stock.md");

    function templateHandler(template) {
        //let editor = EditorManager.getFocusedEditor();
		let editor = EditorManager.getActiveEditor();
        if (editor) {
            let insertionPos = editor.getCursorPos();
            editor.document.replaceRange(template, insertionPos);
        }
    }
	
	function choseFile(path) {
		let decision = Dialogs.showModalDialogUsingTemplate(NewFileDialog),
			modal = decision.getElement(),
			dirName = $('#name', modal),
			pathName = $('#path', modal),
			template = $('#template', modal);
		
		decision.done(function(choice){
			let name = dirName.val(),
				pathEnd = pathName.val(),
				temp = template.val();
			
			if (choice === 'ok') {
				let doc = ProjectManager.createNewItem(path + pathEnd, name, true, false);
				// using timeouts because the modal needs to close beforehand
				switch(temp){
					case 'index.html':
						setTimeout(() => templateHandler(HTMLTemplate), 50);
						break;
					case 'styles.css':
						setTimeout(() => templateHandler(CSSTemplate), 50);
						break;
					case 'server.js':
						setTimeout(() => templateHandler(JSTemplate), 50);
						break;
					case 'package.json':
						setTimeout(() => templateHandler(JSONTemplate), 50);
						break;
					case 'README.md':
						setTimeout(() => templateHandler(MDTemplate), 50);
						break;
					default:
						setTimeout(() => templateHandler('Hello, World.'), 50);
						break;
				}
				return new $.Deferred().resolve(doc).promise();
			}
		});
	}
	
	function choseFolder(path) {
		let decision = Dialogs.showModalDialogUsingTemplate(NewFolderDialog),
			modal = decision.getElement(),
			dirName = $('#name', modal),
			pathName = $('#path', modal);
		
		decision.done(function(choice){
			if (choice === 'ok') {
				ProjectManager.createNewItem(path + pathName.val(), dirName.val(), true, true);
			}
		});
	}
	
	function createFileOrFolder() {
		let path = ProjectManager.getProjectRoot()._path,
			decision = Dialogs.showModalDialogUsingTemplate(NewProjectDialog);
		decision.done(function(choice){
			if (choice === 'file') {
				choseFile(path);
			} else {
				choseFolder(path);
			}
		});
	}
	
	// menu, keybinds, toolbar icon, and css styles
    const menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
		
	CommandManager.register('Project Helper', 'waymans.helper', 
							   () => createFileOrFolder());
	menu.addMenuItem('waymans.helper', 
					 [{ "key": 'Ctrl-Shift-T' }, { "key": 'Ctrl-Shift-T' }]);
	
	ExtensionUtils.loadStyleSheet(module, 'styles/styles.css');
	
	$(document.createElement('a'))
		.attr('id', 'helper-icon')
		.attr('href', '#')
		.attr('title', 'Project Helper')
		.on('click', function () {
			createFileOrFolder();
		})
		.appendTo($('#main-toolbar .buttons'));

});

