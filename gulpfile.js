/*
 *	Created by Trevor Sears <trevorsears.main@gmail.com>.
 *	8:48 PM -- June 16th, 2019.
 *	Website: <name>
 */

const gulp =		require("gulp");
const sourcemaps =	require("gulp-sourcemaps");
const typescript =	require("gulp-typescript");
const webpack =		require("webpack");
const uglify =		require("gulp-uglify-es").default;
const sass =		require("gulp-sass");
const cleanCSS =	require("gulp-clean-css");
const imagemin =	require("gulp-imagemin");
const htmlmin =		require("gulp-htmlmin");
const webserver =	require("gulp-webserver");
const del =			require("del");
const path =		require("path");

let paths = {
	
	distDir: "../dist/",
	
	nodeModules: {
		
		dir: "node_modules/",
		allFiles: "node_modules/**/*",
		symlink: "../dist/node_modules/"
		
	},
	
	typescript: {
		
		dir: "ts/",
		allFiles: "ts/**/*.ts",
		tsconfig: "ts/tsconfig.json"
		
	},
	
	javascript: {
		
		dir: "../dist/js",
		allFiles: "../dist/js/**/*.js",
		entryPoint: "../dist/js/main.js",
		entryPointFileName: "main.js",
		bundleFile: "../dist/js/bundle.js",
		bundleFileName: "bundle.js"
		
	},
	
	styles: {
		
		css: {
			
			dir: "../dist/styles/",
			cssFiles: "../dist/styles/**/*.css",
			mapFiles: "../dist/styles/**/*.css.map",
			allFiles: "../dist/styles/**/*.css*"
			
		},
		
		scss: {
			
			dir: "styles/",
			allFiles: "styles/**/*.scss",
			cache: "styles/.sass-cache/"
			
		}
		
	},
	
	config: {
		
		srcDir: "config/",
		srcFiles: "config/**/*",
		distDir: "../dist/config/",
		distFiles: "../dist/config/**/*"
		
	},
	
	fonts: {
		
		srcDir: "fonts/",
		srcFiles: "fonts/**/*",
		distDir: "../dist/fonts/",
		distFiles: "../dist/fonts/**/*"
		
	},
	
	images: {
		
		srcDir: "img/",
		srcFiles: "img/**/*",
		distDir: "../dist/img/",
		distFiles: "../dist/img/**/*"
		
	},
	
	html: {
		
		srcDir: ".",
		srcFiles: "./*.html",
		distDir: "../dist/",
		distFiles: "../dist/*.html"
		
	}
	
};
let webpackConfig = {
	
	mode: "development",
	
	entry: "../dist/js/main.js",
	
	devtool: "source-map",
	
	output: {
		
		path: path.resolve(paths.javascript.dir),
		filename: "bundle.js"
		
	},
	
	module: {
		
		rules : [
			
			{
				
				test: /\.js$/,
				exclude: /node_modules/,
				use: ['babel-loader']
				
			}
		
		]
		
	},
	
	plugins: []
	
};
let typescriptProject = typescript.createProject(paths.typescript.tsconfig);
let verbose = false;
let devServerPort = 3200;

// Gulp tasks.

	// The default Gulp task.
	gulp.task("default", defaultTask);
	
	// Cleans (deletes) all generated/compiled files.
	gulp.task("clean", cleanAll);
	
	// Cleans (deletes) all distribution JavaScript files.
	gulp.task("clean-js", cleanJavaScriptFiles);
	
	// Cleans (deletes) all distribution styling files.
	gulp.task("clean-styles", cleanStyles);

	// Cleans (deletes) all miscellaneous distribution files.
	gulp.task("clean-misc", cleanMiscFiles);
	
	// Builds the entire project.
	gulp.task("build", build);
	
	// Cleans and builds the entire project.
	gulp.task("rebuild", rebuild);
	
	// Compile/build through the entire pipeline from TypeScript files to a browser-ready bundle.
	gulp.task("build-js", buildJavaScriptPipeline);
	
	// Compile/build all relevant stylesheets.
	gulp.task("build-styles", buildStylesPipeline);
	
	// Compile/build all other miscellaneous files.
	gulp.task("build-misc", miscOpsPipeline);
	
	// Watch for changes to relevant files and compile-on-change.
	gulp.task("watch", watch);
	
	// Start a development HTTP webserver.
	gulp.task("server", server);
	
// Overarching compile/build functions.

	function defaultTask(done) {
		
		return rebuild(done);
		
	}
	
	function cleanAll(done) {
		
		return del([
			paths.distDir,
			paths.styles.scss.cache
		],{ force: true });
		
	}
	
	function build(done) {
		
		gulp.parallel(
			buildJavaScriptPipeline,
			buildStylesPipeline,
			miscOpsPipeline
		)(done);
		
	}
	
	function rebuild(done) {
		
		gulp.series(cleanAll, build)(done);
		
	}
	
