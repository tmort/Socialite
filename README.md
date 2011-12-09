# Socialite

### Because if you're selling your soul, you may as well do it asynchronously.

Socialite provides a very easy way to implement and activate a plethora of social sharing buttons — any time you wish. On document load, on article hover, on any event!

[For a demo visit: **socialitejs.com**](http://www.socialitejs.com/)

Author: David Bushell [http://dbushell.com](http://dbushell.com/) [@dbushell](http://twitter.com/dbushell/)

Copyright © 2012

## Features and Benefits

* No more tedious copy/paste!
* No dependencies to use.
* Loads external resources only when needed.
* Less than 2kb when minified and compressed.
* More accessible and styleable defaults/fallbacks.
* Built in support for Twitter, Google+, Facebook and LinkedIn.
* Extendable with other social networks.
* Mimics native implementation when activated.
* Supported in all browsers (providing the buttons are).

## Setup

All you need to do is create an element with the class `socialite` and a class like `twitter` to specify the social network. Best practice is to provide an accessible fallback URL like this:

	<a href="http://twitter.com/share" class="socialite twitter" data-url="http://socialitejs.com" rel="nofollow" target="_blank">
		Share on Twitter
	</a>

Use `data-*` attributes to configure your button. These configurations directly correlate to the individual network implementations, so while Twitter uses `data-url`, Facebook uses `data-href`. Not ideal but I'd rather keep this script very small! You can style the defauls however you like. See [http://socialitejs.com](http://socialitejs.com) for demos.

Include **socialite.js** right at the end of your document (before `</body>`) and activate with the options below:

## Functions

### Load

	Socialite.load();

`load` will search the document for elements with the class `socialite` and magically transform them into sharing buttons (based on a network class and data-* attributes).

Always wait for at least the `DOMContentLoaded` event — `$(document).ready(function() { });` with jQuery.

	Socialite.load(context);

Be kind! Provide an element to search within using `context` rather than the whole document.

### Activate

	Socialite.activate(element, 'network');

`activate` replaces a single element (or an array of) with the specific social network button. The following are built in by default: `twitter`, `plusone`, `facebook`, `linkedin`.

### Extend

	Socialite.extend('network', function);

With `extend` you can add more social networks! The `function` is called by `Socialite.load` and `Socialite.activate` to replace the default element with the shiny sharing button.

## Things To Do...

* Add more extensions!
* will events be useful?
* can I do a better check for script loading and activation? e.g. for smooth transitions from defaults.

Send me feedback and testing issues!
