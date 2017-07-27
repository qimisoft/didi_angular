var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var templateCache = require('gulp-angular-templatecache');
var uglify = require('gulp-uglify');
var rev = require('gulp-rev');
var revCollector = require('gulp-rev-collector');
var ngAnnotate = require('gulp-ng-annotate');
var clean = require('gulp-clean');
var runSequence = require('gulp-sequence');
var htmlreplace = require('gulp-html-replace');
var browserSync = require('browser-sync').create();

function ac() {
    console.log(JSON.stringify(this))
}

function log(obj) {
    console.log(obj);
}

var uglifyOptions = {};
var args = process.argv.slice(2);
// console.log(args);
if (args[1] == "-e" && (args[2]=="prod")) {
    console.log("[PRODUCT MODAL] and will drop console");
    uglifyOptions = {
        preserveComments: "license",
        compress: {
            drop_console: true
        }
    }
} else {
    console.log("[DEV MODAL]");
}



var paths = {
    clean: ['./production/www/img/', './production/www/css/', './production/www/fonts/', './production/www/js/', './production/www/*.html', './.tmp'],
    sass: ['./scss/**/*.scss'],
    jsLibs: [
        "./www/lib/ionic/js/ionic.bundle.js",
        "./www/lib/underscore/underscore-min.js",
        "./www/lib/ionic-citypicker/dist/ionic-citypicker.bundle.min.js",
        "./www/lib/ionic-datepicker/dist/ionic-datepicker.bundle.min.js",
    ],
    cssLibs: ['./www/css/ionic.app.min.css'],
    template: ['./www/business/*/*.html'],
    common: [
        "./www/common/services/*.js",
        "./www/common/directives/directives.js",
        "./www/common/filters/filters.js"
    ],
    compress: ['./www/js/*.js'],
    ctrl: ['./www/business/**/*.js']
};


gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            basedir: "./"
        },
        files: [
            "www/css/*.css",
            "www/**/*.js",
            "www/**/*.html",
            "www/font/*.*",
            "www/img/*"
        ]
    });
});