// JavaScript/TypeScript functions.
	
	function buildJavaScriptPipeline(done) {
		
		return gulp.series(
			gulp.parallel(
				cleanJavaScriptFiles,
				symlinkNodeModules
			),
			compileTypeScript,
			transpileJavaScript,
			gulp.parallel(
				removeNonBundleFiles,
				uglifyJavaScript
			)
		)(done);
		
	}
	
	function cleanJavaScriptFiles(done) {
		
		return del([
			paths.javascript.allFiles
		], { force: true });
		
	}
	
	function symlinkNodeModules(done) {
		
		return gulp.src(paths.nodeModules.dir)
			.pipe(gulp.symlink(paths.nodeModules.symlink));
		
	}
	
	function compileTypeScript(done) {
		
		return typescriptProject.src()
			.pipe(sourcemaps.init())
			.pipe(typescriptProject()).js
			.pipe(sourcemaps.write("."))
			.pipe(gulp.dest(paths.javascript.dir));
		
	}
	
	function transpileJavaScript(done) {
		
		return new Promise(resolve => webpack(webpackConfig, (err, stats) => {
			
			if (err) console.log('Webpack', err);
			
			resolve();
			
		}))
		
	}
	
	function removeNonBundleFiles(done) {
		
		return del([
			paths.javascript.dir + "/**",
			"!" + paths.javascript.dir,
			"!" + paths.javascript.bundleFile
		],{ force: true });
		
	}
	
	function uglifyJavaScript(done) {
		
		return gulp.src(paths.javascript.bundleFile)
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(uglify())
			.pipe(sourcemaps.write("."))
			.pipe(gulp.dest(paths.javascript.dir));
		
	}

// Stylesheet functions.
	
	function buildStylesPipeline(done){
		
		return gulp.series(
			cleanStyles,
			compileSCSS,
			minifyCSS
		)(done);
		
	}
	
	function cleanStyles(done) {
		
		return del([
			paths.styles.css.allFiles
		], { force: true });
		
	}
	
	function compileSCSS(done) {
		
		return gulp.src(paths.styles.scss.allFiles)
			.pipe(sourcemaps.init())
			.pipe(sass.sync().on("error", sass.logError))
			.pipe(sourcemaps.write("."))
			.pipe(gulp.dest(paths.styles.css.dir));
		
	}
	
	function minifyCSS(done) {
		
		return gulp.src(paths.styles.css.cssFiles)
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(cleanCSS())
			.pipe(sourcemaps.write("."))
			.pipe(gulp.dest(paths.styles.css.dir));
		
	}
	
// Various minification and copying functions.

	function miscOpsPipeline(done) {
		
		return gulp.series(
			cleanMiscFiles,
			gulp.parallel(
				minifyHTML,
				minifyImages,
				copyFontFiles,
				copyConfigFiles
			)
		)(done);
		
	}
	
	function cleanMiscFiles(done) {
		
		return del([
			paths.images.distFiles,
			paths.html.distFiles,
			paths.config.distFiles,
			paths.fonts.distFiles
		], { force: true });
		
	}
	
	function minifyImages(done) {
		
		return gulp.src(paths.images.srcFiles)
			.pipe(imagemin([
				imagemin.svgo({
					plugins: [ {removeViewBox: false} ]
				})
			]))
			.pipe(gulp.dest(paths.images.distDir));
		
	}
	
	function minifyHTML(done) {
		
		return gulp.src(paths.html.srcFiles)
			.pipe(htmlmin({
				collapseInlineTagWhitespace: true,
				collapseWhitespace: true,
				removeComments: true
			}))
			.pipe(gulp.dest(paths.html.distDir));
	
	}
	
	function copyConfigFiles(done) {
		
		return gulp.src(paths.config.srcFiles)
			.pipe(gulp.dest(paths.config.distDir));
	
	}
	
	function copyFontFiles(done) {
		
		return gulp.src(paths.fonts.srcFiles)
			.pipe(gulp.dest(paths.fonts.distDir));
	
	}

// Watch functions.

	function watch(done) {
		
		gulp.parallel(watchConfig, watchFonts, watchImages, watchSCSS, watchTypeScript, watchHTML)(done);
		
	}
	
	function watchConfig(done) {
		
		gulp.watch([paths.config.srcFiles], copyConfigFiles);
		
	}
	
	function watchFonts(done) {
		
		gulp.watch([paths.fonts.srcFiles], copyFontFiles);
		
	}
	
	function watchImages(done) {
		
		gulp.watch([paths.images.srcFiles], minifyImages);
		
	}
	
	function watchSCSS(done) {
		
		gulp.watch([paths.styles.scss.allFiles], buildStylesPipeline);
		
	}
	
	function watchTypeScript(done) {
		
		gulp.watch([paths.typescript.allFiles], buildJavaScriptPipeline);
		
	}
	
	function watchHTML(done) {
		
		gulp.watch([paths.html.srcFiles], minifyHTML);
		
	}

// Development commands.

	function server(done) {
		
		let port = devServerPort;
		
		gulp.src(paths.distDir)
		.pipe(webserver({
			host: "0.0.0.0",
			port,
			// livereload: true,
			directoryListing: true,
			open: "http://localhost:" + port + "/index.html"
		}));
		
	}