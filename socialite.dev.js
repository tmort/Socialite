/*!
 * Socialite v2.0
 * http://socialitejs.com
 * Copyright (c) 2011 David Bushell
 * Dual-licensed under the BSD or MIT licenses: http://socialitejs.com/license.txt
 */

/**
 * This is a development version of Socialite, use at your own risk!
 */
window.Socialite = (function(window, document, undefined)
{
    'use strict';

    var uid       = 0,
        instances = [ ],
        networks  = { },
        widgets   = { },
        rstate    = /^($|ready|complete)/,
        euc       = window.encodeURIComponent;

    var socialite = {

        settings: { },

        hasClass: function(el, cn)
        {
            return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
        },

        addClass: function(el, cn)
        {
            if (!socialite.hasClass(el, cn)) {
                el.className = (el.className === '') ? cn : el.className + ' ' + cn;
            }
        },

        removeClass: function(el, cn)
        {
            el.className = (' ' + el.className + ' ').replace(' ' + cn + ' ', '');
        },

        /**
         * Copy properties of one object to another
         */
        extendObject: function(to, from, overwrite)
        {
            for (var prop in from) {
                var hasProp = to[prop] !== undefined;
                if (hasProp && typeof from[prop] === 'object') {
                    socialite.extendObject(to[prop], from[prop], overwrite);
                } else if (overwrite || !hasProp) {
                    to[prop] = from[prop];
                }
            }
        },

        /**
         * Return elements with a specific class
         *
         * @param context - containing element to search within
         * @param cn      - class name to search for
         *
         */
        getElements: function(context, cn)
        {
            var i   = 0,
                el  = [ ],
                gcn = !!context.getElementsByClassName,
                all = gcn ? context.getElementsByClassName(cn) : context.getElementsByTagName('*');
            for (; i < all.length; i++) {
                if (gcn || socialite.hasClass(all[i], cn)) {
                    el.push(all[i]);
                }
            }
            return el;
        },

        /**
         * Return data-* attributes of element as a query string (or object)
         *
         * @param el       - the element
         * @param noprefix - (optional) if true, remove "data-" from attribute names
         * @param nostr    - (optional) if true, return attributes in an object
         *
         */
        getDataAttributes: function(el, noprefix, nostr)
        {
            var i    = 0,
                str  = '',
                obj  = { },
                attr = el.attributes;
            for (; i < attr.length; i++) {
                var key = attr[i].name,
                    val = attr[i].value;
                if (val.length && key.indexOf('data-') === 0) {
                    if (noprefix) {
                        key = key.substring(5);
                    }
                    if (nostr) {
                        obj[key] = val;
                    } else {
                        str += euc(key) + '=' + euc(val) + '&';
                    }
                }
            }
            return nostr ? obj : str;
        },

        /**
         * Copy data-* attributes from one element to another
         *
         * @param from     - element to copy from
         * @param to       - element to copy to
         * @param noprefix - (optional) if true, remove "data-" from attribute names
         * @param nohyphen - (optional) if true, convert hyphens to underscores in the attribute names
         *
         */
        copyDataAttributes: function(from, to, noprefix, nohyphen)
        {
            var attr = socialite.getDataAttributes(from, noprefix, true);
            for (var i in attr) {
                to.setAttribute(nohyphen ? i.replace(/-/g, '_') : i, attr[i]);
            }
        },

        /**
         * Create iframe element
         *
         * @param src      - iframe URL (src attribute)
         * @param instance - (optional) socialite instance to activate on iframe load
         *
         */
        createIframe: function(src, instance)
        {
            var iframe = document.createElement('iframe');
            iframe.style.cssText = 'overflow: hidden; border: none;';
            socialite.extendObject(iframe, { src: src, allowtransparency: 'true', frameborder: '0', scrolling: 'no' }, true);
            if (instance) {
                iframe.onload = iframe.onreadystatechange = function ()
                {
                    if (rstate.test(iframe.readyState || '')) {
                        iframe.onload = iframe.onreadystatechange = null;
                        socialite.activateInstance(instance);
                    }
                };
            }
            return iframe;
        },

        /**
         * Returns true if network script has loaded
         */
        networkReady: function(name)
        {
            return networks[name] ? networks[name].loaded : undefined;
        },

        /**
         * Append network script to the document
         */
        appendNetwork: function(network)
        {
            if (!network || network.appended) {
                return;
            }
            if (typeof network.onappend === 'function' && network.onappend(network) === false) {
                network.appended = network.loaded = true;
                socialite.activateAll(network);
                return;
            }

            if (network.script) {
                network.el = document.createElement('script');
                socialite.extendObject(network.el, network.script, true);
                network.el.async = true;
                network.el.onload = network.el.onreadystatechange = function()
                {
                    if (rstate.test(network.el.readyState || '')) {
                        network.el.onload = network.el.onreadystatechange = null;
                        network.loaded = true;
                        if (typeof network.onload === 'function') {
                            network.onload(network);
                        }
                        socialite.activateAll(network);
                    }
                };
                document.body.appendChild(network.el);
            }
            network.appended = true;
        },

        /**
         * Remove network script from the document
         */
        removeNetwork: function(network)
        {
            if (!socialite.networkReady(network.name)) {
                return false;
            }
            network.el.parentNode.removeChild(network.el);
            return !(network.appended = network.loaded = false);
        },

        /**
         * Remove and re-append network script to the document
         */
        reloadNetwork: function(name)
        {
            var network = networks[name];
            if (network && socialite.removeNetwork(network)) {
                socialite.appendNetwork(network);
            }
        },

        /**
         * Create new Socialite instance
         *
         * @param el     - parent element that will hold the new instance
         * @param widget - widget the instance belongs to
         *
         */
        createInstance: function(el, widget)
        {
            var proceed  = true,
                instance = {
                    el      : el,
                    uid     : uid++,
                    widget  : widget
                };
            instances.push(instance);
            if (widget.process !== undefined) {
                proceed = (typeof widget.process === 'function') ? widget.process(instance) : false;
            }
            if (proceed) {
                socialite.processInstance(instance);
            }
            instance.el.setAttribute('data-socialite', instance.uid);
            instance.el.className = 'socialite ' + widget.name + ' socialite-instance';
            return instance;
        },

        /**
         * Process a socialite instance to an intermediate state prior to load
         */
        processInstance: function(instance)
        {
            var el = instance.el;
            instance.el = document.createElement('div');
            instance.el.className = el.className;
            socialite.copyDataAttributes(el, instance.el);
            if (el.nodeName.toLowerCase() === 'a' && !el.getAttribute('data-default-href')) {
                instance.el.setAttribute('data-default-href', el.getAttribute('href'));
            }
            var parent = el.parentNode;
            parent.insertBefore(instance.el, el);
            parent.removeChild(el);
        },

        /**
         * Activate a socialite instance
         */
        activateInstance: function(instance)
        {
            if (instance && !instance.loaded) {
                instance.loaded = true;
                if (typeof instance.widget.onload === 'function') {
                    instance.widget.onload(instance);
                }
                socialite.addClass(instance.el, 'socialite-loaded');
                return instance.onload ? instance.onload(instance.el) : null;
            }
        },

        /**
         * Activate all socialite instances belonging to a network
         */
        activateAll: function(network)
        {
            for (var i = 0; i < instances.length; i++) {
                if (instances[i].init && instances[i].widget.network === network) {
                    socialite.activateInstance(instances[i]);
                }
            }
        },

        /**
         * Load socialite instances
         *
         * @param context - (optional) containing element to search within
         * @param el      - (optional) individual or an array of elements to load
         * @param w       - (optional) widget name
         * @param onload  - (optional) function to call after each socialite instance has loaded
         * @param process - (optional) process but don't load network (if true)
         *
         */
        load: function(context, el, w, onload, process)
        {
            // use document as context if unspecified
            context = (context && typeof context === 'object' && context.nodeType === 1) ? context : document;

            // if no elements search within the context and recurse
            if (!el || typeof el !== 'object') {
                socialite.load(context, socialite.getElements(context, 'socialite'), w, onload, process);
                return;
            }

            // if array of elements load each one individually
            if (/Array/.test(Object.prototype.toString.call(el))) {
                for (i = 0; i < el.length; i++) {
                    socialite.load(context, el[i], w, onload, process);
                }
                return;
            }

            // nothing was found...
            if (el.nodeType !== 1) {
                return;
            }

            // if widget name not specified search within the element classes
            var i;
            if (!w || !widgets[w]) {
                w = null;
                var classes = el.className.split(' ');
                for (i = 0; i < classes.length; i++) {
                    if (widgets[classes[i]]) {
                        w = classes[i];
                        break;
                    }
                }
                if (!w) {
                    return;
                }
            }

            // find or create the Socialite instance
            var instance,
                widget = widgets[w],
                sid    = parseInt(el.getAttribute('data-socialite'), 10);
            if (!isNaN(sid)) {
                for (i = 0; i < instances.length; i++) {
                    if (instances[i].uid === sid) {
                        instance = instances[i];
                        break;
                    }
                }
            } else {
                instance = socialite.createInstance(el, widget);
            }

            // return if just processing (or no instance found)
            if (process || !instance) {
                return;
            }

            // initialise the instance
            if (!instance.init) {
                instance.init = true;
                instance.onload = (typeof onload === 'function') ? onload : null;
                widget.init(instance, socialite);
            }

            // append the parent network (all instances will be activated onload)
            // or activate immediately if network has already loaded
            if (!widget.network.appended) {
                socialite.appendNetwork(widget.network);
            } else {
                if (socialite.networkReady(widget.network.name)) {
                    socialite.activateAll(widget.network);
                }
            }
        },

        /**
         * Load a single element
         *
         * @param el     - an individual element
         * @param w      - (optional) widget for this socialite instance
         * @param onload - (optional) function to call once each instance has loaded
         *
         */
        activate: function(el, w, onload)
        {
            // skip the first few steps
            window.Socialite.load(null, el, w, onload);
        },

        /**
         * Process elements to an intermediate state prior to load
         *
         * @param context - containing element to search within
         * @param el      - (optional) individual or an array of elements to load
         * @param w       - (optional) widget name
         *
         */
        process: function(context, el, w)
        {
            // stop before widget initialises instance
            window.Socialite.load(context, el, w, null, true);
        },

        /**
         * Add a new social network
         *
         * @param name   - unique name for network
         * @param params - additional data and callbacks
         *
         */
        network: function(name, params)
        {
            networks[name] = {
                name     : name,
                el       : null,
                appended : false,
                loaded   : false,
                widgets  : { }
            };
            if (params) {
                socialite.extendObject(networks[name], params);
            }
        },

        /**
         * Add a new social widget
         *
         * @param name   - name of owner network
         * @param w      - unique name for widget
         * @param params - additional data and callbacks
         *
         */
        widget: function(n, w, params)
        {
            params.name = n + '-' + w;
            if (!networks[n] || widgets[params.name]) {
                return;
            }
            params.network = networks[n];
            networks[n].widgets[w] = widgets[params.name] = params;
        },

        /**
         * Change the default Socialite settings for each network
         */
        setup: function(params)
        {
            socialite.extendObject(socialite.settings, params, true);
        }

    };

    return socialite;

})(window, window.document);

