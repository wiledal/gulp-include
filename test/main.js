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

    describe("File listing", function () {

        it("should list the files from special comments", function () {
            files = include.files("test/fixtures/app.js");

            should.exist(files);

            files.should.eql([
                "test/fixtures/app.js",
                "test/fixtures/lib/nested/deeply_nested/d.js",
                "test/fixtures/lib/nested/deeply_nested/deeper/f.js",
                "test/fixtures/lib/nested/deeply_nested/deeper/nested_txt.txt",
                "test/fixtures/lib/nested/deeply_nested/deeper/nested_txt2.txt",
                "test/fixtures/lib/nested/deeply_nested/e.js",
                "test/fixtures/lib/nested/c.js",
                "test/fixtures/lib/b.js",
                "test/fixtures/lib/a.js",
                "test/fixtures/header.txt",
                "test/fixtures/sample.js"
            ]);
        });

        it("should only list the files with the provided SINGLE extension", function () {
            files = include.files("test/fixtures/app.js", {
                extensions: "txt"
            });

            should.exist(files);

            files.should.eql([
                "test/fixtures/app.js",
                "test/fixtures/lib/nested/deeply_nested/deeper/nested_txt.txt",
                "test/fixtures/lib/nested/deeply_nested/deeper/nested_txt2.txt",
                "test/fixtures/header.txt"
            ]);
        });

        it("should only include the files with the provided MULTIPLE extensions", function () {
            files = include.files("test/fixtures/app.js", {
                extensions: ["txt", "js"]
            });

            should.exist(files);

            files.should.eql([
                "test/fixtures/app.js",
                "test/fixtures/lib/nested/deeply_nested/d.js",
                "test/fixtures/lib/nested/deeply_nested/deeper/f.js",
                "test/fixtures/lib/nested/deeply_nested/deeper/nested_txt.txt",
                "test/fixtures/lib/nested/deeply_nested/deeper/nested_txt2.txt",
                "test/fixtures/lib/nested/deeply_nested/e.js",
                "test/fixtures/lib/nested/c.js",
                "test/fixtures/lib/b.js",
                "test/fixtures/lib/a.js",
                "test/fixtures/header.txt",
                "test/fixtures/sample.js"
            ]);
        });

        it("should list files with a relative path", function () {
            files = include.files("test/fixtures/relative/app.js", {
                extensions: ['js']
            });

            should.exist(files);

            files.should.eql([
                "test/fixtures/relative/app.js",
                "test/fixtures/sample.js"
            ]);
        })

        it("Should work on recursive includes", function () {
            files = include.files("test/fixtures/app_recursive.js", {
                extensions: ['js']
            });

            should.exist(files);

            files.should.eql([
                "test/fixtures/app_recursive.js",
                "test/fixtures/recursive/a.js",
                "test/fixtures/recursive/b.js",
                "test/fixtures/recursive/nested/c.js",
                "test/fixtures/recursive/nested/deeply_nested/d.js",
                "test/fixtures/recursive/nested/deeply_nested2/e.js"
            ]);
        })

        it("Should work on glob includes", function () {
            files = include.files("test/fixtures/globs/app.js", {
                extensions: ['js']
            });

            should.exist(files);

            files.should.eql([
                "test/fixtures/globs/app.js",
                "test/fixtures/globs/nested/b.js",
                "test/fixtures/globs/nested/c.js",
                "test/fixtures/globs/nested/nested_deeper/d.js",
                "test/fixtures/globs/nested/a.js"
            ]);
        })

        it("Should match leading whitespace", function () {
            files = include.files("test/fixtures/whitespace/a.js", {
                extensions: 'js'
            });

            should.exist(files);

            files.should.eql([
                "test/fixtures/whitespace/a.js",
                "test/fixtures/whitespace/d.js",
                "test/fixtures/whitespace/c.js",
                "test/fixtures/whitespace/b.js"
            ]);
        })
        
        it("Should retain origin file's leading whitespace", function () {
            files = include.files("test/fixtures/whitespace/a_origin.js", {
                extensions: 'js'
            });

            should.exist(files);

            files.should.eql([
                "test/fixtures/whitespace/a_origin.js",
                "test/fixtures/whitespace/d.js",
                "test/fixtures/whitespace/b.js"
            ]);
        })

        it("Should work with css files", function () {
            files = include.files("test/fixtures/styles/a.css");

            should.exist(files);

            files.should.eql([
                "test/fixtures/styles/a.css",
                "test/fixtures/styles/b.css"
            ]);
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
