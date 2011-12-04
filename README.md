Author: David Bushell http://dbushell.com @dbushell
Copyright © 2012

# Socialite

## Because if you're selling your soul, you may as well do it asynchronously.

Socialite provides a very easy way to implement and activate a plethora of social sharing buttons at any time you wish.

### Functions

	Socialite.load();

`load` will search the document for elements with the class `socialise` and magically transform them into sharing buttons.

	Socialite.load(context);

Be kind! Provide an element to search within using `context` rather than the whole document.

	Socialite.activate(element, 'network');

`activate` replaces a single element (or an array of) with the specific social network button. The following are built in by default: `twitter`, `plusone`, `facebook`, `linkedin`.

	Socialite.extend('network', function);

With `extend` you can add more social networks! The `function` is called by `Socialite.load` and `Socialite.activate` to replace the default element with the shiny sharing button. 
