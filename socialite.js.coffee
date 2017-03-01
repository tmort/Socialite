###
Socialite v2.0
http://socialitejs.com
Copyright (c) 2011 David Bushell
Dual-licensed under the BSD or MIT licenses: http://socialitejs.com/license.txt

Coffeescript transcription by derfarg
Date: 8/23/2012
derfarg@gmail.com
@derfarg
github.com/derfarg
###

window.Socialite = ((window, document, undefined_) ->
  "use strict"
  uid       = 0
  instances = []
  networks  = {}
  widgets   = {}
  rstate    = /^($|loaded|complete)/
  euc       = window.encodeURIComponent
  socialite =
    settings: {}
    trim: (str) ->
      (if str.trim then str.trim() else str.replace(/^\s+|\s+$/g, ""))
    hasClass: (el, cn) ->
      (" " + el.className + " ").indexOf(" " + cn + " ") isnt -1
    addClass: (el, cn) ->
      el.className = (if (el.className is "") then cn else el.className + " " + cn)  unless socialite.hasClass(el, cn)
    removeClass: (el, cn) ->
      el.className = socialite.trim(" " + el.className + " ".replace(" " + cn + " ", " "))

    ###
    Copy properties of one object to another
    ###
    extendObject: (to, from, overwrite) ->
      for prop of from
        hasProp = to[prop] isnt `undefined`
        if hasProp and typeof from[prop] is "object"
          socialite.extendObject to[prop], from[prop], overwrite
        else to[prop] = from[prop]  if overwrite or not hasProp

    ###
    Return elements with a specific class
    @param context - containing element to search within
    @param cn      - class name to search for
    ###
    getElements: (context, cn) ->
      # copy to a new array to avoid a live NodeList
      i = 0
      el = []
      gcn = !!context.getElementsByClassName
      all = (if gcn then context.getElementsByClassName(cn) else context.getElementsByTagName("*"))
      while i < all.length
        el.push all[i]  if gcn or socialite.hasClass(all[i], cn)
        i++
      el

    ###
    Return data-* attributes of element as a query string (or object)
    @param el       - the element
    @param noprefix - (optional) if true, remove "data-" from attribute names
    @param nostr    - (optional) if true, return attributes in an object
    ###
    getDataAttributes: (el, noprefix, nostr) ->
      i = 0
      str = ""
      obj = {}
      attr = el.attributes
      while i < attr.length
        key = attr[i].name
        val = attr[i].value
        if val.length and key.indexOf("data-") is 0
          key = key.substring(5)  if noprefix
          if nostr
            obj[key] = val
          else
            str += euc(key) + "=" + euc(val) + "&"
        i++
      (if nostr then obj else str)

    ###
    Copy data-* attributes from one element to another
    @param from     - element to copy from
    @param to       - element to copy to
    @param noprefix - (optional) if true, remove "data-" from attribute names
    @param nohyphen - (optional) if true, convert hyphens to underscores in the attribute names
    ###
    copyDataAttributes: (from, to, noprefix, nohyphen) ->
      # `nohyphen` was needed for Facebook's <fb:like> elements - remove as no longer used?
      attr = socialite.getDataAttributes(from, noprefix, true)
      for i of attr
        to.setAttribute (if nohyphen then i.replace(/-/g, "_") else i), attr[i]

    ###
    Create iframe element
    @param src      - iframe URL (src attribute)
    @param instance - (optional) socialite instance to activate on iframe load
    ###
    createIframe: (src, instance) ->
      # Socialite v2 has slashed the amount of manual iframe creation, we should aim to avoid this entirely
      iframe = document.createElement("iframe")
      iframe.style.cssText = "overflow: hidden; border: none;"
      socialite.extendObject iframe,
        src: src
        allowtransparency: "true"
        frameborder: "0"
        scrolling: "no"
      , true
      if instance
        iframe.onload = iframe.onreadystatechange = ->
          if rstate.test(iframe.readyState or "")
            iframe.onload = iframe.onreadystatechange = null
            socialite.activateInstance instance
      iframe

    ###
    Returns true if network script has loaded
    ###
    networkReady: (name) ->
      (if networks[name] then networks[name].loaded else `undefined`)

    ###
    Append network script to the document
    ###
    appendNetwork: (network) ->
      # the activation process is getting a little confusing for some networks
      # it would appear a script load event does not mean its global object exists yet
      # therefore the first call to `activateAll` may have no effect whereas the second call does, e.g. via `window.twttr.ready`
      return  if not network or network.appended
      # `network.append` and `network.onload` can cancel progress
      if typeof network.append is "function" and network.append(network) is false
        network.appended = network.loaded = true
        socialite.activateAll network
        return
      if network.script
        network.el = document.createElement("script")
        socialite.extendObject network.el, network.script, true
        network.el.async = true
        network.el.onload = network.el.onreadystatechange = ->
          if rstate.test(network.el.readyState or "")
            network.el.onload = network.el.onreadystatechange = null
            network.loaded = true
            return  if typeof network.onload is "function" and network.onload(network) is false
            socialite.activateAll network

        document.body.appendChild network.el
      network.appended = true

    ###
    Remove network script from the document
    ###
    removeNetwork: (network) ->
      return false  unless socialite.networkReady(network.name)
      network.el.parentNode.removeChild network.el
      not (network.appended = network.loaded = false)

    ###
    Remove and re-append network script to the document
    ###
    reloadNetwork: (name) ->
      # This is a last-ditch effort for half-baked scripts
      network = networks[name]
      socialite.appendNetwork network  if network and socialite.removeNetwork(network)

    ###
    Create new Socialite instance
    @param el     - parent element that will hold the new instance
    @param widget - widget the instance belongs to
    ###
    createInstance: (el, widget) ->
      proceed = true
      instance =
        el: el
        uid: uid++
        widget: widget

      instances.push instance
      proceed = (if (typeof widget.process is "function") then widget.process(instance) else false)  if widget.process isnt `undefined`
      socialite.processInstance instance  if proceed
      instance.el.setAttribute "data-socialite", instance.uid
      instance.el.className = "socialite " + widget.name + " socialite-instance"
      instance

    ###
    Process a socialite instance to an intermediate state prior to load
    ###
    processInstance: (instance) ->
      el = instance.el
      instance.el = document.createElement("div")
      instance.el.className = el.className
      socialite.copyDataAttributes el, instance.el
      # stop over-zealous scripts from activating all instances
      instance.el.setAttribute "data-default-href", el.getAttribute("href")  if el.nodeName.toLowerCase() is "a" and not el.getAttribute("data-default-href")
      parent = el.parentNode
      parent.insertBefore instance.el, el
      parent.removeChild el

    ###
    Activate a socialite instance
    ###
    activateInstance: (instance) ->
      if instance and not instance.loaded
        instance.loaded = true
        instance.widget.activate instance  if typeof instance.widget.activate is "function"
        socialite.addClass instance.el, "socialite-loaded"
        (if instance.onload then instance.onload(instance.el) else null)

    ###
    Activate all socialite instances belonging to a network
    ###
    activateAll: (network) ->
      network = networks[network]  if typeof network is "string"
      i = 0

      while i < instances.length
        instance = instances[i]
        socialite.activateInstance instance  if instance.init and instance.widget.network is network
        i++

    ###
    Load socialite instances
    @param context - (optional) containing element to search within
    @param el      - (optional) individual or an array of elements to load
    @param w       - (optional) widget name
    @param onload  - (optional) function to call after each socialite instance has loaded
    @param process - (optional) process but don't load network (if true)
    ###
    load: (context, el, w, onload, process) ->
      # use document as context if unspecified
      context = (if (context and typeof context is "object" and context.nodeType is 1) then context else document)
      # if no elements search within the context and recurse
      if not el or typeof el isnt "object"
        socialite.load context, socialite.getElements(context, "socialite"), w, onload, process
        return
      i = undefined
      # if array of elements load each one individually
      if /Array/.test(Object::toString.call(el))
        i = 0
        while i < el.length
          socialite.load context, el[i], w, onload, process
          i++
        return
      # nothing was found...
      return  if el.nodeType isnt 1
      # if widget name not specified search within the element classes
      if not w or not widgets[w]
        w = null
        classes = el.className.split(" ")
        i = 0
        while i < classes.length
          if widgets[classes[i]]
            w = classes[i]
            break
          i++
        return  unless w
      # find or create the Socialite instance
      instance = undefined
      widget = widgets[w]
      sid = parseInt(el.getAttribute("data-socialite"), 10)
      unless isNaN(sid)
        i = 0
        while i < instances.length
          if instances[i].uid is sid
            instance = instances[i]
            break
          i++
      else
        instance = socialite.createInstance(el, widget)
      # return if just processing (or no instance found)
      return  if process or not instance
      # initialise the instance
      unless instance.init
        instance.init = true
        instance.onload = (if (typeof onload is "function") then onload else null)
        widget.init instance
      # append the parent network (all instances will be activated onload)
      # or activate immediately if network has already loaded
      unless widget.network.appended
        socialite.appendNetwork widget.network
      else
        socialite.activateInstance instance  if socialite.networkReady(widget.network.name)

    ###
    Load a single element
    @param el     - an individual element
    @param w      - (optional) widget for this socialite instance
    @param onload - (optional) function to call once each instance has loaded
    ###
    activate: (el, w, onload) ->
      # skip the first few steps
      window.Socialite.load null, el, w, onload

    ###
    Process elements to an intermediate state prior to load
    @param context - containing element to search within
    @param el      - (optional) individual or an array of elements to load
    @param w       - (optional) widget name
    ###
    process: (context, el, w) ->
      # stop before widget initialises instance
      window.Socialite.load context, el, w, null, true

    ###
    Add a new social network
    @param name   - unique name for network
    @param params - additional data and callbacks
    ###
    network: (n, params) ->
      networks[n] =
        name: n
        el: null
        appended: false
        loaded: false
        widgets: {}

      socialite.extendObject networks[n], params  if params

    ###
    Add a new social widget
    @param name   - name of owner network
    @param w      - unique name for widget
    @param params - additional data and callbacks
    ###
    widget: (n, w, params) ->
      params.name = n + "-" + w
      return  if not networks[n] or widgets[params.name]
      params.network = networks[n]
      networks[n].widgets[w] = widgets[params.name] = params

    ###
    Change the default Socialite settings for each network
    ###
    setup: (params) ->
      socialite.extendObject socialite.settings, params, true

  socialite
)(window, window.document)

