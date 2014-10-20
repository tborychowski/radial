radial
======
multi-series responsive donut chart in d3

**[DEMO](http://htmlpreview.github.io/?https://raw.githubusercontent.com/tborychowski/radial/master/index.html)**

###Screenshot
![Radial](screen.png)


###Usage

```javascript
// init
var graph = new Radial({
	target: document.getElementById('canvas'),
	max: 100,
	data: [10, 20, 30],
	labels: [
		function (v, p, c) { return 'Value: ' + v; },
		function (v, p, c) { return 'Percentage: ' + p + '%'; },
		function (v, p, c) { return 'Currency: $' + c; }
	]
});

// to update series & max with animation
var newMax = 200;
graph.update([ 20, 30, 40 ], newMax);

// call this when container size changed
graph.draw();
```
