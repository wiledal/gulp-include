var fs		= require("fs"),
	path	= require("path"),
	es		= require("event-stream"),
	gutil	= require("gulp-util");

DIRECTIVE_REGEX = /^(.*=\s*(require|include|require_tree|include_tree)\s+([\w\.\/-]+))$/gm

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

var params = {}

/* Process a file, recursively resolving include/requires
 * and return the resulting bytes */
recursive_include = function(file) {

  if (file === null || file.path === null) {
      throw new gutil.PluginError('gulp-include', "File not found");
  }

  var text = String(file.contents);
  var newText = text;
  var matches;

  var scoped_regex = new RegExp(DIRECTIVE_REGEX)

  while (matches = scoped_regex.exec(text)) {
    if (matches[2] == 'include_tree' || matches[2] == 'require_tree') {
      var match 		= matches[1],
      relPath		= file.base,
      fullPath	= path.join(relPath, matches[3].replace(/['"]/g, '')),
      absolutePath = path.resolve(fullPath);


      if (fs.existsSync(fullPath)) {
        var stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          var filesStr = "";
          var skipped_files = false

          getFiles(absolutePath, function(fileName) {
            if (fs.existsSync(fileName)) {
              var extension = fileName.split(".").pop();
              currentExtension = extension;

              if (matchExtension(extension, params)) {
                var nextFile = new gutil.File( {
                  base: path.dirname(fileName),
                  path: fileName,
                  contents: fs.readFileSync(fileName)
                })
                var includeContent = recursive_include(nextFile)
                filesStr = filesStr + includeContent.contents + gutil.linefeed;
              } else {
                // Mark that we have unprocessed files in this tree,
                // so we can leave the match in
                skipped_files = true;
              }
            } else {
              throw new gutil.PluginError('gulp-include', 'File not found: ' + fullPath);
            }
          });

          var replaceWith = ""
          if (skipped_files) {
            replaceWith = match + gutil.linefeed + filesStr;
          } else {
            replaceWith = filesStr;
          }
          newText = newText.split(match).join(replaceWith);
        }
      }
    } else if (matches[2] == 'include' || matches[2] == 'require') {
      var match 		= matches[1],
      relPath		= file.base,
      fullPath	= path.join(relPath, matches[3].replace(/['"]/g, '')),
      extension = matches[3].split('.').pop();

      if (fs.existsSync(fullPath)) {
        if (matchExtension(extension, params)) {
          var nextFile = new gutil.File( {
            path: fullPath,
            base: path.dirname(fullPath),
            contents: fs.readFileSync(fullPath)
          })

          var includeContent = recursive_include(nextFile)
          newText = newText.split(match).join(includeContent.contents + gutil.linefeed);
        }
      } else {
        throw new gutil.PluginError('gulp-include', 'File not found: ' + fullPath);
      }
    }
  }
  file.contents = new Buffer(newText);
  return file
}

module.exports = function(parameters) {

    function include(file, callback) {
      if (file.isNull()) {
        return callback(null, file);
      }

      if (file.isStream()) {
        throw new gutil.PluginError('gulp-include', 'stream not supported');
      }

      if (file.isBuffer()) {
        params = parameters || {};
        recursive_include(file)
      }

      callback(null, file);
    }

    return es.map(include)
}
