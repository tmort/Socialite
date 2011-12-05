/*
 * Socialite v1.0
 * http://www.socialitejs.com
 * Copyright (c) 2011 David Bushell
 * Dual-licensed under the BSD or MIT licenses: http://socialitejs.com/license.txt
 */
window.Socialite = (function()
{
	var	_socialite = { },
		Socialite = { },
		/* social networks and callback functions to initialise each instance */
		networks = { },
		/* remembers which scripts have been appended */
		appended = { },
		/* a collection of URLs for external scripts */
		sources = { },
		/* remembers which network scripts have loaded */
		loaded = { },
		/* all Socialite button instances */
		cache = { };

	/* append a known script element to the document body */
	_socialite.appendScript = function(network, id)
	{
		if (typeof network !== 'string' || sources[network] === undefined || appended[network]) {
			return false;
		}
		var js = appended[network] = document.createElement('script');
		var onload = function() {
			loaded[network] = true;
			if (cache[network] !== undefined) {
				var len = cache[network].length;
				for (var i = 0; i < len; i++) {
					_socialite.onLoad(cache[network][i]);
				}
			}
		};
		if (js.addEventListener) {
			js.onload = onload;
		} else {
			onload();
		}
		js.async = true;
		js.src = sources[network];
		if (id) {
			js.id = id;
		}
		document.body.appendChild(js);
		return true;
	};

	// copy data-* attributes from one element to another
	_socialite.copyDataAtributes = function(from, to)
	{
		var i, attr = from.attributes;
		for (i = 0; i < attr.length; i++) {
			if (attr[i].name.indexOf('data-') === 0 && attr[i].value.length) {
				to.setAttribute(attr[i].name, attr[i].value);
			}
		}
	};

	// return data-* attributes from an element as a query string
	_socialite.getDataAttributes = function(from, noprefix)
	{
		var i, str = '', attr = from.attributes;
		for (i = 0; i < attr.length; i++) {
			if (attr[i].name.indexOf('data-') === 0 && attr[i].value.length) {
				if (noprefix === true) {
					str += encodeURIComponent(attr[i].name.substring(5)) + '=' + encodeURIComponent(attr[i].value) + '&';
				} else {
					str += encodeURIComponent(attr[i].name) + '=' + encodeURIComponent(attr[i].value) + '&';
				}
			}
		}
		return str;
	};

	/* get elements within context with a class name (with fallback for IE < 9) */
	_socialite.getElements = function(context, name)
	{
		if (typeof context.getElementsByClassName === 'function') {
			return context.getElementsByClassName(name);
		}
		var	elems = [], all = context.getElementsByTagName('*'), len = all.length;
		for (var i = 0; i < len; i++) {
			var cname = ' ' + all[i].className + ' ';

			if (cname.indexOf(' ' + name + ' ') !== -1) {
				elems.push(all[i]);
			}
		}
		return elems;
	};

	_socialite.onLoad = function(instance)
	{
		if (instance.loaded) {
			return;
		}
		instance.loaded = true;
		instance.container.className += ' socialite-loaded';
	};

	// no event support yet... ignore me!
	/*
	_socialite.createEvent = function(elem, name)
	{
		if (typeof elem !== 'object') {
			return false;
		}
		var e = elem.createEvent('Event');
		e.initEvent(name, true, true);
		elem.dispatchEvent(e);
	};
	*/

	// return an iframe element - do iframes need width and height?...
	_socialite.createIFrame = function(src)
	{
		var iframe = document.createElement('iframe');
		iframe.setAttribute('allowtransparency', 'true');
		iframe.setAttribute('frameborder', '0');
		iframe.setAttribute('scrolling', 'no');
		iframe.setAttribute('src', src);
		iframe.style.cssText = 'overflow: hidden; border: none;';
		return iframe;
	};

	// load a single button
	Socialite.activate = function(elem, network)
	{
		Socialite.load(null, elem, network);
	};

	// load and initialise buttons (recursively)
	Socialite.load = function(context, elem, network)
	{
		// if no context use the document
		context = (typeof context === 'object') ? context : document;

		// if no element then search the context for instances
		if (elem === undefined) {
			var	find = _socialite.getElements(context, 'socialite'),
				elems = find, length = find.length;
			if (!length) {
				return;
			}
			// create a new array if we're dealing with a live NodeList
			if (typeof elems.item !== undefined) {
				elems = [];
				for (var i = 0; i < length; i++) {
					elems[i] = find[i];
				}
			}
			Socialite.load(context, elems, network);
			return;
		}

		// if an array of elements load individually
		if (typeof elem === 'object' && elem.length) {
			for (var j = 0; j < elem.length; j++) {
				Socialite.load(context, elem[j], network);
			}
			return;
		}

		// Not an element? Get outa here!
		if (typeof elem !== 'object' || elem.nodeType !== 1) {
			return;
		}

		// if no network is specified or recognised look for one in the class name
		if (typeof network !== 'string' || networks[network] === undefined) {
			var classes = elem.className.split(' ');
			for (var k = 0; k < classes.length; k++) {
				if (networks[classes[k]] !== undefined) {
					network = classes[k];
					break;
				}
			}
			if (typeof network !== 'string') {
				return;
			}
		}

		// create the button elements
		var	container = document.createElement('div'),
			button = document.createElement('div');
		container.className = 'socialised ' + network;
		button.className = 'socialite-button';

		// insert container before parent element, or append to the context
		var parent = elem.parentNode;
		if (parent === null) {
			parent = (context === document) ? document.body : context;
			parent.appendChild(container);
		} else {
			parent.insertBefore(container, elem);
		}

		// insert button and element into container
		container.appendChild(button);
		button.appendChild(elem);

		// hide element from future loading
		elem.className = elem.className.replace(/\bsocialite\b/, '');

		/* create the button instance and save it in cache */
		if (cache[network] === undefined) {
			cache[network] = [];
		}
		var instance = {
			elem: elem,
			button: button,
			container: container,
			parent: parent,
			loaded: false
		};
		cache[network].push(instance);

		// initialise the button
		networks[network](instance, _socialite);
	};

	// allow users to extend the list of supported networks
	Socialite.extend = function(network, callback, source)
	{
		if (typeof network !== 'string' || typeof callback !== 'function') {
			return false;
		}
		if (networks[network] !== undefined) {
			return false;
		}
		if (source !== undefined && typeof source === 'string') {
			sources[network] = source;
		}
		networks[network] = callback;
		return true;
	};

	// extend with Twitter support
	Socialite.extend('twitter', function(instance)
	{
		if (!loaded.twitter) {
			var el = document.createElement('a');
			el.className = 'twitter-share-button';
			_socialite.copyDataAtributes(instance.elem, el);
			instance.button.replaceChild(el, instance.elem);
			_socialite.appendScript('twitter');
		} else {
			//if (typeof window.twttr === 'object') {
			var src = '//platform.twitter.com/widgets/tweet_button.html?';
			src += _socialite.getDataAttributes(instance.elem, true);
			var iframe = _socialite.createIFrame(src);
			instance.button.replaceChild(iframe, instance.elem);
			_socialite.onLoad(instance);
		}
	}, '//platform.twitter.com/widgets.js');

	// extend with Google+ support
	Socialite.extend('plusone', function(instance)
	{
		var el = document.createElement('div');
		el.className = 'g-plusone';
		_socialite.copyDataAtributes(instance.elem, el);
		instance.button.replaceChild(el, instance.elem);
		if (!loaded.plusone) {
			_socialite.appendScript('plusone');
		} else {
			if (typeof window.gapi === 'object' && typeof window.gapi.plusone === 'object' && typeof gapi.plusone.go === 'function') {
				window.gapi.plusone.go();
				_socialite.onLoad(instance);
			} // else - fallback to iframe?
		}
	}, '//apis.google.com/js/plusone.js');

	// extend with Facebook support
	Socialite.extend('facebook', function(instance)
	{
		var el = document.createElement('div');

		if (!loaded.facebook) {
			el.className = 'fb-like';
			_socialite.copyDataAtributes(instance.elem, el);
			instance.button.replaceChild(el, instance.elem);
			_socialite.appendScript('facebook', 'facebook-jssdk');
		} else {
			//if (typeof window.FB === 'object') {
			// XFBML is nasty! use an iframe instead :)
			//if (typeof FB.XFBML.parse === 'function')
			//	FB.XFBML.parse(el);
			//}
			var src = '//www.facebook.com/plugins/like.php?';
			src += _socialite.getDataAttributes(instance.elem, true);
			var iframe = _socialite.createIFrame(src);
			instance.button.replaceChild(iframe, instance.elem);
			_socialite.onLoad(instance);
		}
	}, '//connect.facebook.net/en_US/all.js#xfbml=1');

	// extend with LinkedIn support
	Socialite.extend('linkedin', function(instance)
	{
		var attr = instance.elem.attributes;
		var el = document.createElement('script');
		el.type = 'IN/Share';
		_socialite.copyDataAtributes(instance.elem, el);
		instance.button.replaceChild(el, instance.elem);
		if (!loaded.linkedin) {
			_socialite.appendScript('linkedin');
		} else {
			if (typeof window.IN === 'object' && typeof window.IN.init === 'function') {
				window.IN.init();
				_socialite.onLoad(instance);
			} // else fallback to iframe?
		}
	}, '//platform.linkedin.com/in.js');

	// boom
	return Socialite;

})();
