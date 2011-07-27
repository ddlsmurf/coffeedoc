(function() {
  /*
  Documentation functions
  =======================
  These functions extract relevant documentation info from AST nodes as
  returned by the coffeescript parser.
  */  var coffeescript, documentClass, documentFunction, getClasses, getFunctions, getNodes, removeLeadingWhitespace;
  coffeescript = require('coffee-script');
  exports.documentModule = function(script) {
    /*
        Given a module's source code, returns module information in the form:
    
            {
                "docstring": "Module docstring",
                "classes": [class1, class1...],
                "functions": [func1, func2...]
            }
        */    var c, doc, docstring, f, first_obj, nodes;
    nodes = getNodes(script);
    first_obj = nodes[0];
    if ((first_obj != null ? first_obj.type : void 0) === 'Comment') {
      docstring = removeLeadingWhitespace(first_obj.comment);
    } else {
      docstring = null;
    }
    doc = {
      docstring: docstring,
      classes: (function() {
        var _i, _len, _ref, _results;
        _ref = getClasses(nodes);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          _results.push(documentClass(c));
        }
        return _results;
      })(),
      functions: (function() {
        var _i, _len, _ref, _results;
        _ref = getFunctions(nodes);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          f = _ref[_i];
          _results.push(documentFunction(f));
        }
        return _results;
      })()
    };
    return doc;
  };
  getNodes = function(script) {
    /*
        Generates the AST from coffeescript source code.  Adds a 'type' attribute
        to each node containing the name of the node's constructor, and returns
        the expressions array
        */    var root_node;
    root_node = coffeescript.nodes(script);
    root_node.traverseChildren(false, function(node) {
      return node.type = node.constructor.name;
    });
    return root_node.expressions;
  };
  getClasses = function(nodes) {
    /*
        Returns all top-level class nodes from the AST as returned by
        getNodeTypes
        */    var n, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      n = nodes[_i];
      if (n.type === 'Class' || n.type === 'Assign' && n.value.type === 'Class') {
        _results.push(n);
      }
    }
    return _results;
  };
  getFunctions = function(nodes) {
    /*
        Returns all top-level named function nodes from the AST as returned by
        getNodeTypes
        */    var n, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      n = nodes[_i];
      if (n.type === 'Assign' && n.value.type === 'Code') {
        _results.push(n);
      }
    }
    return _results;
  };
  documentClass = function(cls) {
    /*
        Evaluates a class object as returned by the coffeescript parser,
        returning an object of the form:
        
            {
                "name": "MyClass",
                "docstring": "First comment following the class definition"
                "parent": "MySuperClass",
                "methods": [method1, method2...]
            }
        */    var doc, docstring, first_obj, m, methods, n, _ref;
    if (cls.type === 'Assign') {
      cls = cls.value;
    }
    first_obj = cls.body.expressions[0].base.objects[0];
    if ((first_obj != null ? first_obj.type : void 0) === 'Comment') {
      docstring = removeLeadingWhitespace(first_obj.comment);
    } else {
      docstring = null;
    }
    methods = (function() {
      var _i, _len, _ref, _results;
      _ref = cls.body.expressions[0].base.objects;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        n = _ref[_i];
        if (n.type === 'Assign' && n.value.type === 'Code') {
          _results.push(n);
        }
      }
      return _results;
    })();
    doc = {
      name: cls.variable.base.value,
      docstring: docstring,
      parent: ((_ref = cls.parent) != null ? _ref.base.value : void 0) || null,
      methods: (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = methods.length; _i < _len; _i++) {
          m = methods[_i];
          _results.push(documentFunction(m));
        }
        return _results;
      })()
    };
    return doc;
  };
  documentFunction = function(func) {
    /*
        Evaluates a function object as returned by the coffeescript parser,
        returning an object of the form:
        
            {
                "name": "myFunc",
                "docstring": "First comment following the function definition",
                "params": ["param1", "param2"...]
            }
        */    var doc, docstring, first_obj, func_name, p, params, prop, properties;
    func_name = func.variable.base.value;
    properties = func.variable.properties;
    if (properties.length > 0) {
      func_name += '.' + ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = properties.length; _i < _len; _i++) {
          prop = properties[_i];
          _results.push(prop.name.value);
        }
        return _results;
      })()).join('.');
    }
    first_obj = func.value.body.expressions[0];
    if (first_obj != null ? first_obj.comment : void 0) {
      docstring = removeLeadingWhitespace(first_obj.comment);
    } else {
      docstring = null;
    }
    if (func.value.params) {
      params = (function() {
        var _i, _len, _ref, _results;
        _ref = func.value.params;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          _results.push(p.splat ? p.name.value + '...' : p.name.value);
        }
        return _results;
      })();
    } else {
      params = [];
    }
    return doc = {
      name: func_name,
      docstring: docstring,
      params: params
    };
  };
  removeLeadingWhitespace = function(str) {
    /*
        Given a string, returns it with leading whitespace removed but with
        indentation preserved
        */    var char, indentation, leading_whitespace, line, lines, _i, _len, _ref;
    lines = str.split('\n');
    while (/^ *$/.test(lines[0])) {
      lines.shift();
    }
    if (lines.length === 0) {
      return null;
    }
    indentation = 0;
    _ref = lines[0];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      char = _ref[_i];
      if (char === ' ') {
        indentation += 1;
      } else {
        break;
      }
    }
    leading_whitespace = new RegExp("^ {" + indentation + "}");
    return ((function() {
      var _j, _len2, _results;
      _results = [];
      for (_j = 0, _len2 = lines.length; _j < _len2; _j++) {
        line = lines[_j];
        _results.push(line.replace(leading_whitespace, ''));
      }
      return _results;
    })()).join('\n');
  };
}).call(this);