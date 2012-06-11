# Socialite v2

### Because if you're selling your soul, you may as well do it asynchronously.

Socialite provides a very easy way to implement and activate a plethora of social sharing buttons — any time you wish. On document load, on article hover, on any event!

[For a demo visit: **socialitejs.com**](http://www.socialitejs.com/)

Author: David Bushell [http://dbushell.com](http://dbushell.com/) [@dbushell](http://twitter.com/dbushell/)

Copyright © 2012

### Changes from Version 1

Please be aware that class names used by Socialite have changed since <a href="https://github.com/dbushell/Socialite/tags/">version 1</a>. All instances start with the class `socialite`, they gain the class `socialite-instance` once processed, and finally `socialite-loaded` once activated. **Pinterest** and **Spotify** extensions are no longer in the default build of `socialite.js`. See end of this README for full change log.

## Using Socialite

Create an element with the class `socialite` and a class like `twitter-share` to specify the social network and type of widget. Best practice is to provide an accessible fallback URL like the example below. Style it however you like, though avoid using `overflow: hidden` in CSS as it will crop overlays. See [http://socialitejs.com](http://socialitejs.com) for demos.

	<a class="socialite twitter-share" href="http://twitter.com/share" data-url="http://socialitejs.com">
		Share on Twitter
	</a>

Use `data-*` attributes to configure your button. These configurations directly correlate to the individual network implementations, so while Twitter uses `data-url`, Facebook uses `data-href`. Not ideal but I'd rather keep this script very small!

Supported widgets are currently:

* Facebook: `facebook-like`
* Twitter: `twitter-share`, `twitter-follow`, `twitter-mention`, `twitter-hashtag` and `twitter-embed` (for individual tweets)
* Google+: `googleplus-one`, `googleplus-share`, `googleplus-badge`
* LinkedIn: `linkedin-share`, `linkedin-recommend`

Also available as extensions:

* Pinterest: `pinterest-pinit`
* Spotify: `spotify-play`
* Hacker News: `hackernews-share`
* GitHub: `github-watch`, `github-fork`, `github-follow`

For all individual button configurations visit [Twitter](https://twitter.com/about/resources/buttons/), [Google+](https://developers.google.com/+/plugins/+1button/), [Facebook](http://developers.facebook.com/docs/reference/plugins/like/), [LinkedIn](http://developer.linkedin.com/plugins/share-button/), [Pinterest](http://pinterest.com/about/goodies/), and [Spotify](https://developer.spotify.com/technologies/spotify-play-button/). **Important:** don't include the scripts provided by these networks, Socialite does that for you! Include socialite.js right at the end of your document and activate with the options below.

***Please note:*** you can easily edit socialite.js to remove the social networks you don't need.

## Making it Work

### Load

	Socialite.load();

The main Socialite function. `load` will search the document for elements with the class `socialite` and magically transform them into sharing buttons (based on a network class and data-* attributes).

Always wait for at least the `DOMContentLoaded` event — `$(document).ready(function() { });` with jQuery.

	Socialite.load(context);

Be kind! Provide a scope to search within using `context` (a containing element) rather than the whole document.

### Activate

	Socialite.activate(element, 'widget');

`activate` replaces a single element (or an array of) with the specific social widget.

### Process (optional)

	Socialite.process();

Run `process` only once when the document has loaded to prepare all Socialite instances. This may be necessary to avoid conflicts when multiple or unsupported widgets exist on the page (e.g. Pinterest buttons). Note that `process` removes all fallback content for some widgets. *This optional will be implemented more intelligently in future versions of Socialite*.

### Setup (optional)

	Socialite.setup({ /* settings */ });

`setup` allows you to specify settings for each network such as localisation (see below for all options).

## Settings

## Facebook

	Socialite.setup({
		facebook: {
			lang     : 'en_GB',
			appId    : 123456789,
			onlike   : function(url) { /* ... */ },
			onunlike : function(url) { /* ... */ },
			onsend   : function(url) { /* ... */ }
		}
	});

See Facebook's documentation on [Internationalization](http://developers.facebook.com/docs/internationalization/) for supported language codes.

### Twitter

	Socialite.setup({
		twitter: {
			lang       : 'en',
			onclick    : function(e) { /* ... */ },
			ontweet    : function(e) { /* ... */ },
			onretweet  : function(e) { /* ... */ },
			onfavorite : function(e) { /* ... */ },
			onfollow   : function(e) { /* ... */ }
		}
	});

See Twitter's documentation for support on [Web Intents Javascript Events](https://dev.twitter.com/docs/intents/events) and supported [Languages](https://twitter.com/about/resources/buttons#tweet).

Twitter share buttons can override the global language setting with a `data-lang` attribute.

### Google+

	Socialite.setup({
		googleplus: {
			lang               : 'en-GB',
			onstartinteraction : function(el, e) { /* ... */ },
			onendinteraction   : function(el, e) { /* ... */ },
			callback           : function(el, e) { /* ... */ }
		}
	});

See Google's documentation for support on [Events](https://developers.google.com/+/plugins/+1button/#plusonetag-parameters) and [Languages](https://developers.google.com/+/plugins/+1button/#available-languages).

## Contribute

Send me feedback and testing issues!

The main core of Socialite is built for extensibility. It's basically a fancy script loader designed for social widgets. They can be stripped out easily if not used and new ones added:

	Socialite.network('network', params);
	Socialite.widget('network', 'widget', params);

With these two functions you can add extended support. See the source code for examples (more guides to come here). I'm always working on support and settings for more networks, check back frequently!

Thanks,

[@dbushell](http://twitter.com/dbushell/)

## Change Log

### 2.0.3 - 11th June 2012

* added [GitHub Buttons](http://markdotto.github.com/github-buttons/) extension
* Google+ `window.gapi.render()` now used on inner gplus div to avoid inline styles on the `socialite` element

### 2.0.2 - 10th June 2012

* Hacker News share widget added by [@igrigorik](https://github.com/igrigorik)

### 2.0.1 - 9th June 2012

* added Google+ `googleplus-badge` widget
* added a Buffer App extension
* created an `extensions` folder in the repository
* **Pinterest** and **Spotify** removed from the default `socialite.js` and `socialite.min.js` builds.
