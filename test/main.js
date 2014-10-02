var gutil = require("gulp-util"),
    should = require("should"),
    include = require("../index"),
    fs = require("fs"),
    vm = require('vm');


// TEST DESCRIPTIONS
describe("gulp-include", function () {

    describe("directive matching", function () {
        // Load the module indirectly, so that we can access
        // the DIRECTIVE_REGEX
        exports = {};
        include_module = {
            require: require,
            console: console,
            exports: exports,
            module: {
                exports: exports
            }
        }
        vm.runInNewContext(fs.readFileSync('index.js'), include_module)

        beforeEach(function (done) {
            include_module.DIRECTIVE_REGEX.lastIndex = 0
            done()
        })

        it("should match require", function () {
            matches = include_module.DIRECTIVE_REGEX.exec("= require src/blah.js")
            should.exist(matches)
            matches[0].should.eql('= require src/blah.js')
            matches[1].should.eql('require')
            matches[2].should.eql('src/blah.js')
        })

        it("should match require_tree", function () {
            matches = include_module.DIRECTIVE_REGEX.exec("= require_tree src")
            should.exist(matches)
            matches[0].should.eql('= require_tree src')
            matches[1].should.eql('require_tree')
            matches[2].should.eql('src')
        })

        it("should match include", function () {
            should.exist(matches)
            matches = include_module.DIRECTIVE_REGEX.exec("= include src/blah.js")
            matches[0].should.eql('= include src/blah.js')
            matches[1].should.eql('include')
            matches[2].should.eql('src/blah.js')
        })

        it("should match include_tree", function () {
            matches = include_module.DIRECTIVE_REGEX.exec("= include_tree src")
            should.exist(matches)
            matches[0].should.eql('= include_tree src')
            matches[1].should.eql('include_tree')
            matches[2].should.eql('src')
        })

        it("should not match 'var x = require(blah)'", function () {
            matches = include_module.DIRECTIVE_REGEX.exec("var x = require('fakemod')")
            should.not.exist(matches)
        })

        it("should match relative requires", function () {
            matches = include_module.DIRECTIVE_REGEX.exec("= include ../src/blah.js")
            should.exist(matches)
            matches[0].should.eql('= include ../src/blah.js')
            matches[1].should.eql('include')
            matches[2].should.eql('../src/blah.js')
        })
    })

    describe("File replacing", function () {

        it("should replace special comments with file contents", function (done) {
            var file = new gutil.File({
                base: "test/fixtures/",
                path: "test/fixtures/app.js",
                contents: fs.readFileSync("test/fixtures/app.js")
            });

            testInclude = include();
            testInclude.on("data", function (newFile) {
                should.exist(newFile);
                should.exist(newFile.contents);

                String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/app_all_extensions.js"), "utf8"))
                done();
            });
            testInclude.write(file);
        });

        it("should only include the files with the provided SINGLE extension", function (done) {
            var file = new gutil.File({
                base: "test/fixtures/",
                path: "test/fixtures/app.js",
                contents: fs.readFileSync("test/fixtures/app.js")
            });

            testInclude = include({
                extensions: "txt"
            });
            testInclude.on("data", function (newFile) {
                should.exist(newFile);
                should.exist(newFile.contents);

                String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/app_only_txt.js"), "utf8"))
                done();
            });
            testInclude.write(file);
        });

        it("should only include the files with the provided MULTIPLE extensions", function (done) {
            var file = new gutil.File({
                base: "test/fixtures/",
                path: "test/fixtures/app.js",
                contents: fs.readFileSync("test/fixtures/app.js")
            });

            testInclude = include({
                extensions: ["txt", "js"]
            });
            testInclude.on("data", function (newFile) {
                should.exist(newFile);
                should.exist(newFile.contents);

                String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/app_multiple_extensions.js"), "utf8"))
                done();
            });
            testInclude.write(file);
        });

        it("should include files with a relative path", function (done) {
            var file = new gutil.File({
                base: "test/fixtures/relative/",
                path: "test/fixtures/relative/app.js",
                contents: fs.readFileSync("test/fixtures/relative/app.js")
            });


            testInclude = include({
                extensions: ['js']
            })
            testInclude.on("data", function (newFile) {
                should.exist(newFile)
                should.exist(newFile.contents)

                String(newFile.contents).should.equal(String(fs.readFileSync('test/expected/relative.js'), "utf8"))
                done()
            })
            testInclude.write(file)
        })

        it("Should work on recursive includes", function (done) {
            var file = new gutil.File({
                base: "test/fixtures/",
                path: "test/fixtures/app_recursive.js",
                contents: fs.readFileSync("test/fixtures/app_recursive.js")
            });


            testInclude = include({
                extensions: ['js']
            })
            testInclude.on("data", function (newFile) {
                should.exist(newFile)
                should.exist(newFile.contents)

                String(newFile.contents).should.equal(String(fs.readFileSync('test/expected/app_recursive.js'), "utf8"))
                done()
            })
            testInclude.write(file)
        })

        it("Should work on glob includes", function (done) {
            var file = new gutil.File({
                base: "test/fixtures/globs/",
                path: "test/fixtures/globs/app.js",
                contents: fs.readFileSync("test/fixtures/globs/app.js")
            });


            testInclude = include({
                extensions: ['js']
            })
            testInclude.on("data", function (newFile) {
                should.exist(newFile)
                should.exist(newFile.contents)

                String(newFile.contents).should.equal(String(fs.readFileSync('test/expected/app_globs.js'), "utf8"))
                done()
            });
            testInclude.write(file)
        })

        it("Should match leading whitespace", function (done) {
            var file = new gutil.File({
                base: "test/fixtures/whitespace/",
                path: "test/fixtures/whitespace/a.js",
                contents: fs.readFileSync("test/fixtures/whitespace/a.js")
            });


            var testInclude = include({
                extensions: 'js'
            })
            testInclude.on("data", function (newFile) {
                should.exist(newFile)
                should.exist(newFile.contents)

                String(newFile.contents).should.equal(String(fs.readFileSync('test/expected/whitespace.js'), "utf8"))
                done()
            });
            testInclude.write(file)
        })
        
        it("Should retain origin file's leading whitespace", function (done) {
            var file = new gutil.File({
                base: "test/fixtures/whitespace/",
                path: "test/fixtures/whitespace/a_origin.js",
                contents: fs.readFileSync("test/fixtures/whitespace/a_origin.js")
            });


            var testInclude = include({
                extensions: 'js'
            })
            testInclude.on("data", function (newFile) {
                should.exist(newFile)
                should.exist(newFile.contents)

                String(newFile.contents).should.equal(String(fs.readFileSync('test/expected/whitespace_origin.js'), "utf8"))
                done()
            });
            testInclude.write(file)
        })

        it("Should work with css files", function (done) {
            var file = new gutil.File({
                base: "test/fixtures/styles/",
                path: "test/fixtures/styles/a.css",
                contents: fs.readFileSync("test/fixtures/styles/a.css")
            });


            var testInclude = include();
            testInclude.on("data", function (newFile) {
                should.exist(newFile)
                should.exist(newFile.contents)

                String(newFile.contents).should.equal(String(fs.readFileSync('test/expected/styles.css'), "utf8"))
                done()
            });
            testInclude.write(file)
        })

    })
});