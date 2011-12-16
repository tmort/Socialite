# Socialite

### Because if you're selling your soul, you may as well do it asynchronously.

Socialite provides a very easy way to implement and activate a plethora of social sharing buttons — any time you wish. On document load, on article hover, on any event!

[For a demo visit: **socialitejs.com**](http://www.socialitejs.com/)

Author: David Bushell [http://dbushell.com](http://dbushell.com/) [@dbushell](http://twitter.com/dbushell/)

Copyright © 2012

## Features and Benefits

* No dependencies to use.</li>
* Loads external resources only when needed.
* Less than 2kb when minified and compressed.
* More accessible and styleable defaults/fallbacks.
* Support for Twitter, Google+, Facebook and LinkedIn.
* Extensible with other social networks.
* Mimics native implementation when activated.
* Supported in all browsers (providing the buttons are).

## Setup

Create an element with the class `socialite` and a class like `twitter` to specify a social network. Best practice is to provide an accessible fallback URL like this:

	<a class="socialite twitter" href="http://twitter.com/share" data-url="http://socialitejs.com">
		Share on Twitter
	</a>

Use `data-*` attributes to configure your button. These configurations directly correlate to the individual network implementations, so while [Twitter](https://twitter.com/about/resources/) uses `data-url`, [Facebook](http://developers.facebook.com/docs/reference/plugins/like/) uses `data-href`. Not ideal but I'd rather keep this script very small! You can style the defauls however you like. See [http://socialitejs.com](http://socialitejs.com) for demos.

Supported network classes are currently: `twitter`, `googleplus`, `facebook` and `linkedin`. For other [Twitter buttons](https://twitter.com/about/resources/) add an extra class of either `follow`, `hashtag` or `mention`. For [Embedded Tweets](https://dev.twitter.com/docs/embedded-tweets) copy the `<blockquote>` code provided by Twitter and replace the class attribute with `socialite tweet`.

For all options visit [Twitter](https://twitter.com/about/resources/), [Google+](https://developers.google.com/+/plugins/+1button/), [Facebook](http://developers.facebook.com/docs/reference/plugins/like/) and [LinkedIn](http://developer.linkedin.com/plugins/share-button/).

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

`activate` replaces a single element (or an array of) with the specific social network button.

### Extend

	Socialite.extend('network', function);

With `extend` you can add more social networks! The `function` is called by `Socialite.load` and `Socialite.activate` to replace the default element with the shiny sharing button.

## Contribute

Send me feedback and testing issues!
