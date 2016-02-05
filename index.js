var fs = require('fs'),
    path = require('path'),
    es = require('event-stream'),
    gutil = require('gulp-util'),
    glob = require('glob'),
    applySourceMap = require('vinyl-sourcemaps-apply');

var SourceMapGenerator = require('source-map').SourceMapGenerator;
var SourceMapConsumer = require('source-map').SourceMapConsumer;

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
        var result = processInclude(String(file.contents), file.path, file.sourceMap);
        file.contents = new Buffer(result.content);

        if (file.sourceMap && result.map) {
          if (Object.prototype.toString.call(result.map) === '[object String]') {
            result.map = JSON.parse(result.map);
          }

          // relative-ize the paths in the map
          result.map.file = path.relative(file.base, result.map.file);
          result.map.sources.forEach(function (source, q) {
            result.map.sources[q] = path.relative(file.base, result.map.sources[q]);
          });

          applySourceMap(file, result.map);
        }
      }

      callback(null, file);
    }

    return es.map(include)
};

function processInclude(content, filePath, sourceMap) {
  var matches = content.match(/^(\s+)?(\/\/|\/\*|\#|\<\!\-\-)(\s+)?=(\s+)?(include|require)(.+$)/mg);
  var relativeBasePath = path.dirname(filePath);

  if (!matches) return {content: content, map: null};

  var map = null, mapSelf, lastMappedLine, currentPos, insertedLines;
  if (sourceMap) {
    map = new SourceMapGenerator({file: unixStylePath(filePath)});
    lastMappedLine = 1;
    currentPos = 0;
    insertedLines = 0;

    mapSelf = function (currentLine) { // maps current file between matches and after all matches
      var currentOrigLine = currentLine - insertedLines;

      for (var q = (currentLine - lastMappedLine); q > 0; q--) {
        map.addMapping({
          generated: {
            line: currentLine - q,
            column: 0
          },
          original: {
            line: currentOrigLine - q,
            column: 0
          },
          source: filePath
        });
      }

      lastMappedLine = currentLine;
    };
  }

  for (var i = 0; i < matches.length; i++) {
    var leadingWhitespaceMatch = matches[i].match(/^\s*/);
    var leadingWhitespace = null;
    if (leadingWhitespaceMatch) {
      leadingWhitespace = leadingWhitespaceMatch[0].replace("\n", "");
    }

    // Remove beginnings, endings and trim.
    var includeCommand = matches[i]
      .replace(/(\s+)/gi, " ")
      .replace(/(\/\/|\/\*|\#)(\s+)?=(\s+)?/g, "")
      .replace(/(\*\/)$/gi, "")
      .replace(/['"]/g, "")
      .trim();
    var split = includeCommand.split(/ (.+)?/); // split only first white space
    // Split the directive and the path
    var includeType = split[0];
    var includePath = relativeBasePath + "/" + split[1];
    fs.stat(includePath, function(err, stat) {
        if (err) {
          var errString = 'File ' + includePath + ' is not exist!';
          console.log(err + '\n' + err.path);
          throw new Error();
        }
    });

    var currentLine;
    if (sourceMap) {
      // get position of current match and get current line number
      currentPos = content.indexOf(matches[i], currentPos);
      currentLine = currentPos === -1 ? 0 : content.substr(0, currentPos).match(/^/mg).length;

      // sometimes the line matches the leading \n and sometimes it doesn't. wierd.
      // in case it does, increment the current line counter
      if (leadingWhitespaceMatch[0][0] == '\n') currentLine++;

      mapSelf(currentLine);
    }
    
    // Use glob for file searching
    var fileMatches = glob.sync(includePath, {mark: true});
    var replaceContent = '';
    for (var y = 0; y < fileMatches.length; y++) {
      var globbedFilePath = fileMatches[y];
      
      // If directive is of type "require" and file already included, skip to next.
      if (includeType == "require" && includedFiles.indexOf(globbedFilePath) > -1) continue;
      
      // If not in extensions, skip this file
      if (!inExtensions(globbedFilePath)) continue; 
      
      // Get file contents and apply recursive include on result
      var fileContents = fs.readFileSync(globbedFilePath);
      
      var result = processInclude(fileContents.toString(), globbedFilePath, sourceMap);
      var resultContent = result.content;

      if (sourceMap) {
        var lines = resultContent.match(/^/mg).length; //count lines in result

        if (result.map) { // result had a map, merge mappings
          if (Object.prototype.toString.call(result.map) === '[object String]') {
            result.map = JSON.parse(result.map);
          }

          if (result.map.mappings && result.map.mappings.length > 0) {
            var resultMap = new SourceMapConsumer(result.map);
            resultMap.eachMapping(function (mapping) {
              if (!mapping.source) return;

              map.addMapping({
                generated: {
                  line: mapping.generatedLine + currentLine - 1,
                  column: mapping.generatedColumn + (leadingWhitespace ? leadingWhitespace.length : 0)
                },
                original: {
                  line: mapping.originalLine,
                  column: mapping.originalColumn
                },
                source: mapping.source,
                name: mapping.name
              });
            });

            if (result.map.sourcesContent) {
              result.map.sourcesContent.forEach(function(sourceContent, i) {
                map.setSourceContent(result.map.sources[i], sourceContent);
              });
            }
          }
        } else { // result was a simple file, map whole file to new location
          for (var q = 0; q < lines; q++) {
            map.addMapping({
              generated: {
                line: currentLine + q,
                column: leadingWhitespace ? leadingWhitespace.length : 0
              },
              original: {
                line: q + 1,
                column: 0
              },
              source: globbedFilePath
            });
          }

          if (sourceMap.sourcesContent) {
            map.setSourceContent(globbedFilePath, resultContent);
          }
        }

        // increment/set map line counters
        insertedLines += lines;
        currentLine += lines;
        lastMappedLine = currentLine;
      }
      
      if (includedFiles.indexOf(globbedFilePath) == -1) includedFiles.push(globbedFilePath);

      // If the last file did not have a line break, and it is not the last file in the matched glob,
      // add a line break to the end
      if (!resultContent.trim().match(/\n$/) && y != fileMatches.length-1) {
        resultContent += "\n";
      }

      if (leadingWhitespace) resultContent = addLeadingWhitespace(leadingWhitespace, resultContent);

      replaceContent += resultContent;
    }

    // REPLACE
    if (replaceContent.length) {
      // sometimes the line matches the leading \n and sometimes it doesn't. wierd.
      // in case it does, preserve that leading \n
      if (leadingWhitespaceMatch[0][0] === '\n') {
        replaceContent = '\n' + replaceContent;
      }

      content = content.replace(matches[i], function() { return replaceContent });
      insertedLines--; // adjust because the original line with comment was removed
    }
  }

  if (sourceMap) {
    currentLine = content.match(/^/mg).length + 1;

    mapSelf(currentLine);
  }
  
  return {content: content, map: map ? map.toString() : null};
}

function unixStylePath(filePath) {
  return filePath.replace(/\\/g, '/');
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
