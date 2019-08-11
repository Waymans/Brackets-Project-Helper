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
		  ModalDialog = require("text!modal/modal.html");
	
	const extension = 'waymans-project-helper',
		  charset = 'utf8',
		  tempFolder = '/templates/',
		  slash = '/',
		  keyBinds = [
			  { "key": 'Ctrl-Shift-T', "platform": 'win' }, 
			  { "key": 'Cmd-Shift-T', "platform": 'mac' }
		  ];
	
	let projectRoot,
		templatePath,
		templateList;
	
	function getProjectRoot() {
		projectRoot = ProjectManager.getProjectRoot()._path;
	}
	
	function getTemplateList() {
		brackets.fs.readdir(templatePath + tempFolder, function(err, data){
			templateList = data;
		});
	}
	
	function getPathForTemplates() {
		let installedExts = new ExtensionManagerViewModel.InstalledViewModel();
		installedExts.initialize().then(function() {
			templatePath = installedExts.extensions[extension].installInfo.path;
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
	
	function folderMaker(folder) {
		let folders = folder.split('/'),
			last = folders.splice(folders.length - 1, 1)[0];
		folders = folders.join('/');
		ProjectManager.createNewItem(projectRoot + folders, last, true, true);
	}
	
	function fileMaker(folder, file, template) {
		ProjectManager.createNewItem(projectRoot + folder, file, true, false);
		brackets.fs.readdir(
			templatePath + tempFolder + template, function(err, data){
			brackets.fs.readFile(templatePath + tempFolder + template + slash + data[0], charset, function(err, text){
				setTimeout(() => templateHandler(text), 50);
			});
		});
	}
	
	function decisionMaker() {
		getProjectRoot();
		
		let decision =
			Dialogs.showModalDialogUsingTemplate(mustache.render(ModalDialog, {templates: templateList})),
			modal = decision.getElement(),
			file = $('#file', modal),
			folder = $('#folder', modal),
			template = $('#template', modal);
		
		decision.done(function(choice){
			if (choice === 'ok') {
				file = file.val();
				folder = folder.val();
				template = template.val();
				
				if (!file) {
					folderMaker(folder);
				} else {
					if (folder) {
						folderMaker(folder);	
					}
					fileMaker(folder, file, template);
				}
			}
		});
	}
	
	// menu, keybinds, toolbar icon, and css styles
    const menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
		
	CommandManager.register(
		'Project Helper', 'waymans.helper', () => decisionMaker()
	);
	menu.addMenuItem('waymans.helper', keyBinds);
	
	ExtensionUtils.loadStyleSheet(module, 'styles/styles.css');
	
	$(document.createElement('a'))
		.attr('id', 'helper-icon')
		.attr('href', '#')
		.attr('title', 'Project Helper')
		.on('click', function () {
			decisionMaker();
		})
		.appendTo($('#main-toolbar .buttons'));

});
