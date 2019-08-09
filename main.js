// todo: input validation, SOLID

define(function(require, exports, module) {
    "use strict";

    const ProjectManager = brackets.getModule("project/ProjectManager"),
		  Dialogs = brackets.getModule("widgets/Dialogs"),
		  CommandManager = brackets.getModule("command/CommandManager"),
		  EditorManager = brackets.getModule("editor/EditorManager"),
		  Menus = brackets.getModule("command/Menus"),
		  mustache = brackets.getModule("thirdparty/mustache/mustache"),
		  ExtensionManagerViewModel = brackets.getModule("extensibility/ExtensionManagerViewModel"),
		  ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
		  NewProjectDialog = require("text!dialog/dialog.html"),
		  NewFileDialog = require("text!dialog/file.html"),
		  NewFolderDialog = require("text!dialog/folder.html");
	
	const keyBinds = [
		{ "key": 'Ctrl-Shift-T', "platform": 'win' }, 
		{ "key": 'Cmd-Shift-T', "platform": 'mac' }
	];
	
	let templatePath;
	let templateList;
	
	function getTemplateList() {
		brackets.fs.readdir(templatePath + '/templates/', function(err, data){
			templateList = data;
		});
	}
	
	function getPathForTemplates() {
		let installedExts = new ExtensionManagerViewModel.InstalledViewModel();
		installedExts.initialize().then(function(){
			templatePath = installedExts.extensions['waymans-project-helper'].installInfo.path;
			getTemplateList();
		});
	}
	setTimeout(getPathForTemplates, 1000);

    function templateHandler(template) {
		let editor = EditorManager.getActiveEditor();
        if (editor) {
            let insertionPos = editor.getCursorPos();
            editor.document.replaceRange(template, insertionPos);
        }
    }
	
	function choseFile(projectRoot) {
		let decision = Dialogs.showModalDialogUsingTemplate(mustache.render(NewFileDialog, {names: templateList})),
			modal = decision.getElement(),
			dirName = $('#name', modal),
			pathName = $('#path', modal),
			template = $('#template', modal);
		
		decision.done(function(choice){
			dirName = dirName.val();
			pathName = pathName.val();
			template = template.val();
			
			brackets.fs.readdir(
				projectRoot + '/templates/' + template, function(err, data){
				brackets.fs.readFile(projectRoot + '/templates/' + template + '/' + data[0], 'utf8', function(err, text){
					let doc = ProjectManager.createNewItem(projectRoot + pathName, dirName, true, false);
					setTimeout(() => templateHandler(text), 50);
				});
			});
		});
	}
	
	function choseFolder(projectRoot) {
		let decision = Dialogs.showModalDialogUsingTemplate(NewFolderDialog),
			modal = decision.getElement(),
			dirName = $('#name', modal),
			pathName = $('#path', modal);
		
		decision.done(function(choice){
			if (choice === 'ok') {
				ProjectManager.createNewItem(projectRoot + pathName.val(), dirName.val(), true, true);
			}
		});
	}
	
	function createFileOrFolder() {
		let projectRoot = ProjectManager.getProjectRoot()._path,
			decision = Dialogs.showModalDialogUsingTemplate(NewProjectDialog);
		decision.done(function(choice){
			if (choice === 'file') {
				choseFile(projectRoot);
			} else if (choice === 'folder') {
				choseFolder(projectRoot);
			}
		});
	}
	
	// menu, keybinds, toolbar icon, and css styles
    const menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
		
	CommandManager.register(
		'Project Helper', 'waymans.helper', () => createFileOrFolder()
	);
	menu.addMenuItem('waymans.helper', keyBinds);
	
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

