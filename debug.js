// allows to debug this environment by adding all the source files
// to cmdi maker instead of build files.
// repo should be available as http source for this to work
// and the correct url_prefix must be given below.
// in cmdi maker, call addFile(<this_file>)
var url_prefix = "http://localhost:8081/";

var source_scripts = [
	"src/js/imdi_main.js",
	"src/js/imdi_LanguagePacks.js",
	"src/js/imdi_generator.js",
	"src/js/imdi_cmdi_generator.js",
	"src/js/imdi_forms.js",
	"src/js/imdi_corpus.js",
	"src/js/imdi_content_languages.js",
	"src/js/imdi_resources.js",
	"src/js/imdi_actors.js",
	"src/js/imdi_actor_languages.js",
	"src/js/imdi_sessions.js",
	"src/js/imdi_sessions_gui.js",
	"src/js/imdi_output.js",
];

var source_stylesheet = "src/css/layout-imdi.css";

addFiles(source_scripts, url_prefix);
addFiles(source_stylesheet, url_prefix);


