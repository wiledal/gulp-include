var gutil		= require("gulp-util"),
	should		= require("should")
	include		= require("../"),
	fs			= require("fs");
  vm = require('vm');


// TEST DESCRIPTIONS
describe("gulp-include", function() {

  describe("directive matching", function() {
    // Load the module indirectly, so that we can access
    // the DIRECTIVE_REGEX
    exports = {}
    include_module =  {
       require: require,
       console: console,
       exports: exports,
       module: {
         exports: exports
       }
    }
    vm.runInNewContext(fs.readFileSync('index.js'), include_module)

    beforeEach(function(done){
      include_module.DIRECTIVE_REGEX.lastIndex = 0
      done()
    })

    it ("should match require", function () {
      matches = include_module.DIRECTIVE_REGEX.exec("= require src/blah.js")
      should.exist(matches)
      matches[1].should.eql('= require src/blah.js')
      matches[2].should.eql('require')
      matches[3].should.eql('src/blah.js')
    })

    it ("should match require_tree", function () {
      matches = include_module.DIRECTIVE_REGEX.exec("= require_tree src")
      should.exist(matches)
      matches[1].should.eql('= require_tree src')
      matches[2].should.eql('require_tree')
      matches[3].should.eql('src')
    })

    it ("should match include", function () {
      should.exist(matches)
      matches = include_module.DIRECTIVE_REGEX.exec("= include src/blah.js")
      matches[1].should.eql('= include src/blah.js')
      matches[2].should.eql('include')
      matches[3].should.eql('src/blah.js')
    })

    it ("should match include_tree", function () {
      matches = include_module.DIRECTIVE_REGEX.exec("= include_tree src")
      should.exist(matches)
      matches[1].should.eql('= include_tree src')
      matches[2].should.eql('include_tree')
      matches[3].should.eql('src')
    })
  
    it ("should not match 'var x = require(blah)'", function() {
      matches = include_module.DIRECTIVE_REGEX.exec("var x = require('fakemod')")
      should.not.exist(matches)
    })

    it ("should match relative requires", function() {
      matches = include_module.DIRECTIVE_REGEX.exec("= include ../src/blah.js")
      should.exist(matches)
      matches[1].should.eql('= include ../src/blah.js')
      matches[2].should.eql('include')
      matches[3].should.eql('../src/blah.js')
    })
  })


	it("should replace special comments with file contents", function(done) {
		var file = new gutil.File({
			base: "test/fixatures/",
			path: "test/fixatures/app.js",
			contents: fs.readFileSync("test/fixatures/app.js")
		});

		testInclude = include();
		testInclude.on("data", function(newFile) {
			should.exist(newFile);
			should.exist(newFile.contents);

			String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/app_all_extensions.js"), "utf8"))
			done();
		});
		testInclude.write(file);
	});

	it("should only include the files with the provided SINGLE extension", function(done) {
		var file = new gutil.File({
			base: "test/fixatures/",
			path: "test/fixatures/app.js",
			contents: fs.readFileSync("test/fixatures/app.js")
		});

		testInclude = include({
			extensions: "txt"
		});
		testInclude.on("data", function(newFile) {
			should.exist(newFile);
			should.exist(newFile.contents);

			String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/app_only_txt.js"), "utf8"))
			done();
		});
		testInclude.write(file);
	});

	it("should only include the files with the provided MULTIPLE extensions", function(done) {
		var file = new gutil.File({
			base: "test/fixatures/",
			path: "test/fixatures/app.js",
			contents: fs.readFileSync("test/fixatures/app.js")
		});

		testInclude = include({
			extensions: ["txt", "js"]
		});
		testInclude.on("data", function(newFile) {
			should.exist(newFile);
			should.exist(newFile.contents);

			String(newFile.contents).should.equal(String(fs.readFileSync("test/expected/app_multiple_extensions.js"), "utf8"))
			done();
		});
		testInclude.write(file);
	});

  it("should include files with a relative path", function(done) {
		var file = new gutil.File({
			base: "test/fixatures/relative/",
			path: "test/fixatures/relative/app.js",
			contents: fs.readFileSync("test/fixatures/relative/app.js")
		});


    testInclude = include({ extensions: ['js']})
    testInclude.on("data", function(newFile) {
      should.exist(newFile)
      should.exist(newFile.contents)

      String(newFile.contents).should.equal(String(fs.readFileSync('test/expected/relative.js'), "utf8"))
      done()
    })
    testInclude.write(file)
  })
});
