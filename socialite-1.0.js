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
		networks = { },
		appended = { },
		sources = { },
		loaded = { };

	/* append a known script element to the document body */
	_socialite.appendScript = function(network, id)
	{
		if (typeof network !== 'string' || sources[network] === undefined || appended[network]) {
			return false;
		}
		var js = appended[network] = document.createElement('script');
		js.onload = function() {
			loaded[network] = true;
		};
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
	_socialite.getDataAttributes = function(from)
	{
		var i, str = '', attr = from.attributes;
		for (i = 0; i < attr.length; i++) {
			if (attr[i].name.indexOf('data-') === 0 && attr[i].value.length) {
				str += encodeURIComponent(attr[i].name) + '=' + encodeURIComponent(attr[i].value) + '&';
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
			if (cname.indexOf(name) !== -1) {
				elems.push(all[i]);
			}
		}
		return elems;
	};

	// no event support yet... ignore me!
	_socialite.createEvent = function(name, elem)
	{
		var e = document.createEvent('Event');
		e.initEvent(name, true, true);
		elem.dispatchEvent(e);
	};

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

		// create a wrapping element
		var button = document.createElement('div');
		button.className = 'socialised ' + network;

		// insert button before parent element, or append to the context
		var parent = elem.parentNode;
		if (parent === null) {
			parent = (context === document) ? document.body : context;
			parent.appendChild(button);
		} else {
			parent.insertBefore(button, elem);
		}

		// insert element into button
		button.appendChild(elem);

		// hide element from future loading
		elem.className = elem.className.replace(/\bsocialite\b/, '');

		// initialise the button
		networks[network](elem, button, _socialite);
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
	Socialite.extend('twitter', function(elem, button)
	{
		if (!loaded.twitter) {
			var el = document.createElement('a');
			el.className = 'twitter-share-button';
			_socialite.copyDataAtributes(elem, el);
			button.replaceChild(el, elem);
			_socialite.appendScript('twitter');
		} else {
			if (typeof window.twttr === 'object') {
				var src = '//platform.twitter.com/widgets/tweet_button.html?';
				src += _socialite.getDataAttributes(elem);
				var iframe = _socialite.createIFrame(src);
				button.replaceChild(iframe, elem);
			}
		}
	}, '//platform.twitter.com/widgets.js');

	// extend with Google+ support
	Socialite.extend('plusone', function(elem, button)
	{
		var el = document.createElement('div');
		el.className = 'g-plusone';
		_socialite.copyDataAtributes(elem, el);
		button.replaceChild(el, elem);
		if (!loaded.plusone) {
			_socialite.appendScript('plusone');
		} else {
			if (typeof window.gapi === 'object' && typeof window.gapi.plusone === 'object' && typeof gapi.plusone.go === 'function') {
				window.gapi.plusone.go();
			}
		}
	}, '//apis.google.com/js/plusone.js');

	// extend with Facebook support
	Socialite.extend('facebook', function(elem, button)
	{
		var el = document.createElement('div');

		if (!loaded.facebook) {
			el.className = 'fb-like';
			_socialite.copyDataAtributes(elem, el);
			button.replaceChild(el, elem);
			_socialite.appendScript('facebook', 'facebook-jssdk');
		} else {
			if (typeof window.FB === 'object') {
				// XFBML is nasty! use an iframe instead :)
				//if (typeof FB.XFBML.parse === 'function')
				//	FB.XFBML.parse(el);
				var src = '//www.facebook.com/plugins/like.php?';
				src += _socialite.getDataAttributes(elem);
				var iframe = _socialite.createIFrame(src);
				button.replaceChild(iframe, elem);
			}
		}
	}, '//connect.facebook.net/en_US/all.js#xfbml=1');

	// extend with LinkedIn support
	Socialite.extend('linkedin', function(elem, button)
	{
		var attr = elem.attributes;
		var el = document.createElement('script');
		el.type = 'IN/Share';
		_socialite.copyDataAtributes(elem, el);
		button.replaceChild(el, elem);
		if (!loaded.linkedin) {
			_socialite.appendScript('linkedin');
		} else {
			if (typeof window.IN === 'object' && typeof window.IN.init === 'function') {
				window.IN.init();
			}
		}
	}, '//platform.linkedin.com/in.js');

	// boom
	return Socialite;

})();
