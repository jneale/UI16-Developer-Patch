/*!
  UI16 Developer Patch
  Configuration can be modified using system properties prefixed with 'snd_ui16dp'.

  James Neale <james@sharelogic.com>
*/

if (!window.top.hasOwnProperty('snd_ui16_developer_patched')) {
  jslog('snd_ui16_developer_patch loading in top window.');
  (function (t) {
    function fail(jqxhr, settings, e) {
      if(jqxhr.readyState === 0){
         jslog('snd_ui16_developer_patch unable to load script.');
      } else {
         // script loaded but failed to parse
         jslog('snd_ui16_developer_patch script loading error: ' + e.toString());
      }
    }

    var i;

    t.snd_ui16_developer_patched = null;

    // run an interval because depending on ServiceNow version, this script
    // can load before jQuery does.
    i = setInterval(function () {
      var $ = t.jQuery;
      if (typeof $ == 'function') {
        clearInterval(i);

        $.when(
            $.getScript('/snd_ui16_developer_patch_menus.jsdbx').fail(fail),
            $.getScript('/snd_ui16_developer_patch.jsdbx').fail(fail),
            $.Deferred(function (deferred){
                $(deferred.resolve);
            })
        ).done(function(){
          t.snd_ui16_developer_patch();
        });
      }
    }, 500);
  })(window.top);
}

else if (window.top.snd_ui16_developer_patched != null) {
  //jslog('snd_ui16_developer_patch already applied!');
}

