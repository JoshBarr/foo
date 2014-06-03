module.exports = function(grunt) {
    var pkg = grunt.file.readJSON('package.json');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                // define a string to put between each file in the concatenated output
                separator: ';'
            },
            dist: {
                // the files to concatenate
                src: [
                    'bower_components/nunjucks/browser/nunjucks-slim.min.js',
                    // 'bower_components/lodash/dist/lodash.min.js',
                    // 'bower_components/conduitjs/lib/conduit.min.js',
                    // 'bower_components/postal.js/lib/postal.min.js',
                    'bower_components/pubsub-js/src/pubsub.js',
                    'build/app.js'
                ],
                // the location of the resulting JS file
                dest: 'www/js/app.js'
            }
        },

        nunjucks: {
            precompile: {
                baseDir: 'app/templates/browser',
                src: 'app/templates/browser/*',
                dest: 'build/templates.js',
                options: {
                    // env: require('./app/lib/nunjucks/nunjucks'),
                    name: function(filename) {
                        return filename.replace(/\.j2$/, "");
                    }
                }
            }
        },

        browserify: {
            application: {
                files: {
                    'build/app.js': [
                        'app/components/**/*.js',
                        'app/app.js'
                    ]
                }
            }
        },

        watch: {
            js: {
                options: {
                    nospawn: true,
                    livereload: true
                },
                files: [
                    "app/**/*.js",
                    "templates/client/**/*.j2"
                ],
                tasks: [
                    "js"
                ]
            },
            sass: {
                options: {
                    nospawn: true,
                    livereload: true
                },
                files: [
                    "sass/**/*.scss"
                ],
                tasks: [
                    "sass"
                ]
            }
        },

        clean: {
            js: "build"
        },

        sass: {
            dev: {
                files: {
                    "www/css/app.css": "sass/app.scss",
                },
                options: {
                    sourceComments: 'map'
                }
            }
        },

        nodemon: {
            dev: {
                script: 'app.js',
                options: {
                    cwd: __dirname,
                    ignore: [
                        'node_modules/**',
                        'bower_components/**'
                    ],
                    ext: 'js,json'
                }
            }
        }

    });

    /**
     * The cool way to load your grunt tasks
     * --------------------------------------------------------------------
     */
    Object.keys( pkg.devDependencies ).forEach( function( dep ){
        if( dep.substring( 0, 6 ) === 'grunt-' ) grunt.loadNpmTasks( dep );
    });


    grunt.registerTask("default", [
        "nodemon"
    ]);

    grunt.registerTask("js", [
        "browserify",
        "nunjucks",
        "concat",
        "clean:js"
    ]);
};