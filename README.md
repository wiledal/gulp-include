#gulp-include [![NPM version][npm-image]][npm-url] ![Travis build][travis-image]
>Makes inclusion of files a breeze.  
Enables functionality similar to that of snockets / sprockets or other file insertion compilation tools.

> Made for gulp 3

## Features
* Concatenate files with full control
* Respects indentation whitespace
* Uses [globs](https://www.npmjs.com/package/glob) for simple path control
* Works recursively (files can include files that can include files, and so on)

*Warning: if you are updating from 1.x.x to 2.x.x, please read this readme to get up to date on the behavior of `gulp-include`*

## Installation
```shell
npm install gulp-include
```
## Usage
Example `gulpfile.js`:
```javascript
var gulp          = require("gulp"),
    include       = require("gulp-include");

gulp.task("scripts", function() {
  console.log("-- gulp is running task 'scripts'");

  gulp.src("src/js/main.js")
    .pipe(include())
      .on('error', console.log)
    .pipe(gulp.dest("dist/js"));
});

gulp.task("default", ["scripts"]);

```

## Options
* `extensions` (optional)
	* Takes a `String` or an `Array` of extensions, eg: `"js"` or `["js", "coffee"]`
	* If set, all directives that does not match the extension(s) will be ignored

## Include directives
`gulp-include` uses directives similar to `sprockets` or `snockets`. A _directive_ is a comment in your files that `gulp-include` recognizes as a command.
  
Example directives:
```javascript
//=require vendor/jquery.js
//=require vendor/**/*.js
//=include relative/path/to/file.js
```
```css
/*=include relative/path/to/file.css */
```
```coffee
#=include relative/path/to/file.coffee
```
```html
<!--=include relative/path/to/file.html -->
```

The contents of the referenced file will replace the file.
  
### `require` vs. `include`
A file that is included with `require` will only be included if it has not been included  before. Files included with `include` will _always_ be included.  
For instance, let's say you want to include `jquery.js` only once, and before any of your other scripts in the same folder.
```javascript
//=require vendor/jquery.js
//=require vendor/*.js
```
Note: This also works recursively. If for instance, for the example above, if another file in the folder `vendor` is also including `jquery.js` with the `require`-directive it will be ignored.

## Release log
#### 2.1.0
* Merged sourcemap support by [vetruvet](https://github.com/vetruvet)
* Merged support for html-comments by [jelmerdemaat](https://github.com/jelmerdemaat)

#### 2.0.3
* Merged community fix by [shadow1runner](https://github.com/shadow1runner)

#### 2.0.2
* Updated replace to support specials [Riim](https://github.com/Riim)

#### 2.0.1
* Fixed an issue with indenting

#### 2.0.0
* Core rewritten to be slimmer and more comprehensive.
* `require` and `include` no longer work the same. `require` will only include a file that hasn't been included yet. See readme for details.
* Tests have been rewritten based on the old ones, but also to fit the new functionality
* Deprecated `require_tree` and `require_directory` as they serve little purpose. Use globs (`path/to/**/*.xxx`) instead.
* Fixed spacing issues and 

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
