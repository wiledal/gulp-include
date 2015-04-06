var
	gulp			= require('gulp'),
	include			= require('gulp-include'),
    path 			= require('path');


gulp.task('scripts', function () {

	gulp.src('main.js')
		.pipe( include({
			includePaths: [
				path.resolve('./')+'/libraries',
				path.resolve('./')
			]
		}) )
		.pipe(gulp.dest('public'));
});

gulp.task("default", ['scripts']);