gulp.task('LibsJsMerge', function(done) {
    log("合并外部JS...");
    return gulp.src(paths.jsLibs)
        .pipe(ngAnnotate())
        .pipe(concat('libs.min.js'))
        .pipe(uglify(uglifyOptions))
        .pipe(rev())
        .pipe(gulp.dest('./production/www/js'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./rev/js_libs'))
});

gulp.task('LibsCssMerge', function(done) {
    log("合并外部CSS...");
    return gulp.src(paths.cssLibs)
        .pipe(minifyCss({
            keepSpecialComments: 0
        }))
        .pipe(concat('libs.min.css'))
        .pipe(rev())
        .pipe(gulp.dest('./production/www/css'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./rev/css_libs'));

});



gulp.task('CommonsMerge', function(done) {
    log("合并公用js...");
    return gulp.src(paths.common)
        .pipe(ngAnnotate())
        .pipe(concat('common.js'))
        .pipe(gulp.dest('./production/www/js/.temp'))
})

gulp.task('ControllersMerge', function(done) {
    log("合并控制器...");
    return gulp.src(paths.ctrl)
        .pipe(ngAnnotate())
        .pipe(concat('controllers.js'))
        .pipe(gulp.dest('./production/www/js/.temp'))
})

gulp.task('TemplatesCacheMerge', function(done) {
    log("合并模板...");
    return gulp.src(paths.template)
        .pipe(templateCache({
            standalone: true,
            root: "business"
        }))
        .pipe(gulp.dest('./production/www/js/.temp'))
});

gulp.task('BusinessCssMin', function(done) {
    log("合并业务CSS...");
    return gulp.src(['./www/css/main.css'])
        .pipe(minifyCss({
            keepSpecialComments: 0
        }))
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(rev())
        .pipe(gulp.dest('./production/www/css'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./rev/css_business'))
});

gulp.task('BusinessJsMin', function(done) {
    log("合并业务JS...");
    return gulp.src(['./production/www/js/.temp/*.js', ])
        .pipe(concat('business.min.js'))
        .pipe(uglify(uglifyOptions))
        .pipe(rev())
        .pipe(gulp.dest('./production/www/js'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./rev/js_business'))
});

gulp.task('ModifyMainPage', function(done) {
    log("生成首页...");
    return gulp.src(['./www/main.html', ])
        .pipe(htmlreplace({
            'businessCss': 'css/main.min.css',
            'libCss': 'css/libs.min.css',
            'businessJs': 'js/business.min.js',
            'libJs': 'js/libs.min.js'
        }, {
            resolvePaths: false
        }))
        .pipe(gulp.dest('./.tmp/'))
});

gulp.task('ReplaceRef', function(done) {
    log("生成首页...");

    return gulp.src(['./rev/**/*.json', './.tmp/main.html'])
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(gulp.dest('./production/www/'))
});
gulp.task('copyManifest', function(done) {
    log("拷贝配置文件...");

    return gulp.src(['./www/MANIFEST.properties'])
        .pipe(gulp.dest('./production/www/'))
});

gulp.task('ImgsCopy', function(done) {
    log("拷贝图片...");
    return gulp.src(['./www/img/*'])
        .pipe(gulp.dest('./production/www/img'))
});

gulp.task('FontsCopy', function(done) {
    log("拷贝字体...");
    return gulp.src(['./www/lib/ionic/fonts/*'])
        .pipe(gulp.dest('./production/www/fonts'))
});


gulp.task('PreClean', function(done) {
    log("清理打包文件夹...");
    return gulp.src(paths.clean)
        .pipe(clean())

});

gulp.task('AfterBuild', function(done) {
    log("最后清理...");
    return gulp.src(['./production/www/js/.temp/', './.tmp'])
        .pipe(clean())

});

gulp.task('default', ['sass', 'watch', 'browser-sync']);
gulp.task('OthersFilesCopy', ['ImgsCopy', 'FontsCopy']);
gulp.task('build', function(cb) {
    // 打web包
    runSequence('PreClean', 'sass', ['LibsCssMerge', 'BusinessCssMin'], 'LibsJsMerge', 'CommonsMerge', 'ControllersMerge', 'TemplatesCacheMerge', 'BusinessJsMin', 'ModifyMainPage', 'ReplaceRef', 'OthersFilesCopy', 'copyManifest', 'AfterBuild', cb);
    //不清除中间临时文件
    // runSequence('PreClean', 'sass', ['LibsCssMerge', 'BusinessCssMin'], 'LibsJsMerge', 'CommonsMerge', 'ControllersMerge', 'TemplatesCacheMerge', 'BusinessJsMin', 'ModifyMainPage', 'OthersFilesCopy', cb);
});


gulp.task('sass', function(done) {
    gulp.src('./scss/ionic.app.scss')
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(gulp.dest('./www/css/'))
        .pipe(minifyCss({
            keepSpecialComments: 0
        }))
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(gulp.dest('./www/css/'));
    gulp.src('./scss/main.scss')
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(gulp.dest('./www/css/'))
        .pipe(minifyCss({
            keepSpecialComments: 0
        }))
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(gulp.dest('./www/css/'))
        .on('end', done);
});


gulp.task('watch-comon', function(cb) {
    runSequence('CommonsMerge', 'BusinessJsMin', 'ModifyMainPage', 'ReplaceRef', cb);
});
gulp.task('watch-ctrl', function(cb) {
    runSequence('ControllersMerge', 'BusinessJsMin', 'ModifyMainPage', 'ReplaceRef', cb);
});
gulp.task('watch-template', function(cb) {
    runSequence('TemplatesCacheMerge', 'BusinessJsMin', 'ModifyMainPage', 'ReplaceRef', cb);
});
gulp.task('watch-jsLibs', function(cb) {
    runSequence('LibsJsMerge', 'BusinessJsMin', 'ModifyMainPage', 'ReplaceRef', cb);
});
gulp.task('watch-businessCss', function(cb) {
    runSequence('BusinessCssMin', 'BusinessJsMin', 'ModifyMainPage', 'ReplaceRef', cb);
});
gulp.task('watch-libsCss', function(cb) {
    runSequence('LibsCssMerge', 'BusinessJsMin', 'ModifyMainPage', 'ReplaceRef', cb);
});
gulp.task('watch-mainHtml', function(cb) {
    runSequence('ModifyMainPage', 'ReplaceRef', cb);
});

gulp.task('watch', function() {
    gulp.watch(paths.sass, ['sass'], browserSync.reload);
    /*gulp.watch(['./www/main.html'], ['watch-mainHtml'], browserSync.reload);
    gulp.watch(paths.jsLibs, ['watch-jsLibs'], browserSync.reload);
    gulp.watch(paths.common, ['watch-comon'], browserSync.reload);
    gulp.watch(paths.ctrl, ['watch-ctrl'], browserSync.reload);
    gulp.watch(['./www/css/main.css'], ['watch-businessCss'], browserSync.reload);
    gulp.watch(paths.template, ['watch-template'], browserSync.reload);
    gulp.watch(paths.cssLibs, ['watch-libsCss'], browserSync.reload);*/
});

gulp.task('install', ['git-check'], function() {
    return bower.commands.install()
        .on('log', function(data) {
            gutil.log('bower', gutil.colors.cyan(data.id), data.message);
        });
});

gulp.task('git-check', function(done) {
    if (!sh.which('git')) {
        console.log(
            '  ' + gutil.colors.red('Git is not installed.'),
            '\n  Git, the version control system, is required to download Ionic.',
            '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
            '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
        );
        process.exit(1);
    }
    done();
});

var zip = require('gulp-zip');
var replace = require('gulp-replace');
gulp.task('copy2Ios', function(done) {
    return gulp.src('./production/www/**')
        .pipe(gulp.dest('/Volumes/HDD/bestpay/打包/zipH5/src/utilities'))
        .pipe(replace('file:///android_asset', '.', {
            skipBinary: true
        }))
        // .pipe(zip('481_2.0.1.zip'))
        .pipe(gulp.dest('/Volumes/HDD/bestpay/打包/zipH5/src/utilities-ios'))

});
gulp.task('cp', function(cb) {
    runSequence('build', ['copy2Ios'], cb);
})