/*
 * Socialite Extensions - Pick 'n' Mix!
 *
 */

(function(window, document, Socialite, undefined)
{

    Socialite.setup({
        facebook: {
            lang: 'en_GB',
            appId: null
        },
        twitter: {
            lang: 'en-GB'
        },
        googleplus: {
            lang: 'en-GB'
        }
    });


    // Facebook
    // http://developers.facebook.com/docs/reference/plugins/like/

    Socialite.network('facebook', {
        script: {
            src : '//connect.facebook.net/{{language}}/all.js#xfbml=1{{appId}}',
            id  : 'facebook-jssdk'
        },
        onappend: function(network)
        {
            var fb = document.getElementById('fb-root');
            if (!fb) {
                fb = document.createElement('div');
                fb.id = 'fb-root';
                document.body.appendChild(fb);
            }
            var appId = Socialite.settings['facebook'].appId || '',
                src   = network.script.src.replace('{{appId}}', appId ? '&appId=' + appId : '');
            src = src.replace('{{language}}', Socialite.settings['facebook'].lang);
            network.script.src = src;
        }
    });

    Socialite.widget('facebook', 'like', {
        init: function(instance)
        {
            var el;
            // if network has already loaded try XFBML or resort to iframe
            if (Socialite.networkReady('facebook')) {
                if (window.FB && window.FB.XFBML) {
                    el = document.createElement('fb:like');
                    Socialite.copyDataAttributes(instance.el, el, true, true);
                    instance.el.appendChild(el);
                    window.FB.XFBML.parse(instance.el);
                } else {
                    instance.el.appendChild(Socialite.createIframe('//www.facebook.com/plugins/like.php?locale=' + Socialite.settings['facebook'].lang + '&' + Socialite.getDataAttributes(instance.el, true), instance));
                }
            // otherwise let network sweep up onload
            } else {
                el = document.createElement('div');
                el.className = 'fb-like';
                Socialite.copyDataAttributes(instance.el, el);
                instance.el.appendChild(el);
            }
        }
    });


    // Twitter
    // https://twitter.com/about/resources/

    Socialite.network('twitter', {
        script: {
            src     : '//platform.twitter.com/widgets.js',
            id      : 'twitter-wjs',
            charset : 'utf-8'
        },
        onappend: function()
        {
            if (window.twttr) {
                return false;
            } else {
                window.twttr = { _e: [ function() { Socialite.activateAll('twitter'); } ] };
            }
        }
    });

    var twitterInit = function(instance)
    {
        var el = document.createElement('a');
        el.className = instance.widget.name + '-button';
        Socialite.copyDataAttributes(instance.el, el);
        el.setAttribute('href', instance.el.getAttribute('data-default-href'));
        el.setAttribute('data-lang', instance.el.getAttribute('data-lang') || Socialite.settings['twitter'].lang);
        instance.el.appendChild(el);
    };

    var twitterLoad = function(instance)
    {
        if (twttr && typeof twttr.widgets === 'object' && typeof twttr.widgets.load === 'function') {
            twttr.widgets.load();
            Socialite.activateInstance(instance);
        } else {
            if (Socialite.networkReady('twitter')) {
                Socialite.reloadNetwork('twitter');
            }
        }
    };

    Socialite.widget('twitter', 'share',   { init: twitterInit, onload: twitterLoad });
    Socialite.widget('twitter', 'follow',  { init: twitterInit, onload: twitterLoad });
    Socialite.widget('twitter', 'hashtag', { init: twitterInit, onload: twitterLoad });
    Socialite.widget('twitter', 'mention', { init: twitterInit, onload: twitterLoad });

    Socialite.widget('twitter', 'embed',   {
        process: function(instance)
        {
            instance.innerEl = instance.el;
            if (!instance.innerEl.getAttribute('data-lang')) {
                instance.innerEl.setAttribute('data-lang', Socialite.settings['twitter'].lang);
            }
            instance.el = document.createElement('div');
            instance.el.className = instance.innerEl.className;
            instance.innerEl.className = '';
            instance.innerEl.parentNode.insertBefore(instance.el, instance.innerEl);
            instance.el.appendChild(instance.innerEl);
        },
        init: function(instance)
        {
            instance.innerEl.className = 'twitter-tweet';
        },
        onload: twitterLoad
    });


    // Google+
    // https://developers.google.com/+/plugins/+1button/
    // Google does not support IE7

    Socialite.network('googleplus', {
        script: {
            src: '//apis.google.com/js/plusone.js'
        },
        onappend: function(network)
        {
            if (window.gapi) {
                return false;
            }
            window.___gcfg = {
                lang: Socialite.settings['googleplus'].lang,
                parsetags: 'explicit'
            };
        }
    });

    Socialite.widget('googleplus', 'one', {
        init: function(instance)
        {
            var el = document.createElement('div');
            el.className = 'g-plusone';
            Socialite.copyDataAttributes(instance.el, el);
            instance.el.appendChild(el);
        },
        onload: function(instance)
        {
            if (window.gapi && typeof window.gapi.plusone === 'function') {
                window.gapi.plusone.render(instance.el, Socialite.getDataAttributes(instance.el, true, true));
            }
        }
    });

    Socialite.widget('googleplus', 'share', {
        init: function(instance)
        {
            var el = document.createElement('div');
            el.className = 'g-plus';
            Socialite.copyDataAttributes(instance.el, el);
            instance.el.appendChild(el);
        },
        onload: function(instance)
        {
            if (window.gapi && typeof window.gapi.plus === 'function') {
                window.gapi.plus.render(instance.el, Socialite.getDataAttributes(instance.el, true, true));
            }
        }
    });


    // LinkedIn
    // http://developer.linkedin.com/plugins/share-button/

    Socialite.network('linkedin', {
        script: {
            src: '//platform.linkedin.com/in.js'
        }
    });

    var innitLinkedin = function(instance)
    {
            var el = document.createElement('script');
            el.type = 'IN/' + instance.widget.intype;
            Socialite.copyDataAttributes(instance.el, el);
            instance.el.appendChild(el);
            if (typeof window.IN === 'object' && typeof window.IN.init === 'function') {
                window.IN.init();
                Socialite.activateInstance(instance);
            }
    };

    Socialite.widget('linkedin', 'share',     { init: innitLinkedin, intype: 'Share' });
    Socialite.widget('linkedin', 'recommend', { init: innitLinkedin, intype: 'RecommendProduct' });


    // Pinterest "pin It" Button
    // http://pinterest.com/about/goodies/

    Socialite.network('pinterest', {
        script: {
            src: '//assets.pinterest.com/js/pinit.js'
        }
    });

    Socialite.widget('pinterest', 'pinit', {
        process: function(instance)
        {
            // Pinterest activates all <a> elements with a href containing share URL
            // so we have to jump through hoops to protect each instance
            if (instance.el.nodeName.toLowerCase() !== 'a') {
                return true;
            }
            var id   = 'socialite-instance-' + instance.uid,
                href = instance.el.getAttribute('href');
            instance.el.id = id;
            instance.el.href = '#' + id;
            instance.el.setAttribute('data-default-href', href);
            instance.el.setAttribute('onclick', '(function(){window.open("' + href + '")})();');
        },
        init: function(instance)
        {
            Socialite.processInstance(instance);
            var el = document.createElement('a');
            el.className = 'pin-it-button';
            Socialite.copyDataAttributes(instance.el, el);
            el.setAttribute('href', instance.el.getAttribute('data-default-href'));
            el.setAttribute('count-layout', instance.el.getAttribute('data-count-layout') || 'horizontal');
            instance.el.appendChild(el);
            if (Socialite.networkReady('pinterest')) {
                Socialite.reloadNetwork('pinterest');
            }
        }
    });


    // Spotify Play Button
    // https://developer.spotify.com/technologies/spotify-play-button/

    Socialite.network('spotify');

    Socialite.widget('spotify', 'play', {
        process: null,
        init: function(instance)
        {
            Socialite.processInstance(instance);
            var src    = 'https://embed.spotify.com/?',
                width  = parseInt(instance.el.getAttribute('data-width'), 10),
                height = parseInt(instance.el.getAttribute('data-height'), 10);
            src += 'uri=' + (instance.el.getAttribute('data-default-href') || instance.el.getAttribute('data-href')) + '&';
            instance.el.setAttribute('data-href', '');
            instance.el.setAttribute('data-default-href', '');
            instance.el.setAttribute('data-socialite', '');
            src += Socialite.getDataAttributes(instance.el, true);
            var iframe = Socialite.createIframe(src, instance);
            iframe.style.width = (isNaN(width) ? 300 : width) + 'px';
            iframe.style.height = (isNaN(height) ? 380 : height) + 'px';
            instance.el.appendChild(iframe);
            Socialite.activateInstance(instance);
        }
    });


})(window, window.document, window.Socialite);
