(function (d3) {
	'use strict';
	/*jshint -W084 */

	var
	// merge objects
	_type = function (o) { return Object.prototype.toString.call(o).slice(8, -1).toLowerCase(); },
	_extend = function (o1, o2/*, o3...*/) {
		var len = arguments.length, o = {}, ox, p, i = 0, allow;
		for (; i < len; i++) {
			ox = arguments[i];
			// getBoundingClientRect doesn't have own properties but these should be cloned too
			allow = (_type(ox) === 'domrect');
			for (p in ox) { if (ox.hasOwnProperty(p) || allow) o[p] = ox[p]; }
		}
		return o;
	},
	/**
	 * (private) Helper function. Formats label
	 * @param   {number}  v  value
	 * @param   {mixed}  l   label. can be string or function
	 */
	_formatLabel = function (v, l) {
		var perc = Math.round(this.config.percentScale(v)),
			val = Math.round(v),
			cur = this.config.currency(val);
		if (typeof l === 'function') return l(val, perc, cur);
		if (typeof l === 'string') return val + ' ' + l;
		return val;
	},

	defaults = {
		target: document.body,
		innerRadius: 80,
		pad: 2,
		height: null,
		startAngle: -Math.PI,
		scale: d3.scale.linear().domain([0, 100]).range([0, Math.PI * 2 * 0.75]),
		currency: d3.format('0,000'),
		colors: d3.scale.category10()
	},



	/**
	 * Radial Graph component
	 */
	Radial = function (config) {
		if (!(this instanceof Radial)) return new Radial(config);
		if (!config.target) return;
		this.config = _extend(defaults, config);
		this.data = this.config.data;

		var self = this, max = this.config.max || Math.max.apply(null, this.data) || 100;

		this.config.scale = d3.scale.linear().domain([0, max]).range([0, Math.PI * 2 * 0.75]);
		this.config.percentScale = d3.scale.linear().domain([0, max]).range([0, 100]);
		this.calcSize();

		this.svg = d3.select(this.config.target).append('svg');
		this.groups = this.svg.selectAll('g').data(this.data).enter().append('g');
		this.arc = d3.svg.arc()
			.innerRadius(function (d, i) {
				return self.config.innerRadius + self.config.stripeSize * i + self.config.pad;
			})
			.outerRadius(function (d, i) {
				return self.config.innerRadius + self.config.stripeSize * (i + 1);
			})
			.startAngle(function () { return self.config.startAngle; })
			.endAngle(function (d) { return self.config.startAngle + self.config.scale(d); });

		this.arcs = this.groups.append('path')
			.attr({
				d: this.arc,
				class: 'arc',
				fill: function (d, i) { return self.config.colors(i); }
			});

		this.labels = this.groups.append('text')
			.text(function (d, i) {
				return _formatLabel.call(self, d, self.config.labels[i]);
			})
			.attr({
				// 'alignment-baseline': 'central',	// doesn't work for some reason
				'text-anchor': 'start',
				fill: function (d, i) { return self.config.colors(i); },
				x: 5
			});


		return this.draw();
	};



	/**
	 * Calculate graph size, bars thickness, etc.
	 * @param   {object}  size   [optional] { width, height }
	 */
	Radial.prototype.calcSize = function (size) {
		var oldH = this.size ? this.size.height : 0;
		// get dimensions and position
		this.size = _extend(this.size || {}, this.config.target.getBoundingClientRect());
		if (this.config.height) this.size = _extend(this.size, { height: this.config.height });
		this.size = _extend(this.size, size || {});

		if (oldH && oldH === this.size.height) return this;
		if (oldH) {
			console.log(oldH, this.size.height, this.config.innerRadius);
			this.config.innerRadius = this.config.innerRadius * this.size.height / oldH;
		}

		var len = this.data.length, half;
		this.config.stripeSize = (this.size.height / 2 - this.config.innerRadius) / len;

		half = this.config.innerRadius + this.data.length * this.config.stripeSize;
		this.size.mid = [ half, half ];

		return this;
	};


	/**
	 * Set/update sizes & dimensions
	 * @param   {object}  size   [optional] { width, height }
	 */
	Radial.prototype.draw = function (size) {
		var self = this;

		this.calcSize(size);

		this.svg.attr({ width: this.size.width, height: this.size.height });
		this.groups.attr('transform', 'translate(' + self.size.mid + ')');
		this.arc
			.innerRadius(function (d, i) {
				return self.config.innerRadius + self.config.stripeSize * i + self.config.pad;
			})
			.outerRadius(function (d, i) {
				return self.config.innerRadius + self.config.stripeSize * (i + 1);
			});

		this.labels.attr({
				'font-size': self.config.stripeSize - 2,
				y: function (d, i) {
					var off = this.getBBox().height - self.config.stripeSize + 2;
					return self.config.innerRadius + self.config.stripeSize * (i + 1) - off;
				}
			});
		return this.update();
	};


	/**
	 * Update series values
	 * @param   {array}  data  array of values (int)
	 */
	Radial.prototype.update = function (data) {
		var self = this, oldData = this.data;
		if (_type(data) === 'array') this.data = data;

		this.arcs
			.data(this.data)
			.transition()
			.duration(1000)
			.attrTween('d', function (d, i) {
				var inter = d3.interpolateNumber(oldData[i], d);
				return function (t) { return self.arc(inter(t), i); };
			});

		this.labels
			.data(this.data)
			.transition()
			.duration(1000)
			.tween('text', function (d, i) {
				var inter = d3.interpolate(oldData[i], d);
				return function (t) {
					this.textContent = _formatLabel.call(self, inter(t), self.config.labels[i]);
				};
			});
		return this;
	};



	window.Radial = Radial;

}(window.d3));
