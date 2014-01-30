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

function matchExtension(extension, params) {
	if (params.extensions) {
		if (Array.isArray(params.extensions)) {
			if (params.extensions.indexOf(extension) > -1) return true;
		} else if (typeof params.extensions == "string") {
			if (params.extensions == extension) return true;
		} else {
			throw new gutil.PluginError('gulp-include', 'extensions param only allows Array or String');
		}
	}else{
		return true;
	}
	return false;
}

module.exports = function(params) {
	var params = params || {};

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
									var extension = fileName.split(".").pop();
									currentExtension = extension;

									if (matchExtension(extension, params)) {
										var includeContent = String(fs.readFileSync(fileName));
										filesStr = filesStr + includeContent + gutil.linefeed;
									}
								} else {
									throw new gutil.PluginError('gulp-include', 'File not found: ' + fullPath);
								}
							});

							var replaceWith = ""
							if (params.extensions) {
								replaceWith = match + gutil.linefeed + filesStr;
							} else {
								replaceWith = filesStr;
							}
							newText = newText.split(match).join(replaceWith);
						}
					}
				} else if (matches[1].match(/include|require/)) {
					var match 		= matches[1],
						directive	= matches[2].replace(/['"]/g, '').split(/\s+/),
						relPath		= file.base,
						fullPath	= relPath + directive[1];
						extension	= directive[1].split(".").pop();

					if (fs.existsSync(fullPath)) {
						if (matchExtension(extension, params)) {
							var includeContent = String(fs.readFileSync(fullPath));
							newText = newText.split(match).join(includeContent + gutil.linefeed);
						}
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
