#gulp-include [![NPM version][npm-image]][npm-url]
>Makes inclusion of files a breeze.  
Enables functionality similar to that of snockets / sprockets or other file insertion compilation tools.

> Made for gulp 3


## Usage
First, install `gulp-include` as a dev dependency:
`npm install --save-dev gulp-include`

The example below compiles a coffee-file with a heap of inclusion inside into a single js-file:

`app.coffee`:

```javascript
#= require views/AppView
#= require views/LandingView
#= require views/AboutView
#= require views/CheeseView

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