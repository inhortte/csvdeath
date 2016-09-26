'use strict';

require('babel-core/register');

const gulp = require('gulp');
const babel = require('gulp-babel');
const del = require('del');
const wrap = require('gulp-wrap');
const path = require('path');

const paths = {
  serverSrc: 'src/server/**/*.js',
  serverDest: 'server',
  serverTest: 'test/server/**/*.js'
};
const babelPresets = [
  'es2015'
];
const babelPlugins = [
  'transform-object-assign',
  'array-includes'
];

/*
 * SERVER
 */

const cleanServer = (cb) => {
  del([path.join(paths.serverDest, '**/*.js')]).then(function(ps) {
    console.log('Expunged:\n' + ps.join('\n'));
    cb();
  });
};
const server = () => {
  return gulp.src(paths.serverSrc)
    .pipe(babel({
      plugins: babelPlugins
    }))
    .pipe(gulp.dest(paths.serverDest));
};
const testServer = () => {
  return gulp.src(paths.serverTest)
    .pipe(mocha({reporter: 'nyan'}));
};

const buildServer = gulp.series(cleanServer, server);
const swatch = () => {
  gulp.watch([paths.serverSrc], buildServer);
};

/*
 * TASKS
 */

gulp.task('sclean', cleanServer);
gulp.task('server', server);
gulp.task('buildServer', buildServer);
gulp.task('testServer', testServer);
gulp.task('swatch', swatch);

gulp.task('default', swatch);