###
Socialite Extensions - Pick 'n' Mix!
###
((window, document, Socialite, undefined_) ->
  
  # default to the Queen's English
  Socialite.setup
    facebook:
      lang: "en_GB"
      appId: null

    twitter:
      lang: "en"

    googleplus:
      lang: "en-GB"

  ###
  Facebook
  http://developers.facebook.com/docs/reference/plugins/like/
  http://developers.facebook.com/docs/reference/javascript/FB.init/
  ###
  Socialite.network "facebook",
    script:
      src: "//connect.facebook.net/{{language}}/all.js"
      id: "facebook-jssdk"

    append: (network) ->
      fb = document.createElement("div")
      settings = Socialite.settings.facebook
      events =
        onlike: "edge.create"
        onunlike: "edge.remove"
        onsend: "message.send"

      fb.id = "fb-root"
      document.body.appendChild fb
      network.script.src = network.script.src.replace("{{language}}", settings.lang)
      window.fbAsyncInit = ->
        window.FB.init
          appId: settings.appId
          xfbml: true

        for e of events
          window.FB.Event.subscribe events[e], settings[e]  if typeof settings[e] is "function"

  Socialite.widget "facebook", "like",
    init: (instance) ->
      el = document.createElement("div")
      el.className = "fb-like"
      Socialite.copyDataAttributes instance.el, el
      instance.el.appendChild el
      window.FB.XFBML.parse instance.el  if window.FB and window.FB.XFBML

  ###
  Twitter
  https://dev.twitter.com/docs/tweet-button/
  https://dev.twitter.com/docs/intents/events/
  https://developers.google.com/analytics/devguides/collection/gajs/gaTrackingSocial#twitter
  ###
  Socialite.network "twitter",
    script:
      src: "//platform.twitter.com/widgets.js"
      id: "twitter-wjs"
      charset: "utf-8"

    append: ->
      notwttr = (typeof window.twttr isnt "object")
      settings = Socialite.settings.twitter
      events = ["click", "tweet", "retweet", "favorite", "follow"]
      if notwttr
        window.twttr = (t =
          _e: []
          ready: (f) ->
            t._e.push f
        )
      window.twttr.ready (twttr) ->
        i = 0

        while i < events.length
          e = events[i]
          twttr.events.bind e, settings["on" + e]  if typeof settings["on" + e] is "function"
          i++
        Socialite.activateAll "twitter"

      notwttr

  twitterInit = (instance) ->
    el = document.createElement("a")
    el.className = instance.widget.name + "-button"
    Socialite.copyDataAttributes instance.el, el
    el.setAttribute "href", instance.el.getAttribute("data-default-href")
    el.setAttribute "data-lang", instance.el.getAttribute("data-lang") or Socialite.settings.twitter.lang
    instance.el.appendChild el

  twitterActivate = (instance) ->
    window.twttr.widgets.load()  if window.twttr and typeof window.twttr.widgets is "object" and typeof window.twttr.widgets.load is "function"

  Socialite.widget "twitter", "share",
    init: twitterInit
    activate: twitterActivate

  Socialite.widget "twitter", "follow",
    init: twitterInit
    activate: twitterActivate

  Socialite.widget "twitter", "hashtag",
    init: twitterInit
    activate: twitterActivate

  Socialite.widget "twitter", "mention",
    init: twitterInit
    activate: twitterActivate

  Socialite.widget "twitter", "embed",
    process: (instance) ->
      instance.innerEl = instance.el
      instance.innerEl.setAttribute "data-lang", Socialite.settings.twitter.lang  unless instance.innerEl.getAttribute("data-lang")
      instance.el = document.createElement("div")
      instance.el.className = instance.innerEl.className
      instance.innerEl.className = ""
      instance.innerEl.parentNode.insertBefore instance.el, instance.innerEl
      instance.el.appendChild instance.innerEl

    init: (instance) ->
      instance.innerEl.className = "twitter-tweet"

    activate: twitterActivate

  ###
  Google+
  https://developers.google.com/+/plugins/+1button/
  Google does not support IE7
  ###
  Socialite.network "googleplus",
    script:
      src: "//apis.google.com/js/plusone.js"

    append: (network) ->
      return false  if window.gapi
      window.___gcfg =
        lang: Socialite.settings.googleplus.lang
        parsetags: "explicit"

  googleplusInit = (instance) ->
    el = document.createElement("div")
    el.className = "g-" + instance.widget.gtype
    Socialite.copyDataAttributes instance.el, el
    instance.el.appendChild el
    instance.gplusEl = el

  googleplusEvent = (instance, callback) ->
    (if (typeof callback isnt "function") then null else (data) ->
      callback instance.el, data
    )

  googleplusActivate = (instance) ->
    type = instance.widget.gtype
    if window.gapi and window.gapi[type]
      settings = Socialite.settings.googleplus
      params = Socialite.getDataAttributes(instance.el, true, true)
      events = ["onstartinteraction", "onendinteraction", "callback"]
      i = 0

      while i < events.length
        params[events[i]] = googleplusEvent(instance, settings[events[i]])
        i++
      window.gapi[type].render instance.gplusEl, params

  Socialite.widget "googleplus", "one",
    init: googleplusInit
    activate: googleplusActivate
    gtype: "plusone"

  Socialite.widget "googleplus", "share",
    init: googleplusInit
    activate: googleplusActivate
    gtype: "plus"

  Socialite.widget "googleplus", "badge",
    init: googleplusInit
    activate: googleplusActivate
    gtype: "plus"

  ###
  LinkedIn
  http://developer.linkedin.com/plugins/share-button/
  ###
  Socialite.network "linkedin",
    script:
      src: "//platform.linkedin.com/in.js"

  linkedinInit = (instance) ->
    el = document.createElement("script")
    el.type = "IN/" + instance.widget.intype
    Socialite.copyDataAttributes instance.el, el
    instance.el.appendChild el
    if typeof window.IN is "object" and typeof window.IN.parse is "function"
      window.IN.parse instance.el
      Socialite.activateInstance instance

  Socialite.widget "linkedin", "share",
    init: linkedinInit
    intype: "Share"

  Socialite.widget "linkedin", "recommend",
    init: linkedinInit
    intype: "RecommendProduct"

) window, window.document, window.Socialite

###
Execute any queued functions (don't enqueue before the document has loaded!)
###
(->
  s = window._socialite
  if /Array/.test(Object::toString.call(s))
    i = 0
    len = s.length
    while i < len
      s[i]()  if typeof s[i] is "function"
      i++
)()
