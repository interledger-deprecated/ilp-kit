/* globals mixpanel */
import rga from 'react-ga'

export default class Tracker {
  init (config) {
    // Google analytics
    if (config.ga) {
      rga.initialize(config.ga)
      this.rga = rga
    }

    // Mixpanel
    if (config.mixpanel) {
      /*eslint-disable */
      (function(e,b){if(!b.__SV){var a,f,i,g;window.mixpanel=b;b._i=[];b.init=function(a,e,d){function f(b,h){var a=h.split(".");2==a.length&&(b=b[a[0]],h=a[1]);b[h]=function(){b.push([h].concat(Array.prototype.slice.call(arguments,0)))}}var c=b;"undefined"!==typeof d?c=b[d]=[]:d="mixpanel";c.people=c.people||[];c.toString=function(b){var a="mixpanel";"mixpanel"!==d&&(a+="."+d);b||(a+=" (stub)");return a};c.people.toString=function(){return c.toString(1)+".people (stub)"};i="disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config people.set people.set_once people.increment people.append people.union people.track_charge people.clear_charges people.delete_user".split(" ");
        for(g=0;g<i.length;g++)f(c,i[g]);b._i.push([a,e,d])};b.__SV=1.2;a=e.createElement("script");a.type="text/javascript";a.async=!0;a.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===e.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";f=e.getElementsByTagName("script")[0];f.parentNode.insertBefore(a,f)}})(document,window.mixpanel||[]);
      /*eslint-enable */

      this.mixpanel = true
      mixpanel.init(config.mixpanel)
    }
  }

  pageview (location) {
    return this.rga && this.rga.pageview(location)
  }

  track (name, props) {
    if (this.rga) {
      this.rga.event({
        category: 'General',
        action: name
      })
    }

    if (this.mixpanel) {
      mixpanel.track(name, props)
    }
  }

  identify (name) {
    if (this.mixpanel) {
      mixpanel.identify(name)
      mixpanel.people.set({
        $username: name,
        $name: name
      })
    }
  }

  clearIdentity () {
    if (this.mixpanel && mixpanel.cookie && mixpanel.cookie.clear) {
      mixpanel.cookie.clear()
    }
  }
}
