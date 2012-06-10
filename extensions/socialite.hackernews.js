// Hacker News
// https://github.com/igrigorik/hackernews-button
(function(window, document, Socialite, undefined)
{

    Socialite.network('hackernews', {
        script: {
            src: '//hnbutton.appspot.com/static/hn.js'
        }
    });

    var hackernewsInit = function(instance)
    {
        var el = document.createElement('a');
        el.className = 'hn-share-button';
        Socialite.copyDataAttributes(instance.el, el);
        instance.el.appendChild(el);
    };

    Socialite.widget('hackernews', 'share', { init: hackernewsInit });

})(window, window.document, window.Socialite);
