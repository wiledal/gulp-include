var gutil		= require("gulp-util"),
	should		= require("should")
	include		= require("../"),
	fs			= require("fs");


// TEST DESCRIPTIONS
describe("gulp-include", function() {
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
});