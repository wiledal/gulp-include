#gulp-include [![NPM version][npm-image]][npm-url]
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
or 
```coffeescript
#= include relative/path/to/file.coffee
```
or even
```javascript
/*
= include relative/path/to/file.js
= require relative/path/to/file2.js
  =    include    relative/path/to/file.js
*/
```
`gulp-include` does not care about whitespace, as long as the comment-line starts with a  _newline_ followed `=` and contains `include` or `require`


The example below compiles a coffee-file with a heap of inclusion inside into a single js-file:

`app.coffee`:

```coffeescript
#= require views/AppView.coffee
#= require views/LandingView.coffee
#= require views/AboutView.coffee
#= require views/CheeseView.coffee

class Main extends AppView
	constructor: ->
		console.log "This is main!"

window.main = new Main()
```

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


[npm-url]: https://npmjs.org/package/gulp-include
[npm-image]: https://badge.fury.io/js/gulp-include.png