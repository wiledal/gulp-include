var fs = require('fs'),
    path = require('path'),
    es = require('event-stream'),
    gutil = require('gulp-util'),
    glob = require('glob');

var extensions = null,
    includedFiles = [];

module.exports = function (params) {
    var params = params || {};
    includedFiles = [];
    extensions = null;

    if (params.extensions) {
      extensions = typeof params.extensions === 'string' ? [params.extensions] : params.extensions;
    }

    function include(file, callback) {
      if (file.isNull()) {
        return callback(null, file);
      }

      if (file.isStream()) {
        throw new gutil.PluginError('gulp-include', 'stream not supported');
      }

      if (file.isBuffer()) {
        var newText = processInclude(String(file.contents), file.path);
        file.contents = new Buffer(newText);
      }

      callback(null, file);
    }

    return es.map(include)
};

function processInclude(content, filePath) {
  var matches = content.match(/^(\s+)?(\/\/|\/\*|\#)(\s+)?=(\s+)?(include|require)(.+$)/mg);
  var relativeBasePath = path.dirname(filePath);
  
  if (!matches) return content;
  
  for (var i = 0; i < matches.length; i++) {
    var leadingWhitespaceMatch = matches[i].match(/^(\s+)/);
    var leadingWhitespace = null;
    if (leadingWhitespaceMatch) {
      leadingWhitespace = leadingWhitespaceMatch[0];
      if (leadingWhitespaceMatch[0].indexOf("\n") > -1) leadingWhitespace = leadingWhitespaceMatch[0].split("\n")[1];
      leadingWhitespace = leadingWhitespace.replace("\n", "");
    }
    
    // Remove beginnings, endings and trim.
    var includeCommand = matches[i]
      .replace(/(\s+)/gi, " ")
      .replace(/(\/\/|\/\*)(\s+)?=(\s+)?/g, "")
      .replace(/(\*\/)$/gi, "")
      .replace(/['"]/g, "")
      .trim();
    var split = includeCommand.split(" ");
    
    // Split the directive and the path
    var includeType = split[0];
    var includePath = relativeBasePath + "/" + split[1];
    
    // Use glob for file searching
    var fileMatches = glob.sync(includePath, {mark: true});
    var replaceContent = null;
    for (var y = 0; y < fileMatches.length; y++) {
      var globbedFilePath = fileMatches[y];
      
      // If directive is of type "require" and file already included, skip to next.
      if (includeType == "require" && includedFiles.indexOf(globbedFilePath) > -1) continue;
      
      // If not in extensions, skip this file
      if (!inExtensions(globbedFilePath)) continue; 
      
      // Get file contents and apply recursive include on result
      var fileContents = fs.readFileSync(globbedFilePath);
      if (!replaceContent) replaceContent = "";
      if (leadingWhitespace) fileContents = addLeadingWhitespace(leadingWhitespace, fileContents.toString());
      replaceContent += processInclude(fileContents.toString(), globbedFilePath);
      
      if (includedFiles.indexOf(globbedFilePath) == -1) includedFiles.push(globbedFilePath);
      
      // If the last file did not have a line break, and it is not the last file in the matched glob,
      // add a line break to the end
      if (!replaceContent.trim().match(/\n$/) && y != fileMatches.length-1) replaceContent += "\n";
    }
    
    // REPLACE
    if (replaceContent) {
      content = content.replace(matches[i], function(){return replaceContent});
    }
  }
  
  return content;
}

function addLeadingWhitespace(whitespace, string) {
  return string.split("\n").map(function(line) {
    return whitespace + line;
  }).join("\n");
}

function inExtensions(filePath) {
  if (!extensions) return true;
  for (var i = 0; i < extensions.length; i++) {
    var re = extensions[i] + "$";
    if (filePath.match(re)) return true;
  }
  return false;
}