else if (window == window.top) {
  (function ($, window) {

    var config = {

      // Patch the navigator
      navigator: {

        // Modify the width of the navigator
        width: parseInt("${snd_ui16dp.navigator.width}", 10) || 285,
      },

      // Patch the navigator right click context menu
      navigator_context: {
        active: "${snd_ui16dp.navigator.context.active}" == "true",

        // Should the new Edit Pencil be hidden from menu items in Istanbul?
        // Should only hide with this context menu patch active.
        hide_pencil: "${snd_ui16dp.navigator.pencil.hide}" == "true"
      },

      // Patch the application and update set picker widths
      picker_width: {
        active: "${snd_ui16dp.pickers.active}" == "true",

        // Integer. Maximum width in pixels we would ever really need
        max_width: parseInt("${snd_ui16dp.pickers.width.max}", 10) || 300,

        // Integer. Minimum width in pixels.
        // 120 is the ServiceNow default, but we use 60 in case the window is
        // small and the search bar is opened (otherwise it's unusable)
        min_width: parseInt("${snd_ui16dp.pickers.width.min}", 10) || 60,

        // Integer. Time in ms to wait so that everything can load.
        load_timeout: parseInt("${snd_ui16dp.pickers.timeout}", 10) || 2000,

        // the width of the header search when it has focus
        max_search_width: parseInt("${snd_ui16dp.pickers.max_search_width}", 10) || 150
      },

      // Patch the header picker icons
      picker_icon: {
        active: "${snd_ui16dp.pickers.icon.active}" == "true",
        domain_table: "${snd_ui16dp.pickers.icon.domain_table}" || "domain"
      },

      profile_menu: {
        active: "${snd_ui16dp.profile.menu.active}" == "true",
        check_impersonation: "${snd_ui16dp.profile.menu.check_impersonation}" == "true",
        link_preferences: "${snd_ui16dp.profile.menu.link_preferences}" == "true"
      },

      dev_studio: {
        allow_multiple: "${sn_devstudio.allow.multi.app.development}" == "true"
      }

    };

    /**
     * A jQuery menu plugin for running context menus
     *
     * @param  {Object} settings An object for configuring the menu.
     * @return {Array} The jQuery array of elements being worked on.
     */
    $.fn.snd_ui16dp_menu = (function () {

      var menus = {},
          loaded = false;

      function getMenuPosition($menu, mouse, direction, scrollDir) {
        var win = $(window)[direction](),
            scroll = $(window)[scrollDir](),
            menu = $menu[direction](),
            position = mouse + scroll;

        // opening menu would pass the side of the page
        if (mouse + menu > win && menu < mouse) position -= menu;

        return position;
      }

      function closeAll() {
        for (var id in menus) {
          $(id).hide();
        }
      }

      return function (settings) {

        menus[settings.menu_id] = true;

        if (!loaded) {

          //make sure menus close on main document click
          $(document).click(function () {
            closeAll();
          });

          // make sure menus close if any frame is clicked
          $('iframe').on('load', function () {
             $(this).contents().on('click', function () {
                closeAll();
             });
          });

          loaded = true;
        }

        return this.each(function () {

          // Open context menu
          $(this).on(settings.event || 'click', settings.selector, function (e) {

            var $menu;

            closeAll();

            // perform native action if pressing control
            if (e.ctrlKey) return;

            //open menu
            $menu = $(settings.menu_id);
            $menu.data("invokedOn", $(e.target))
              .show()
              .css({
                  position: "absolute",
                  left: getMenuPosition($menu, e.clientX, 'width', 'scrollLeft'),
                  top: getMenuPosition($menu, e.clientY, 'height', 'scrollTop')
              })
              .off('click')
              .on('click', 'a', function (e) {
                  $menu.hide();

                  var $invokedOn = $menu.data("invokedOn");
                  var $selectedMenu = $(e.target);

                  settings.callback.call(this, $invokedOn, $selectedMenu);
              });

            return false;
          });
        });
      };
    })();

    // check if the letter of the build tag is valid H >= I = false
    /**
     * Check if the letter of the build tag is valid. e.g. H >= I == false.
     *
     * @param  {String} letter The first letter of the version (e.g. K for Kingston)
     * @return {Boolean}       Returns true if the system version is at least the
     *                         version specified as being the minimum.
     */
    function minVersion(letter) {
      var tag = '${glide.buildtag}';
      var tag_word = tag.match(/glide-([^-]+)/);
      var tag_letter = tag_word ? tag_word[1].toString()[0].toUpperCase() : '';
      return letter <= tag_letter;
    }

    /**
     * Add a custom stylesheet to the page.
     *
     * @param {String} css The CSS to inject.
     */
    function addStyle(css) {
      $(document).ready(function() {
        $('<style type="text/css">\n' + css + '\n</style>').appendTo(document.head);
      });
    }

    /**
     * Check if we are using UI16 by looking for the overview help element.
     * Thanks to Tim Boelema for finding this element and sharing on community.
     *
     * Works in Helsinki, Istanbul, Jakarta and Kingston EA
     *
     * @return {Boolean}
     */
    function isUI16() {
      if (!window.top.angular) return false;
      var a = window.top.angular.element('overviewhelp').attr('page-name');
      return a && !isPolaris();
    }

    function isPolaris() {
      return window.top.NOW.isPolarisEnabled == 'true';
  }

    /**
     * Create the context menus dynamically
     *
     * @param  {String} id    The ID of the context menu.
     * @param  {Array}  items An array of menu item objects - specifying at least a name.
     * @return {undefined}
     */
    function createContextMenu(id, items) {
      var menu, item, i;
      menu = '<ul id="' + id + '" class="dropdown-menu" role="menu" ' +
             'style="display: none; z-index: 999;">';

      for (i = 0; i < items.length; i++) {
        item = items[i];
        if (item.role && !userHasRole(item.role)) {
          continue;
        }
        if (item.name === '-') {
          menu += '<li class="divider"></li>';
        } else {
          menu += '<li><a href="#" tabindex="-1">' + item.name + '</a></li>';
        }
      }

      menu += '</ul>';
      $('body').append(menu);
    }

    /**
     * Execute a menu item.
     *
     * @param  {Object} item The item to execute.
     * @param  {Array}  args Optional. An array of arguments to pass to functions.
     * @return {undefined}
     */
    function executeMenuItem(item, options) {
      var target = item.target,
          url = item.url,
          fn = item.fn;

      if (item.name == 'Refresh') {
        refreshPickers();
        return;
      }
      if (fn && typeof fn == 'function') {
        fn.call(window, options, config);
      }
      if (url) {
        if (typeof url == 'function') {
          url = url.call(window, options, config);
        }
        url += '';
        if (!url) {
          jslog('No URL to open.');
          return;
        }
        if (typeof target == 'function') {
          target = target.call(window, options, config);
        }
        if (!target || target == 'gsft_main') {
          openInFrame(url);
        } else {
          window.open(url, target);
        }
      }
    }

    /**
     * Allow quick acces to navigator records. Right clicking a navigator module
     * will open a context menu.
     *
     * @return {undefined}
     */
    function navigatorMenuPatch() {
      function callback(invokedOn, selectedMenu) {
        var module = invokedOn.closest('a'),
            id = module.attr('data-id'),
            url = '/sys_app_module.do',
            text = selectedMenu.text();

        if (!id) {
          id = module.attr('id');
          if (post_helsinki) {
            if (!module.hasClass('app-node') && !module.hasClass('module-node')) {
              jslog('Not an app or module node.');
              return;
            }
          }
          if (!id) {
            jslog('No data id.');
            return;
          }
        }
        module.$id = id;

        var item, i;
        for (i = 0; i < items.length; i++) {
          item = items[i];
          if (item.name == text) {
            executeMenuItem(item, {
              module: module
            });
            return;
          }
        }
        jslog('Unknown item selected: "' + text + '"');
      }

      var items = snd_ui16_developer_patch_menus.navigator(),
          post_helsinki;

      if (!userHasRole('teamdev_configure_instance')) {
        return;
      }

      createContextMenu('snd_ui16dp_navigator_module_menu', items);

      post_helsinki = minVersion('I');

      // a[id] was introduced in Istanbul. This is backwards compatible to G and H UI16
      $('#gsft_nav').snd_ui16dp_menu({
          event: 'contextmenu',
          selector: 'a[data-id],a[id]',
          menu_id: "#snd_ui16dp_navigator_module_menu",
          callback: callback
      });
      jslog('snd_ui16_developer_patch navigator patch applied');
    }

    // hide the edit pencil which was added in Istanbul
    /**
     * Hide the edit pencil which was added in Istanbul. We don't need it if we have
     * the context menu - it just takes up space.
     *
     * @return {undefined}
     */
    function navigatorPencilPatch() {
      var post_helsinki = minVersion('I');
      if (post_helsinki) {

        // hide the new pencil icon - we have edit via context menu
        addStyle(
          '#gsft_nav .sn-aside-btn.nav-edit-app,' +
          '#gsft_nav .sn-widget-list-action.nav-edit-module' +
          '{' +
            'display: none !important;' +
          '}'
        );

        // removing the pencil means we can shrink the navigator and give some
        // more width to the main frame (-28px)
        var width = config.navigator.width; // normally 285
        if (width != 285) {
          $('.navpage-nav').width(width);
          $('#nav_west').width(width);
          $('.navpage-main').css('left', width + 'px');
        }

        jslog('snd_ui16_developer_patch navigator pencil patch applied.');
      }
    }

    /**
     * Update the developer choice list widths to be a bit wider.
     * This gets the widths of various header elements and calculates the
     * remaining width available before dividing it between the pickers shown.
     *
     * @param  {Integer} offset An offset to take into account when calculating
     *                          the maximum width available.
     * @return {undefined}
     */
    function pickerWidthPatch(offset) {
      var max_w = config.picker_width.max_width,
          min_w = config.picker_width.min_width,
          pickers = $('.navpage-pickers .selector:has(select)'),
          nav_w,
          logo_w = 0,
          float_w,
          diff,
          size;

      if (!pickers.length) {
        jslog('snd_ui16_developer_patch picked width patch failed. No pickers found.');
        return;
      }

      $('.navpage-pickers').css('display', '');
      pickers.css('width', ''); // reset so we recalculate

      nav_w = $('header.navpage-header').width();
      if (minVersion('M')) { // Madrid introduced flex grow
        $('div.navbar-header').children().outerWidth(function (i, w) { logo_w += w; });
      } else {
        logo_w = $('div.navbar-header').outerWidth();
      }
      float_w = $('div.navbar-right').outerWidth();

      diff = nav_w - logo_w - float_w - (offset || 0);

      size = 100 + (diff / pickers.length);

      size = size > max_w ? max_w : size;

      if (size < min_w) {
        $('.navpage-pickers').css('display', 'none');
        jslog('snd_ui16_developer_patch pickers hidden as less than minimum width (' + size + ' < ' + min_w + ')');
      } else {
        pickers.css('width', size);
        jslog('snd_ui16_developer_patch picker width patch applied (diff: ' + diff + '; size: ' + size + ')');
      }
    }

    /**
     * Patch a picker icon so it becomes interactive and has a context menu.
     *
     * @param  {String}   name      The name of the context menu - forms the ID.
     * @param  {String}   className The class name of the icon to patch.
     * @param  {Array}    items     An array of item objects to generate the menu.
     * @param  {Function} callback  The function to call when something is clicked.
     * @return {undefined}
     */
    function patchIcon(name, className, items, callback) {
      var id = 'snd_ui16dp_' + name + '_menu',
          post_istanbul = minVersion('J'),
          icon;
      createContextMenu(id, items);
      icon = $('.' + className + ' ' + (post_istanbul ? 'a.btn-icon' : 'span.label-icon'));
      if (icon.length) {
        icon.snd_ui16dp_menu({
          menu_id: "#" + id,
          callback: callback
        }).css('cursor', 'pointer');
        jslog('snd_ui16_developer_patch icon picker patch applied to ' + name + ' picker.');
      } else {
        jslog('snd_ui16_developer_patch icon picker patch unable to find ' + name + ' picker.');
      }
    }


    /**
     * Patch the Update Set picker icon with a context menu.
     *
     * @return {undefined}
     */
    function patchUpdateSetPickerIcon() {
      function callback(invokedOn, selectedMenu) {
        var set_id = set_id = $('#update_set_picker_select').val(),
            text = selectedMenu.text(),
            item,
            i;
        for (i = 0; i < items.length; i++) {
          item = items[i];
          if (item.name == text) {
            executeMenuItem(item, {
              set_id: set_id
            });
            return;
          }
        }
        jslog('Unknown item selected: "' + text + '"');
      }

      var items = snd_ui16_developer_patch_menus.update_set();

      patchIcon('updateset', 'concourse-update-set-picker', items, callback);
    }

    /**
     * Patch the Application picker icon with a context menu.
     *
     * @return {undefined}
     */
    function patchAppPickerIcon() {

      function getAppId() {
        var app_id = $('#application_picker_select').val();
        return app_id.split(':').pop(); // remove 'string:' prefix
      }

      function callback(invokedOn, selectedMenu) {
        var app_id = getAppId(),
            text = selectedMenu.text(),
            item,
            i;

        for (i = 0; i < items.length; i++) {
          item = items[i];
          if (item.name == text) {
            executeMenuItem(item, {
              app_id: app_id
            });
            return;
          }
        }
        jslog('Unknown item selected: "' + text + '"');
      }

      var items = snd_ui16_developer_patch_menus.application();

      patchIcon('application', 'concourse-application-picker', items, callback);
    }

    /**
     * Patch the Domain picker icon with a context menu.
     *
     * @return {undefined}
     */
    function patchDomainPickerIcon() {

      function getDomainId() {
        var sys_id = $('#domain_picker_select').val();
        if (sys_id) {
          sys_id = sys_id.split(':').pop(); // remove 'string:' prefix
        }
        return sys_id;
      }

      function callback(invokedOn, selectedMenu) {
        var domain_id = getDomainId(),
            text = selectedMenu.text(),
            item,
            i;
        for (i = 0; i < items.length; i++) {
          item = items[i];
          if (item.name == text) {
            executeMenuItem(item, {
              domain_table: domain_table,
              domain_id: domain_id
            });
            return;
          }
        }
        jslog('Unknown item selected: "' + text + '"');
      }

      var domain_table = config.picker_icon.domain_table;
      var items = snd_ui16_developer_patch_menus.domain();

      patchIcon('domain', 'concourse-domain-picker', items, callback);
    }

    /**
     * Make the all the developer picker icons (update set, application, domain)
     * show a context menu when they are clicked.
     *
     * @return {undefined}
     */
    function pickerIconPatch() {
      patchUpdateSetPickerIcon();
      patchAppPickerIcon();
      if (userHasRole('domain_admin')) {
        patchDomainPickerIcon();
      }
    }

    /**
     * Patch the user profile menu by adding more items to it, most importantly
     * the ability to unimpersonate.
     *
     * @return {undefined}
     */
    function profileMenuPatch() {
      var user_dropdown = $('#user_info_dropdown').next('ul'),
          impersonate_item;

      function addUnimpersonateItem() {
        impersonate_item.parent().after('<li><a href="snd_ui16dp_unimpersonate.do"' +
          ' target="gsft_main">Unimpersonate</a>');
        jslog('snd_ui16_developer_patch user menu patch applied.');
      }

      // will only add unimpersonate link if impersonate link is found
      impersonate_item = user_dropdown.find('[sn-modal-show="impersonate"]');

      if (impersonate_item) {
        if (config.profile_menu.check_impersonation) {
          $.ajax({
            url: '/snd_ui16dp.do?action=getImpersonationDetails',
            type: 'GET',
            dataType: 'JSON'
          }).done(function (data) {
            if (data.result && data.result.is_impersonating) {
              addUnimpersonateItem();
            } else {
              jslog('snd_ui16_developer_patch confirmed user is not impersonating.');
            }
          }).fail(function () {
            jslog('snd_ui16_developer_patch failed to check impersonation details.');
          });
        } else {
          addUnimpersonateItem();
        }
      }

      // add link to user preferences if admin
      if (config.profile_menu.link_preferences && userHasRole()) {
        user_dropdown.children().first()
            .after('<li><a href="/sys_user_preference_list.do?sysparm_query=user=' + top.NOW.user.userID + '" ' +
                   'target="gsft_main">Preferences</a></li>');
      }
    }

    /**
     * Open a url in the main frame.
     *
     * @param  {String} target The target URL to load.
     * @return {undefined}
     */
    function openInFrame(target) {
      jslog('snd_ui16_developer_patch opening target: ' + target);
      var frame = $('#gsft_main');
      if (frame.length) {
        frame[0].src = target;
      } else {
        jslog('> gsftMain frame not found.');
      }
    }

    /**
     * Refresh all the developer pickers (Update Set, Application, Domain).
     * This is really handy when you want to be sure you are working in the
     * correct place.
     *
     * @return {undefined}
     */
    function refreshPickers() {
      var injector = angular.element('body').injector();
      try {
        injector.get('snCustomEvent').fire('sn:refresh_update_set');
      } catch (e) {}
      try {
        injector.get('applicationService').getApplicationList();
      } catch (e) {}
      try {
        injector.get('domainService').getDomainList();
      } catch (e) {}
    }

    /**
     * Check if the user has a give role. Will always return true for admin.
     *
     * @param  {String} role The role to check.
     * @return {Boolean}
     */
    function userHasRole(role) {
      var roles = (',' + window.NOW.user.roles + ','),
          is_admin = roles.indexOf(',admin,') > -1;
      if (role) {
        return is_admin || roles.indexOf(',' + role + ',') > -1;
      }
      return is_admin;
    }

    /**
     * The main patch function that executes everything.
     *
     * @return {undefined}
     */
    function patch() {

      var nav_interval,
          picker_interval;

      // === run the navigator module opening mod ===
      if (config.navigator_context.active) {
        navigatorMenuPatch();

        if (config.navigator_context.hide_pencil) {
          navigatorPencilPatch();
        }
      }

      // === enhance the picker width ===
      if (config.picker_width.active) {

        // as we are dynamically resizing the header pickers we can remove the
        // medium width restriction introduced in later versions of UI16
        $('.navpage-pickers').removeClass('hidden-md');

        // set the picker width once the page has loaded
        setTimeout(function () {
          pickerWidthPatch();

          // use an interval to double check the picker width every second
          // for the same load time specified by the user (double chance)
          picker_interval = setInterval(function () {
            pickerWidthPatch();
          }, 1000);
          setTimeout(function () {
            clearInterval(picker_interval);
          }, config.picker_width.load_timeout);

        }, config.picker_width.load_timeout);

        // resizing the window will resize the pickers
        angular.element(window).on('resize', function () {
          pickerWidthPatch();
        });

        $('input#sysparm_search').focus(function () {
          //$j('.navpage-header-content .user-name').hide();
          pickerWidthPatch(config.picker_width.max_search_width);
        });
        $('input#sysparm_search').blur(function () {
          setTimeout(function () {
            //$j('.navpage-header-content .user-name').show();
            pickerWidthPatch();
          }, 500); // the length of time it takes for blur to occur
        });
      }

      // === make the picker icons clickable ===
      if (config.picker_icon.active) {
        pickerIconPatch();
      }

      // === augment the user menu ===
      if (config.profile_menu.active) {
        profileMenuPatch();
      }
    }

    window.top.snd_ui16_developer_patch = function () {
      try {
        if (window.top.snd_ui16_developer_patched != null) {
          jslog('snd_ui16_developer_patch already applied.');
          return;
        }
        if (!isUI16()) {
          window.top.snd_ui16_developer_patched = false;
          jslog('snd_ui16_developer_patch ignored. Not UI16.');
        } else {
          jslog('Running snd_ui16_developer_patch...');
          patch();
          window.top.snd_ui16_developer_patched = true;
        }
      } catch (e) {
        jslog('UI16 Developer Patch mod failure: ' + e);
      }
    };

  })(jQuery, window);
}