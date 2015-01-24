#gulp-include [![NPM version][npm-image]][npm-url] ![Travis build][travis-image]
>Makes inclusion of files a breeze.  
Enables functionality similar to that of snockets / sprockets or other file insertion compilation tools.

> Made for gulp 3


## Usage
First, install `gulp-include` as a dev dependency:
`npm install --save-dev gulp-include`

Then, add your _include-comments_ to your file.  
_People who have experience with `sprockets` or `snockets` will feel at home._


An _include-comment_ looks like this:
```javascript
//= include relative/path/to/file.js
```
or if you want to get crazy, a glob pattern like so:
```javascript
//= include relative/path/to/directory/*.js
```

or to get even crazier, an array glob similar to commonly used in GruntJS:
```javascript
//= include ['app/someFramework.js', 'app/**/*.js', '!app/vendor/**/*', 'app/someLibrary.js']
```

(Note: for those of you unfamiliar with the above syntax, check out https://github.com/isaacs/node-glob
or http://gruntjs.com/configuring-tasks#globbing-patterns)

You can do all of this in any language, the only requirement is that the first character
 on the line after any #, /, or white space characters is an equal sign.
```coffeescript
#= require_tree relative/path/to/directory
```
`gulp-include` disregards whitespace, as long as the comment-line starts with a _newline_ followed `=` and contains `include`, `require` or `include_tree`, `require_tree`.

This plugin recursively expand files it includes, so you can nest includes inside of files that
    were themselves included. IE:

`main.js`:
```
//= include included_file.js
```

`included_file.js`:
```
//= include recursive_include.js
```
And so on recursively to an arbitrary depth.

The example below compiles a several coffee-files and js-files into a single js-file:

`app.coffee`:

```coffeescript
`
//= require vendor/jquery.js
//= require vendor/modernizr.js
`

#= require controllers/AppController.coffee
#= require_tree views

class Main extends AppController
	constructor: ->
		console.log "This is main!"

window.main = new Main()
```
*Note:* The example above uses backticks (\`) to allow `gulp-coffee` to compile inline javascript

`gulpfile.js`:

```javascript
var gulp		= require('gulp'),
	include		= require('gulp-include'),
	coffee		= require('gulp-coffee');

gulp.task("scripts", function() {
	gulp.src('src/js/app.coffee')
		.pipe( include() )
		.pipe( coffee() )
		.pipe( gulp.dest("dist/js") )
});

gulp.task("default", "scripts");
```

## Options
* `extensions` (optional)
	* Takes a `String` or an `Array` of extensions, eg: `"js"` or `["js", "coffee"]`
	* If set, all inclusions that does not match the extension(s) will be ignored

## Release log
#### 1.1.1
* Merged community fix by [trolev](https://github.com/trolev)

#### 1.1.0
* Merged feature: Keep leading whitespaces by [maxgalbu](https://github.com/maxgalbu)

#### 1.0.1
* Fixed issue which caused extensions to be "remembered" if `gulp-include` ran multiple times in a row, resulting in lost includes

#### 1.0.0
* Merged major refactoring by [scottmas](https://github.com/scottmas) - Many thanks!
	* Rewritten core (regex, replacing and file mashing)
	* Glob support
	* Recursive support
	* Respecting indentation of included files

* Upping version to 1.0.0 - seems fitting after such a large refactor

#### 0.2.3
* Merged community fixes by [platdesign](https://github.com/platdesign) and [cujojp](https://github.com/cujojp)

#### 0.2.2
* Updated regex directive to not collide with other requireing plugins, like browserify ([cwacek](https://github.com/cwacek))

#### 0.2.1
* Changed replace-method to fix issue when requiring a file that contained special characters ([juanghurtado](https://github.com/juanghurtado))

#### 0.2.0
* Added `require_tree`/`include_tree` (Thanks to [juanghurtado](https://github.com/juanghurtado)!)
* Method now takes an `extensions` param for controlling what types of files to include

#### 0.1.0
* Basic include

## Licence
(MIT License)

Copyright (c) 2014 Hugo Wiledal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


[travis-image]: https://api.travis-ci.org/wiledal/gulp-include.png?branch=master

[npm-url]: https://npmjs.org/package/gulp-include
[npm-image]: https://badge.fury.io/js/gulp-include.png
