var gulp        = require('gulp');
var browserSync = require('browser-sync');
var reload      = browserSync.reload;

// browser-sync task for starting the server.
gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: "./"
        }
    });
});

// Default task to be run with `gulp`
gulp.task('default', ['browser-sync']);
});