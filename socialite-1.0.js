/*
 * Socialite v1.0
 * http://www.socialitejs.com
 * Copyright (c) 2011 David Bushell
 * Dual-licensed under the BSD or MIT licenses: http://socialitejs.com/license.txt
 */
window.Socialite = (function()
{	
	var _socialite = { },
		Socialite = { },
		networks = { },
		appends = { },
		loaded = { },
		sources = {
			twitter:  '//platform.twitter.com/widgets.js',
			plusone:  '//apis.google.com/js/plusone.js',
			facebook: '//connect.facebook.net/en_US/all.js#xfbml=1',
			linkedin: '//platform.linkedin.com/in.js'
		};

	/* append a known script element to the document body */
	_socialite.appendScript = function(name, id)
	{
		if (appends[name]) {
			return false;
		}
		appends[name] = true;
		var js = document.createElement('script');
		js.onload = function() {
			loaded[name] = true;
		};
		js.async = true;
		js.src = sources[name];
		if (id) {
			js.id = id;
		}
		document.body.appendChild(js);
		return true;
	};

	// copy data-* attributes from one element to another
	_socialite.copyDataAtributes = function(from, to)
	{
		var i,
			attr = from.attributes;
		for (i = 0; i < attr.length; i++) {
			if (attr[i].name.indexOf('data-') === 0) {
				if (attr[i].value.length) {
					to.setAttribute(attr[i].name, attr[i].value);
				}
			}
		}
	}

	// return data-* attributes from an element as a query string
	_socialite.getDataAttributes = function(from)
	{
		var i,
			str = '',
			attr = from.attributes;
		for (i = 0; i < attr.length; i++) {
			if (attr[i].name.indexOf('data-') === 0) {
				str += encodeURIComponent(attr[i].name) + '=' + encodeURIComponent(attr[i].value) + '&';
			}
		}
		return str;
	}

	// return an iframe element
	// do iframes need width and height?
	_socialite.createIFrame = function(src)
	{
		var iframe = document.createElement('iframe');
		iframe.setAttribute('allowtransparency', 'true');
		iframe.setAttribute('frameborder', '0');
		iframe.setAttribute('scrolling', 'no');
		iframe.setAttribute('src', src);
		iframe.style.cssText = 'overflow: hidden; border: none;';
		return iframe;
	}


	// load a single button
	Socialite.activate = function(elem, network)
	{
		Socialite.load(null, elem, network);
	};

	// load and initialise buttons
	Socialite.load = function(context, elem, network)
	{
		// if no context use the document
		context = (typeof context === 'object') ? context : document;

		// if no element then search the context for instances
		if (elem === undefined) {
			var find = context.getElementsByClassName('socialise');
			var length = find.length;
			if (!length) {
				return;
			}
			var elems = [];
			for (var i = 0; i < length; i++) {
				elems[i] = find[i];
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
		elem.className = elem.className.replace(/\bsocialise\b/, '');

		// initialise the button
		networks[network](elem, button, _socialite);

	};

	// allow users to extend the list of supported networks
	Socialite.extend = function(network, callback)
	{
		if (typeof network !== 'string' || typeof callback !== 'function') {
			return false;
		}
		if (networks[network] !== undefined) {
			return false;
		}
		networks[network] = callback;	
		return true;
	};

	Socialite.extend('twitter', function(elem, button)
	{
		if (!loaded['twitter']) {
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

	});

	Socialite.extend('plusone', function(elem, button)
	{
		var el = document.createElement('div');
		el.className = 'g-plusone';
		_socialite.copyDataAtributes(elem, el);
		button.replaceChild(el, elem);
		if (!loaded['plusone']) {
			_socialite.appendScript('plusone');
		} else {
			if (typeof window.gapi === 'object' && typeof window.gapi.plusone === 'object' && typeof gapi.plusone.go === 'function') {
				gapi.plusone.go();
			}
		}
	});

	Socialite.extend('facebook', function(elem, button)
	{
		var el = document.createElement('div');

		if (!loaded['facebook']) {
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
	});

	Socialite.extend('linkedin', function(elem, button)
	{
		var attr = elem.attributes;
		var el = document.createElement('script');
		el.type = 'IN/Share';
		_socialite.copyDataAtributes(elem, el);
		button.replaceChild(el, elem);
		if (!loaded['linkedin']) {
			_socialite.appendScript('linkedin');
		} else {
			if (typeof window.IN === 'object' && typeof window.IN.init === 'function') {
				window.IN.init();
			}
		}
	});

	return Socialite;

})();
