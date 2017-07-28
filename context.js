/*
 * Context.js
 * Copyright Jacob Kelley
 * MIT License
 *
 * Modified by Joshua Christman
 * Further modified by Brett Neese + Mike Naughton, HBK Engineering
 */

context = (function() {
	var $context;
	var menuData;
	var uniqueGenerator = 0;

	var options = {
		fadeSpeed: 100,
		filter: function($obj) {
			// Modify $obj, Do not return
		},
		above: 'auto',
		left: 'auto',
		preventDoubleContext: true,
		compress: false,
		elementId: 'dropdown-menu-contextjs'
	},
	selectorToDropdownIdRefs = {};

	function uniqueId($selector){
		if(!$selector.attr('id')){
			$selector.attr('id', 'cm-' + uniqueGenerator++);
		}

		return $selector.attr('id');
	}

	function initialize(opts) {
		options = $.extend({}, options, opts);

		$(document).on('click', function() {
			$('.dropdown-context').fadeOut(options.fadeSpeed, function() {
				$('.dropdown-context').css({
					display: ''
				}).find('.drop-left').removeClass('drop-left');
			});
		});
		if (options.preventDoubleContext) {
			$(document).on('contextmenu', '.dropdown-context', function(e) {
				e.preventDefault();
			});
		}
		$(document).on('mouseenter', '.dropdown-submenu', function() {
			var $sub = $(this).find('.dropdown-context-sub:first'),
				subWidth = $sub.width(),
				subLeft = $sub.offset().left,
				collision = (subWidth + subLeft) > window.innerWidth;
			if (collision) {
				$sub.addClass('drop-left');
			}
		});

		menuData = {};

	}

	function updateOptions(opts) {
		options = $.extend({}, options, opts);
	}

	function buildMenu(data, id, subMenu) {
		var subClass = (subMenu) ? ' dropdown-context-sub' : '',
			compressed = options.compress ? ' compressed-context' : '',
			$menu = $('<ul class="dropdown-menu dropdown-context' + subClass + compressed + '" id="' + options.elementId + '"></ul>');
			return buildMenuItems($menu, data, id, subMenu);
	}

	function buildMenuItems($menu, data, id, subMenu, addDynamicTag) {
		var linkTarget = '';
		for (var i = 0; i < data.length; i++) {
			if (typeof data[i].divider !== 'undefined') {
				var divider = '<li class="divider';
				divider += (addDynamicTag) ? ' dynamic-menu-item' : '';
				divider += '"></li>';
				$menu.append(divider);
			} else if (typeof data[i].header !== 'undefined') {
				var header = '<li class="nav-header';
				header += (addDynamicTag) ? ' dynamic-menu-item' : '';
				header += '">' + data[i].header + '</li>';
				$menu.append(header);
			} else if (typeof data[i].menu_item_src !== 'undefined') {
				var funcName;
				if (typeof data[i].menu_item_src === 'function') {
					if (data[i].menu_item_src.name === "") { // The function is declared like "foo = function() {}"
						for (var globalVar in window) {
							if (data[i].menu_item_src == window[globalVar]) {
								funcName = globalVar;
								break;
							}
						}
					} else {
						funcName = data[i].menu_item_src.name;
					}
				} else {
					funcName = data[i].menu_item_src;
				}
				$menu.append('<li class="dynamic-menu-src" data-src="' + funcName + '"></li>');
			} else {
				if (typeof data[i].href == 'undefined') {
					data[i].href = '#';
				}
				if (typeof data[i].target !== 'undefined') {
					linkTarget = ' target="' + data[i].target + '"';
				}
				if (typeof data[i].subMenu !== 'undefined') {
					var sub_menu = '<li class="dropdown-submenu';
					sub_menu += (addDynamicTag) ? ' dynamic-menu-item' : '';
					sub_menu += '"><a tabindex="-1" href="' + data[i].href + '">' + data[i].text + '</a></li>'
					$sub = (sub_menu);
				} else {
					var element = '<li';
					element += (addDynamicTag) ? ' class="dynamic-menu-item"' : '';
					element += '><a tabindex="-1" href="' + data[i].href + '"' + linkTarget + '>';
					if (typeof data[i].icon !== 'undefined')
						element += '<span class="glyphicon ' + data[i].icon + '"></span> ';
					element += data[i].text + '</a></li>';
					$sub = $(element);
				}
				if (typeof data[i].action !== 'undefined') {
					$action = data[i].action;
					$sub
						.find('a')
						.addClass('context-event')
						.on('click', createCallback($action));
				}
				
				$menu.append($sub);
				if (typeof data[i].subMenu != 'undefined') {
					var subMenuData = buildMenu(data[i].subMenu, id, true);
					$menu.find('li:last').append(subMenuData);
				}
			}
			if (typeof options.filter == 'function') {
				options.filter($menu.find('li:last'));
			}
		}
		return $menu;
	}

	function _contextHandler(e, id) {
		e.preventDefault();
		e.stopPropagation();

		if(e._contextHandled){
			return;
		}

		e._contextHandled = true;
		
		var menuItems = getMenuData(id);
		currentContextSelector = $(e.target);

		$('.dropdown-context:not(.dropdown-context-sub)').hide();
		$dd = buildMenu(menuItems, id, undefined);
		
		if (typeof options.above == 'boolean' && options.above) {
			$dd.addClass('dropdown-context-up').css({
				top: e.pageY - 20 - $('#dropdown-' + id).height(),
				left: e.pageX - 13
			}).fadeIn(options.fadeSpeed);
		} else if (typeof options.above == 'string' && options.above == 'auto') {
			$dd.removeClass('dropdown-context-up');
			var autoH = $dd.height() + 30;
			if ((e.pageY + autoH - $(window).scrollTop()) > $(window).height()) {
				$dd.addClass('dropdown-context-up').css({
					top: e.pageY - 20 - autoH,
					left: e.pageX - 13
				}).fadeIn(options.fadeSpeed);
			} else {
				$dd.css({
					top: e.pageY + 10,
					left: e.pageX - 13
				}).fadeIn(options.fadeSpeed);
			}
		}

		if (typeof options.left == 'boolean' && options.left) {
			$dd.addClass('dropdown-context-left').css({
				left: e.pageX - $dd.width()
			}).fadeIn(options.fadeSpeed);
		} else if (typeof options.left == 'string' && options.left == 'auto') {
			$dd.removeClass('dropdown-context-left');
			var autoL = $dd.width() - 12;
			if ((e.pageX + autoL) > $('html').width()) {
				$dd.addClass('dropdown-context-left').css({
					left: e.pageX - $dd.width() + 13
				});
			}
		}

		$menu = $('#' + options.elementId);
		if (!$menu || !$menu.length) {
			$('body').append($dd);
		} else {
			$menu.replaceWith($dd)
		}
		
	}

	function _setupMenu(data, $target) {
		var id = data.id || uniqueId($target);
		var data = data.data || data;

		pushMenuData(id, data);

		return id;
	}

	function _contextHandlerWrapper(data, selector, $target) {
		var menuId;

		if(typeof selector === 'string'){
			menuId = selector;
			_setupMenu({
				id: menuId,
				data: data
			}, $target);
		} else {
			menuId = _setupMenu(data, $target);
		}

		return function(e) {
			_contextHandler(e, menuId);
		};
	}

	function addContext(selector, data) {
		var $target = $(selector);
		
		$target.on('contextmenu',
			_contextHandlerWrapper(data, selector, $target));
	}

	function addContextDelegate(el, selector, data) {
		var $el = (el instanceof jQuery) ? el : $(el);
		var $target = $el.find(selector);

		$el.on('contextmenu', selector,
			_contextHandlerWrapper(data, selector, $target));
	}

	function destroyContext(selector) {
		var $target = $(selector);

		clearMenuData(uniqueId($target));

		$(document).off('contextmenu', selector).off('click', '.context-event');
	}

	function destroyContextDelegate(el, selector) {
		var $el = (el instanceof jQuery) ? el : $(el);
		var $target = $el.find(selector);

		clearMenuData(uniqueId($target));
		$el.off('contextmenu', selector);
		$(document).off('click', '.context-event');
	}

	function pushMenuData(id, data){
		menuData[id] = data;
	}

	function getMenuData(id){
		return menuData[id];
	}

	function clearMenuData(id){
		delete menuData[id];
	}

	return {
		init: initialize,
		settings: updateOptions,
		attach: addContext,
		attachDelegate: addContextDelegate,
		destroy: destroyContext,
		destroyDelegate: destroyContextDelegate
	};
})();

var createCallback = function(func) {
	return function(event) {
		func(event, currentContextSelector)
	
	};
}

currentContextSelector = undefined;
