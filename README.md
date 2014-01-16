#gulp-include [![NPM version][npm-image]][npm-url]
>Makes inclusion of files a breeze.  
Enables functionality similar to that of snockets / sprockets or other file insertion compilation tools.

> Made for gulp 3


## Usage
First, install `gulp-include` as a dev dependency:
`npm install --save-dev gulp-include`

Then, add your _include-comments_ to your file.
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


[npm-url]: https://npmjs.org/package/gulp-include
[npm-image]: https://badge.fury.io/js/gulp-include.png