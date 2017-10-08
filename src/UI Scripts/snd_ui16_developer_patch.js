/*!
  UI16 Developer Patch
  Configuration can be modified using system properties prefixed with 'snd_ui16dp'.

  James Neale <james@thewhitespace.io>
*/

if (!window.top.hasOwnProperty('snd_ui16_developer_patch')) {
  jslog('snd_ui16_developer_patch loading in top window.');
  (function (t) {
    var i;
    t.snd_ui16_developer_patch = null;

    // run an interval because depending on ServiceNow version, this script
    // can load before jQuery does.
    i = setInterval(function () {
      if (typeof t.jQuery === 'function') {
        t.jQuery.getScript('/snd_ui16_developer_patch.jsdbx');
        clearInterval(i);
      }
    }, 500);
  })(window.top);
}

else if (window.top.snd_ui16_developer_patch != null) {
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
    function minVersion(letter) {
      var tag = '${glide.buildtag}';
      var tag_word = tag.match(/glide-([^-]+)/);
      var tag_letter = tag_word ? tag_word[1].toString()[0].toUpperCase() : '';
      return letter <= tag_letter;
    }

    // add custom stylesheet to the page
    function addStyle(css) {
      $(document).ready(function() {
        $('<style type="text/css">\n' + css + '\n</style>').appendTo(document.head);
      });
    }

    /**
      summary:
        Check if we are using UI16 by looking for the overview help element.
        Thanks to Tim Boelema for finding this element and sharing on community.
    **/
    function isUI16() {
      if (!window.top.angular) return false;
      var a = window.top.angular.element('overviewhelp').attr('page-name');
      return a == 'ui16' || a == 'helsinki';
    }

    // create the context menus dynamically
    function createContextMenu(id, items) {
      var menu, i;
      menu = '<ul id="' + id + '" class="dropdown-menu" role="menu" ' +
             'style="display: none; z-index: 999;">';

      for (i = 0; i < items.length; i++) {
        if (items[i] === '-') {
          menu += '<li class="divider"></li>';
        } else {
          menu += '<li><a href="#" tabindex="-1">' + items[i] + '</a></li>';
        }
      }

      menu += '</ul>';
      $('body').append(menu);
    }

    /**
    summary:
      Allow quick access to navigator records in Geneva
    description:
      Right clicking will open a context menu for the module.
      This saves going to applications or modules to find it.
    **/
    function navigatorMenuPatch() {
      var items = [],
          post_helsinki;

      if (!userHasRole('teamdev_configure_instance')) {
        return;
      }

      items.push('Open in new window');
      items.push('Edit');

      if (userHasRole()) {
        items.push('-');
        items.push('Stats')
        items.push('Cache');
        items.push('System logs');
      }

      createContextMenu('snd_ui16dp_navigator_module_menu', items);

      post_helsinki = minVersion('I');

      // a[id] was introduced in Istanbul. This is backwards compatible to G and H UI16
      $('#gsft_nav').snd_ui16dp_menu({
          event: 'contextmenu',
          selector: 'a[data-id],a[id]', 
          menu_id: "#snd_ui16dp_navigator_module_menu",
          callback: function (invokedOn, selectedMenu) {
            var target = invokedOn.closest('a'),
                id = target.attr('data-id'),
                url = '/sys_app_module.do',
                text = selectedMenu.text();

            if (!id) {
              id = target.attr('id');
              if (post_helsinki) {
                if (!target.hasClass('app-node') && !target.hasClass('module-node')) {
                  jslog('Not an app or module node.');
                  return;
                }
              }
              if (!id) {
                jslog('No data id.');
                return;
              }
            }

            switch (text) {
              case 'Edit':
                if (target.hasClass('nav-app') || target.hasClass('app-node')) {
                  url = '/sys_app_application.do';
                }
                jslog('snd_ui16_developer_patch opening navigation module');
                openInFrame(url + '?sys_id=' + id);
                break;
              case 'Open in new window':
                if (target.attr('href')) {
                  window.open(target.attr('href'), id);
                }
                break;
              case 'Stats':
                window.open('/stats.do', 'stats');
                break;
              case 'Cache':
                window.open('/cache.do', 'cache');
                break;
              case 'System logs':
                window.open('/syslog_list.do', 'syslog');
                break;
              default:
                jslog('Unknown item selected.');
            }
          }
      });
      jslog('snd_ui16_developer_patch navigator patch applied');
    }

    // hide the edit pencil which was added in Istanbul
    function navigatorPencilPatch() {
      var post_helsinki = minVersion('I');
      if (post_helsinki) {

        // hide the new pencil icon - we have edit via context menu
        addStyle(
          'div.sn-widget-list-action.nav-edit-module,' +
          'a.sn-aside-btn.nav-edit-app {' +
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
      summary:
        Update the developer choice list widths to be a bit wider
      description:
        Gets the widths of various header elements and calculates
        the remaining width available then divides it between the
        pickers shown.
    **/
    function pickerWidthPatch(offset) {
      var max_w = config.picker_width.max_width,
          min_w = config.picker_width.min_width,
          pickers = $('.navpage-pickers .selector:has(select)'),
          nav_w,
          logo_w,
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
      logo_w = $('div.navbar-header').outerWidth();
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
      summary:
        Make the update set and application icons clickable
      description:
        Geneva doesn't allow you to get to the update sets or applications
        easily from the header because the icons are not links.
        This makes the icons clickable.
    **/
    function pickerIconPatch() {
      var DevStudio = window.top.DevStudio,
          is_admin = userHasRole(),
          domain_table = config.picker_icon.domain_table,
          callback,
          items;

      items = [];
      items.push('View Current');
      items.push('Create New');
      items.push('-');
      items.push('View All');
      items.push('View In Progress');
      if (is_admin) items.push('View Retrieved');
      items.push('-');
      if (is_admin) items.push('Import');
      if (is_admin) items.push('Import from XML');
      items.push('Refresh');

      callback = function (invokedOn, selectedMenu) {
        switch (selectedMenu.text()) {
          case 'View Current':
            var sys_id = $('#update_set_picker_select').val();
            if (sys_id) {
              sys_id = sys_id.split(':').pop(); // remove 'string:' prefix
              openInFrame('/sys_update_set.do?sys_id=' + sys_id);
            }
            break;
          case 'Create New':
            openInFrame('/sys_update_set.do?sys_id=-1');
            break;
          case 'View All':
            openInFrame('sys_update_set_list.do');
            break;
          case 'View In Progress':
            openInFrame('sys_update_set_list.do?sysparm_query=state%3Din%20progress');
            break;
          case 'View Retrieved':
            openInFrame('sys_remote_update_set_list.do');
            break;
          case 'Import':
            openInFrame('sys_update_set_source_list.do');
            break;
          case 'Import from XML':
            var url = 'upload.do';
            url += '?';
            url += 'sysparm_referring_url=sys_remote_update_set_list.do';
            url += '&';
            url += 'sysparm_target=sys_remote_update_set';
            openInFrame(url);
            break;
          case 'Refresh':
            refreshPickers();
            break;
          default:
            jslog('Unknown item selected.');
        }
      };
      patchIcon('updateset', 'concourse-update-set-picker', items, callback);

      // patch application picker icon
      items = [];
      items.push('Open Studio');
      items.push('-');
      items.push('View Current');
      items.push('Create New');
      items.push('-');
      items.push('View All');
      items.push('App Manager');
      items.push('-');
      items.push('Refresh');

      callback = function (invokedOn, selectedMenu) {
        var app_id = $('#application_picker_select').val();
        app_id = app_id.split(':').pop(); // remove 'string:' prefix

        var window_name = config.dev_studio.allow_multiple ? app_id : 'studio';

        switch (selectedMenu.text()) {
          case 'Open Studio':
            if (app_id) {
              var url = '/$studio.do?sysparm_transaction_scope=' + app_id + '&sysparm_nostack=true';
              if (!DevStudio || !DevStudio.isOpen(window_name) || DevStudio.navigatedAway(window_name)) {
                win = window.open(url); // : window.open(url, window_name, features, false);
              } else {
                win = DevStudio.getWindow(window_name);
                search = win.location.search;
                if (search.indexOf('sysparm_transaction_scope=' + app_id) < 0) {
                  win.location.replace(url);
                }
              }
              win.focus();
              if (DevStudio) {
                DevStudio.addWindow(window_name, win);
              }
            }
            break;
          case 'View Current':
            if (app_id) {
              openInFrame('/sys_scope.do?sys_id=' + app_id);
            }
            break;
          case 'Create New':
            openInFrame('$sn_appcreator.do');
            break;
          case 'View All':
            openInFrame('sys_scope_list.do');
            break;
          case 'App Manager':
            openInFrame('$myappsmgmt.do');
            break;
          case 'Refresh':
            refreshPickers();
            break;
          default:
            jslog('Unknown item selected.');
        }
      };
      patchIcon('application', 'concourse-application-picker', items, callback);

      // patch domain picker icon for domain admins only
      if (userHasRole('domain_admin')) {
        items = [];
        items.push('View Current');
        items.push('Create New');
        items.push('-');
        items.push('View All');
        items.push('Domain Map');
        items.push('-');
        items.push('Refresh');

        callback = function (invokedOn, selectedMenu) {
          switch (selectedMenu.text()) {
            case 'View Current':
              var sys_id = $('#domain_picker_select').val();
              if (sys_id) {
                sys_id = sys_id.split(':').pop(); // remove 'string:' prefix
                if (sys_id == 'global') {
                  alert('The global domain does not exist as a domain record.');
                } else {
                  openInFrame('/' + domain_table + '.do?sys_id=' + sys_id);
                }
              }
              break;
            case 'Create New':
              openInFrame(domain_table + '.do?sys_id=-1');
              break;
            case 'View All':
              openInFrame(domain_table + '_list.do');
              break;
            case 'Domain Map':
              openInFrame('domain_hierarchy.do?sysparm_stack=no&sysparm_attributes=record=domain,parent=parent,title=name,description=description,baseid=javascript:getPrimaryDomain();');
              break;
            case 'Refresh':
              refreshPickers();
              break;
            default:
              jslog('Unknown item selected.');
          }
        };
        patchIcon('domain', 'concourse-domain-picker', items, callback);
      }
    }

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

    function openInFrame(target) {
      jslog('snd_ui16_developer_patch opening target: ' + target);
      var frame = $('#gsft_main');
      if (frame.length) {
        frame[0].src = target;
      } else {
        jslog('> gsftMain frame not found.');
      }
    }

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

    function userHasRole(role) {
      var roles = (',' + window.NOW.user.roles + ','),
          is_admin = roles.indexOf(',admin,') > -1;
      if (roles) {
        return is_admin || roles.indexOf(',' + role + ',') > -1;
      }
      return is_admin;
    }

    $(document).ready(function () {
      try {
        if (!isUI16()) {
          window.snd_ui16_developer_patch = false;
          jslog('snd_ui16_developer_patch ignored. Not UI16.');
        } else {
          jslog('Running snd_ui16_developer_patch...');
          patch();
          window.snd_ui16_developer_patch = true;
        }
      } catch (e) {
        jslog('SND Developer Patch UI16 mod failure: ' + e);
      }
    });

  })(jQuery, window);
}