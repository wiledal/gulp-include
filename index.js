var fs		= require("fs"),
	path	= require("path"),
	es		= require("event-stream"),
	gutil	= require("gulp-util");

DIRECTIVE_REGEX = /^(.*=\s*(\w+.*?))$/gm

function getFiles(dir, cb){
	var files = fs.readdirSync(dir);

	for(var i in files){
		if (!files.hasOwnProperty(i)) continue;
		var name = dir+'/'+files[i];

		if (fs.statSync(name).isDirectory()){
			getFiles(name, cb);
		}else{
			cb(name);
		}
	}
}

module.exports = function(params) {
    function include(file, callback) {
		if (file.isNull()) {
			return callback(null, file);
		}

		if (file.isStream()) {
			throw new gutil.PluginError('gulp-include', 'stream not supported');
		}

		if (file.isBuffer()) {
			var text = String(file.contents);
			var newText = text;
			var matches;

			while (matches = DIRECTIVE_REGEX.exec(text)) {
				if (matches[1].match(/include_tree|require_tree/)) {
					var match 		= matches[1],
						directive	= matches[2].replace(/['"]/g, '').split(/\s+/),
						relPath		= file.base,
						fullPath	= relPath + directive[1],
						absolutePath = path.resolve(fullPath);

					if (fs.existsSync(fullPath)) {
						var stats = fs.statSync(fullPath);

						if (stats.isDirectory()) {
							var filesStr = "";
							getFiles(absolutePath, function(fileName) {
								if (fs.existsSync(fileName)) {
									var includeContent = String(fs.readFileSync(fileName));
									filesStr = filesStr + includeContent;
								} else {
									throw new gutil.PluginError('gulp-include', 'File not found: ' + fullPath);
								}
							});
							newText = newText.replace(match, filesStr);
						}
					}
				} else if (matches[1].match(/include|require/)) {
					var match 		= matches[1],
						directive	= matches[2].replace(/['"]/g, '').split(/\s+/),
						relPath		= file.base,
						fullPath	= relPath + directive[1];

					if (fs.existsSync(fullPath)) {
						var includeContent = String(fs.readFileSync(fullPath));

						newText = newText.replace(match, includeContent);
					} else {
						throw new gutil.PluginError('gulp-include', 'File not found: ' + fullPath);
					}
				}
			}
			file.contents = new Buffer(newText);
		}

		callback(null, file);
	}

    return es.map(include)
}
