//= include sample.js
//= include header.txt

// =include lib/a.js
/*
  Here comes some require examples!
*/

// = does this break it?

//=include lib/a.js
//=		 include lib/b.js
//  	=  include lib/nested/c.js

var object = {};

// =require lib/a.js
//  =include lib/b.js
//=     	require		 lib/nested/c.js
// = require_tree lib/nested/deeply_nested
