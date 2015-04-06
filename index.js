var fs = require('fs'),
    path = require('path'),
    es = require('event-stream'),
    gutil = require('gulp-util'),
    glob = require('glob');


var DIRECTIVE_REGEX = /^[\/\s#]*?=\s*?((?:require|include)(?:_tree|_directory)?)\s+(.*$)/mg;

var requiredFiles = {},
    extensions = [],
    includePaths = [],
    filesDone = [];

module.exports = function (params) {
    var params = params || {};
    requiredFiles = {};
    extensions = [];
    includePaths = [],
    filesDone = [];

    if (params.extensions) {
        extensions = typeof params.extensions === 'string' ? [params.extensions] : params.extensions;
    }
    if (params.includePaths) {
        includePaths = typeof params.includePaths === 'string' ? [params.includePaths] : params.includePaths;
    }

    function include(file, callback) {
        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            throw new gutil.PluginError('gulp-include', 'stream not supported');
        }

        if (file.isBuffer()) {
            var newText = expand(String(file.contents), file.path);
            file.contents = new Buffer(newText);
        }

        callback(null, file);
    }

    return es.map(include)
};

function expand(fileContents, filePath) {
    var regexMatch,
        matches = [],
        returnText = fileContents,
        i, j;

    DIRECTIVE_REGEX.lastIndex = 0;

    while (regexMatch = DIRECTIVE_REGEX.exec(fileContents)) {
        matches.push(regexMatch);
    }

    for (var i = 0; i < matches.length; i++) {
        var match = matches[i],
            original = match[0],
            directiveType = match[1],
            start = match.index,
            end = start + original.length,
            thisMatchText = "",
            newMatchText = "",
            files = globMatch(match, filePath),
            fileName = "",
            whitespace = null;

        if (directiveType.indexOf("_tree") !== -1 || directiveType.indexOf("_directory") !== -1) {
            thisMatchText += original + "\n";
        }

        returnTextBefore = returnText;
        for (j = 0; j < files.length; j++) {
            if ( filesDone.indexOf(files[j])<0 ) {
                filesDone.push(files[j]);

                fileName = files[j];
                newMatchText = expand(String(fs.readFileSync(fileName)), fileName);

                //Try to retain the same indent level from the original include line
                whitespace = original.match(/^\s+/);
                if (whitespace) {
                    //Discard newlines
                    whitespace = whitespace[0].replace("\n", "");

                    //Is there some whitespace left?
                    if (whitespace) {
                        newMatchText = addLeadingWhitespace(whitespace, newMatchText);
                    }
                }

                thisMatchText += newMatchText + "\n";

                if (directiveType.indexOf('require') !== -1 || directiveType.indexOf('include') !== -1) {
                    requiredFiles[fileName] = true;
                }
                returnText = returnText.replace(match[0], thisMatchText);
            }else{
                returnText = returnText.replace(match[0], '/* already included: '+match[2].replace(/\//g, '-')+' */');
            }
        }

    }

    return returnText ? returnText : fileContents;
}

function globMatch(match, filePath) {
    var directiveType = match[1],
        relativeFilePath = match[2],
        files = [],
        globs = [],
        negations = [];

    if (directiveType.indexOf('_tree') !== -1) {
        relativeFilePath = relativeFilePath.concat('/**/*');
        directiveType = directiveType.replace('_tree', '');
    }

    if (directiveType.indexOf('_directory') !== -1) {
        relativeFilePath = relativeFilePath.concat('/*');
        directiveType = directiveType.replace('_directory', '');
    }

    if (directiveType === 'require' || directiveType === 'include') {
        if (relativeFilePath.charAt(0) === '[') {
            relativeFilePath = eval(relativeFilePath);
            for (var i = 0; i < relativeFilePath.length; i++) {
                if (relativeFilePath[i].charAt(0) === '!') {
                    negations.push(relativeFilePath[i].slice(1))
                } else {
                    globs.push(relativeFilePath[i]);
                }
            }
        } else {
            globs.push(relativeFilePath);
        }

        for (var i = 0; i < globs.length; i++) {
            var globFiles = _internalGlob(globs[i], filePath);
            files = union(files, globFiles);
        }

        for (var i = 0; i < negations.length; i++) {
            var negationFiles = _internalGlob(negations[i], filePath);
            files = difference(files, negationFiles);
        }
    }

    return files;
}

function _arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

function _internalGlob(thisGlob, filePath) {
    var folderPath = path.dirname(filePath),
        fullPath = path.join(folderPath, thisGlob.replace(/['"]/g, '')),
        files;

    files = glob.sync(fullPath, {
        mark: true
    });

    var thisGlobAdd = '',
        folderPathAdd = '',
        filesAdd = [];
    for (var i = includePaths.length - 1; i >= 0; i--) {
        thisGlobAdd = path.relative(path.dirname(filePath), includePaths[i])+thisGlob,
        folderPathAdd = path.dirname(filePath),
            fullPathAdd = path.join(folderPathAdd, thisGlobAdd.replace(/['"]/g, ''));

        filesAdd = glob.sync(fullPathAdd, {
            mark: true
        });
        files = _arrayUnique(files.concat(filesAdd));
        if ( filesAdd.length>0 ) {
            break;
        }
    };

    files = files.filter(function (fileName) {
        var slashSplit = fileName.split(/[\\\/]/),
            thisExtension = fileName.split('.').pop();

        //Ignore directories
        if (slashSplit.pop() === '')
            return false;

        //Check for allowable extensions if specified, otherwise allow all extensions
        if (extensions.length > 0 && extensions.indexOf(thisExtension) === -1) {
            return false;
        }

        return true;

    });

    return files;
}

function replaceStringByIndices(string, start, end, replacement) {
    return string.substring(0, start) + replacement + string.substring(end);
}

function addLeadingWhitespace(whitespace, string) {
    return string.split("\n").map(function(line) {
        return whitespace + line;
    }).join("\n");
}

//We can't use lo-dash's union function because it wouldn't support this: ["*.js", "app.js"], which requires app.js to come last
function union(arr1, arr2) {
    if (arr1.length == 0) {
        return arr2;
    }

    var index;
    for (var i = 0; i < arr2.length; i++) {
        if ((index = arr1.indexOf(arr2[i])) !== -1) {
            arr1.splice(index, 1);
        }
    }
    return arr1.concat(arr2);
}

function difference(arr1, arr2) {
    var index;
    for (var i = 0; i < arr2.length; i++) {
        while ((index = arr1.indexOf(arr2[i])) !== -1) {
            arr1.splice(index, 1);
        }
    }
    return arr1;
}