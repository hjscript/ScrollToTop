(function() {
		var root = (typeof self == 'object' && self.self == self && self) ||
			(typeof global == 'object' && global.global == global && global) ||
			this || {};
		// requestAnimationFrame 兼容到 IE6(这段兼容性的直接copy过来就行)
		var lastTime = 0;
		var vendors = ['webkit', 'moz'];
		for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
			window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || // Webkit中此取消方法的名字变了
				window[vendors[x] + 'CancelRequestAnimationFrame'];
		}

		if (!window.requestAnimationFrame) {
			window.requestAnimationFrame = function(callback, element) {
				var currTime = new Date().getTime();
				var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
				var id = window.setTimeout(function() {
					callback(currTime + timeToCall);
				}, timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			};
		}
		if (!window.cancelAnimationFrame) {
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
		}

		//(不支持IE7-8)
		Function.prototype.bind = Function.prototype.bind || function(context) {
			var _that = this;
			var args = [].slice.call(arguments, 1); //Array.prototype.slice.call(arguments, 1);

			var F = function() {};

			var FBound = function() {
				var bindAgrs = [].slice.call(arguments, 1);
				_that.apply(this instanceof F ? this : context, args.concat(bindAgrs)); //关键点
			}

			F.prototype = this.prototype;

			FBound.prototype = new F();

			return FBound;
		}

		var until = {
			extend: function(target) {
				for (var i = 0, len = arguments.length; i < len; i++) {
					for (var key in arguments[i]) {
						if (arguments[i].hasOwnProperty(key)) {
							target[key] = arguments[i][key]
						}
					}
				}
				return target;
			},
			getStyle: function(element, prop) {
				return element.currentStyle ? element.currentStyle[prop] : document.defaultView.getComputedStyle(element)[prop]
			},
			getScrollOffsets: function() {
				var w = window;
				var d = w.document;
				if (w.pageXOffset != null) {
					return {
						x: w.pageXOffset,
						y: w.pageYOffset
					}
				}
				if (d.compatMode == 'CSS1Compat') {
					return {
						x: d.document.scrollLeft,
						y: d.pageYOffset.scrollTop
					}
				}
				return {
					x: d.body.scrollLeft,
					y: d.body.scrollTop
				}
			},
			setOpacity: function(ele, opacity) {
				if (ele.style.opacity != void 0) {
					ele.style.opacity = opacity / 100;
					console.log('ele.style.opacity=>',ele.style.opacity)
				} else {
					// 兼容低版本 IE 浏览器
					ele.style.filter = "alpha(opacity=" + opacity + ")"
				}
			},
			fadeIn: function(element, speed) {
				var opacity = 0;
				var timer = null;
				until.setOpacity(element, 0);
				console.log('fadeIn=>')
				function step() {
					until.setOpacity(element, opacity += speed);
					if (opacity < 100) {
						timer = requestAnimationFrame(step)
					} else {
						cancelAnimationFrame(timer)
					}
				}
				requestAnimationFrame(step)
			},
			fadeOut: function(element, speed) {
				var opacity = 100;
				var timer = null;
				until.setOpacity(element, 100);
				console.log('fadeOut=>')
				function step() {
					until.setOpacity(element, opacity -= speed);
					if (opacity > 0) {
						timer = requestAnimationFrame(step)
					} else {
						cancelAnimationFrame(timer)
					}
				}
				requestAnimationFrame(step)
			},
			addEvent: function(ele, type, fn) { //self.handleBack.bind(self)
				if (document.addEventListener) {
					ele.addEventListener(type, fn, false)
					return fn;
				} else if (document.attachEvent) {
					var bound = function() {
						return fn.apply(ele, arguments);
					}
					ele.attachEvent('on' + type, bound);
					return bound;
				}
			},
			indexOf: function(arr, item) {
				var result = -1;
				for (var i = 0, len = arr.length; i < len; i++) {
					if (arr[i] === item) {
						result = i;
						break;
					}
				}
				return result;
			},
			addClass: function(element, className) {
				var classNames = element.className.split(/\s+/);
				if (until.indexOf(classNames, className) == -1) {
					classNames.push(className)
				}
				element.className = classNames.join('');
			},
			removeClass: function(element, className) {
				var classNames = element.className.split(/\s+/);
				var index = until.indexOf(classNames, className)
				if (index != -1) {
					classNames.splice(index, 1);
				}
				element.className = classNames.join('');
			},
			supportTouch: function() {
				return 'ontouchstart' in window ||
					window.DocumentTouch && document instanceof window.DocumentTouch
			},
			getTime: function() {
				return new Date().getTime();
			}
		}

		function ScrollToTop(element, options) {
			this.element = typeof element === "string" ? document.querySelector(element) : element;
			this.options = until.extend({}, this.constructor.defaultOptions, options);
			this.init();
		}
		ScrollToTop.defaultOptions = {
			// 默认值为 100，表示滚动条向下滑动 100px 时，出现回到顶部按钮
			showWhen: 100,
			// 回到顶部的速度。默认值为 100，数值越大，速度越快。 100 表示浏览器每次重绘，scrollTop 就减去 100px。
			speed: 100,
			// 元素淡入和淡出的速度。默认值为 10，数值越大，速度越快。 10 表示浏览器每次重绘，元素透明度以 10% 递增或者递减。
			fadeSpeed: 10
		}
		ScrollToTop.VERSION = '1.0.0';

		ScrollToTop.prototype = {
			constructor: ScrollToTop,
			init: function() {
				this.hideElement();
				this.bindScrollEvent();
				this.bindToTopEvent();
			},
			hideElement: function() {
				until.setOpacity(this.element, 0);
				this.status = "hide";
			},
			bindScrollEvent: function() {
				var self = this;
				until.addEvent(window, 'scroll', function() {
					if (until.getScrollOffsets().y > self.options.showWhen) {
						if (self.status == 'hide') {
							until.fadeIn(self.element, self.options.fadeSpeed);
							self.status = 'show';
						}
					} else {
						if (self.status == 'show') {
							until.fadeOut(self.element, self.options.fadeSpeed);
							self.status = 'hide';
						}
					}
				})
			},
			handleBack: function() {
				var timer = null,
					self = this;
				until.addClass(self.element, 'backing');
				cancelAnimationFrame(timer);
				timer = requestAnimationFrame(function fn() {
					var oTop = document.documentElement.scrollTop || document.body.scrollTop;
					if (oTop > 0) {
						document.body.scrollTop = document.documentElement.scrollTop = oTop - self.options.speed;
						timer = requestAnimationFrame(fn);
					} else {
						cancelAnimationFrame(timer);
					}
				})
			},
			bindToTopEvent: function() {
				var self = this;
				until.addEvent(self.element, 'click', self.handleBack.bind(self));
				if (until.supportTouch()) {
					until.addEvent(self.element, 'touchstart', function(e) {
						self._startX = e.touches[0].pageX;
						self._startY = e.touches[0].pageY;
						self._startTime = until.getTime();
					})
					until.addEvent(self.element, 'touchmove', function(e) {
						self._moveX = e.touches[0].pageX;
						self._moveY = e.touches[0].pageY;
					})
					until.addEvent(self.element, "touchend", function(e) {
						var endTime = until.getTime();
						if (self._moveX !== null && Math.abs(self._moveX - self.startX) > 10 ||
							self._moveY !== null && Math.abs(self._moveY - self.startY) > 10) {

						} else {
							// 手指移动的距离小于 10 像素并且手指和屏幕的接触时间要小于 500 毫秒
							if (endTime - self._startTime < 500) {
								self.handleBack()
							}
						}
					})
				}
			}
		}
		if (typeof exports != 'undefined' && !exports.nodeType) {
			if (typeof module != 'undefined' && !module.nodeType && module.exports) {
				exports = module.exports = ScrollToTop;
			}
			exports.ScrollToTop = ScrollToTop;
		} else {
			root.ScrollToTop = ScrollToTop;
		}
})()