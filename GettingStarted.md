This tutorial introduces the process of making a web page like the live demo at the [Project Home](http://code.google.com/p/closure-draw/).

# Step1: Download the Closure Draw #

Download the Closure Draw from the Subversion repository by executing the following command from the command line:

```
svn checkout http://closure-draw.googlecode.com/svn/trunk/ closure-draw-read-only
```

This command also downloads the Closure Library too. If you already have it, add "--ignore-externals" option.

```
svn checkout --ignore-externals http://closure-draw.googlecode.com/svn/trunk/ closure-draw-read-only
```

# Step2: Create an HTML file #

Save the following HTML in a file called tutorial.html. Place this file in the closure-draw-read-only directory.

```
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <link rel="stylesheet" type="text/css" href="closure-library/closure/goog/css/common.css">
    <link rel="stylesheet" type="text/css" href="closure-library/closure/goog/css/toolbar.css">
    <link rel="stylesheet" type="text/css" href="closure-library/closure/goog/css/menu.css">
    <link rel="stylesheet" type="text/css" href="closure-library/closure/goog/css/menubutton.css">
    <link rel="stylesheet" type="text/css" href="closure-library/closure/goog/css/menuitem.css">
    <link rel="stylesheet" type="text/css" href="closure-library/closure/goog/css/menuseparator.css">
    <link rel="stylesheet" type="text/css" href="closure-library/closure/goog/css/colormenubutton.css">
    <link rel="stylesheet" type="text/css" href="closure-library/closure/goog/css/colorpicker-simplegrid.css">
    <link rel="stylesheet" type="text/css" href="closure-draw/lib/demos/css/closure-draw.css">
    <style type="text/css">
      #canvas { border:solid 1px black; width:514px; }
    </style>
    <script type="text/javascript" src="closure-library/closure/goog/base.js"></script>
    <script type="text/javascript" src="closure-draw/lib/deps.js"></script>
    <script type="text/javascript" src="tutorial.js"></script>
  </head>
  <body onload="initialize();">
    <div id="canvas" class="goog-inline-block"></div>
  </body>
</html>
```

# Step3: Create a JavaScript file #

Save the following JavaScript in a file called tutorial.js. Place this file in the closure-draw-read-only directory.

```
goog.require('closuredraw');

function initialize() {
  // Create a widget (the arguments are the size of the drawing area).
  var canvas = new closuredraw.Widget(512, 512);

  // Add it to the document tree.
  canvas.render(goog.dom.$('canvas'));
}

// This line prevents the name "initialize" from shortening by Closure Compiler.
goog.exportSymbol('initialize', initialize, window);
```

Open the HTML file in a browser. You should see a Closure Draw widget and can draw diagrams.

![http://closure-draw.googlecode.com/svn/wiki/images/tutorial1.png](http://closure-draw.googlecode.com/svn/wiki/images/tutorial1.png)

# Step4: Add a save button #

You can export shapes in SVG format by calling exportSVG method of the widget. Modify tutorial.js as following.

```
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('closuredraw');

function initialize() {
  var canvas = new closuredraw.Widget(512, 512);
  canvas.render(goog.dom.$('canvas'));

  // create a button and add it to the toolbar on the widget.
  var toolbar = canvas.getToolbar();
  var saveBtn = new goog.ui.ToolbarButton("Save");
  toolbar.addChildAt(saveBtn, 0, true);
  toolbar.addChildAt(new goog.ui.ToolbarSeparator(), 1, true);

  // respond to click the save button.
  goog.events.listen(saveBtn, goog.ui.Component.EventType.ACTION, function(e) {
    var svg = canvas.exportSVG();
    var url = goog.string.urlEncode(goog.dom.xml.serialize(svg));
    window.open('data:image/svg+xml;charset=UTF-8,' + url, null);
  });
}
goog.exportSymbol('initialize', initialize, window);
```

You can also import the SVG by calling importSVG method. See [import-test demo](http://closure-draw.googlecode.com/svn/trunk/closure-draw/lib/demos/import-test-min.html) in the repository for detail.

**Note:** The save button doesn't work on IE since it still doesn't support SVG and data scheme.

# Complete! #

Open the HTML file in a browser again. If you click the save button after drawing some shapes, you shoud see the image in a new window (or a new tab).

![http://closure-draw.googlecode.com/svn/wiki/images/tutorial2.png](http://closure-draw.googlecode.com/svn/wiki/images/tutorial2.png)