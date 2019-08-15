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
          FileViewController = brackets.getModule('project/FileViewController'),
          ModalDialog = require("text!modal/modal.html");
	
    const EXTENSION_NAME = 'waymans-folder-file-maker',
          CHARSET = 'utf8',
          TEMPLATE_FOLDER = '/templates/',
          BACKSLASH = '/',
          KEYBINDS = [
              { "key": 'Ctrl-Shift-T', "platform": 'win' },
              { "key": 'Cmd-Shift-T', "platform": 'mac' }
          ];
	
    let projectRoot,
        templatePath,
        templateList;
    
    // gets user extensions folder for templates after reload or install
    setTimeout(function(){
        let installedExts = new ExtensionManagerViewModel.InstalledViewModel();
        installedExts.initialize().then(function() {
            templatePath = installedExts.extensions[EXTENSION_NAME].installInfo.path;
            getTemplateList();
        });
    }, 1000);
	
    function getProjectRoot() {
        projectRoot = ProjectManager.getProjectRoot()._path;
    }
	
    function getTemplateList() {
        brackets.fs.readdir(templatePath + TEMPLATE_FOLDER, function(err, data){
            templateList = data;
        });
    }

    function templateHandler(template, path) {
        let focused = FileViewController.openFileAndAddToWorkingSet(projectRoot + path);
        focused.done(function(){
            let editor = EditorManager.getActiveEditor();
            if (editor) {
                let insertionPos = editor.getCursorPos();
                editor.document.replaceRange(template, insertionPos);
            }
        });
    }
    
    function splitFolders(folder) {
        let folders = folder.split('/'),
            last = folders.splice(folders.length - 1, 1)[0];
        folders = folders.join('/');
        return {start: folders, end: last};
    }
    
    function fileMaker(folder, file) {
        ProjectManager.createNewItem(projectRoot + folder, file, true, false);
    }
	
    function folderMaker(folder) {
        let path = splitFolders(folder);
        ProjectManager.createNewItem(projectRoot + path.start, path.end, true, true);
    }
	
    function getTemplateFolder(template, path) {
        brackets.fs.readdir(
            templatePath + TEMPLATE_FOLDER + template, function(err, file){
                getTemplate(template, file[0], path);
            });
    }
    
    function getTemplate(template, file, path) {
        brackets.fs.readFile(templatePath + TEMPLATE_FOLDER + template + BACKSLASH + file, CHARSET, function(err, text){
            templateHandler(text, path);
        });
    }
    
    // using conditionals for now
    function conditionals(file, folder, template) {
        let isFolder = folder && typeof folder === 'string',
            isFile = file && typeof file === 'string',
            isTemplate = file && typeof file === 'string',
            path = isFolder ? folder + BACKSLASH + file : file;
        
        function conditionalTemplate() {
            // if user typed in template
            if (isTemplate) {
                // paste template
                getTemplateFolder(template, path);
            }
        }
        function conditionalFile() {
            // make file
            fileMaker(folder, file);
            conditionalTemplate();
        }
        function conditionalFocus() {
            // focus on file
            FileViewController.openFileAndAddToWorkingSet(projectRoot + path);
            conditionalTemplate();
        }
        
        // if user typed in folder
        if (isFolder) {
            // lookup folder
            brackets.fs.readdir(projectRoot + folder, function(err, data){
                // if it does not exist
                if (err !== 0) {
                    // make folder
                    folderMaker(folder);
                    // if user typed in file
                    if (isFile) {
                        conditionalFile();
                    }
                // if it exists
                } else {
                    // if user typed in file and folder contains file
                    if (isFile && !data.includes(file)) {
                        conditionalFile();
                    // if user typed in file and folder does not contain file
                    } else if (isFile && data.includes(file)) {
                        conditionalFocus();
                    }
                }
            });
        } else {
            if (isFile) {
                // lookup file
                brackets.fs.readdir(projectRoot, function(err, data){
                    // if it does not exist
                    if (!data.includes(file)) {
                        conditionalFile();
                    // if it exists
                    } else {
                        conditionalFocus();
                    }
                });
            }
        }
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
                
                conditionals(file, folder, template);
            }
        });
    }
	
    // menu, keybinds, toolbar icon, and css styles
    const menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
		
    CommandManager.register(
        'Project Helper', 'waymans.helper', () => decisionMaker()
    );
    menu.addMenuItem('waymans.helper', KEYBINDS);
	
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
