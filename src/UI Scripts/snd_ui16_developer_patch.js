/*!
  UI16 Developer Patch
  Configuration can be modified using system properties prefixed with 'snd_ui16dp'.

  James Neale <james@sndeveloper.com>
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

      // Patch the navigator right click context menu
      navigator_context: {
        active: "${snd_ui16dp.navigator.context.active}" == "true",
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
      Holding a key and clicking mouse button 2 will open the
      application or module record that was clicked.
      This saves going to applications or modules to find it.
    **/
    function navigatorPatch() {

      if (!userHasRole('teamdev_configure_instance')) {
        return;
      }

      createContextMenu('snd_ui16dp_navigator_module_menu', [
        'Edit module'
      ]);

      $('#gsft_nav').snd_ui16dp_menu({
          event: 'contextmenu',
          selector: 'a[data-id]',
          menu_id: "#snd_ui16dp_navigator_module_menu",
          callback: function (invokedOn, selectedMenu) {
            var id = invokedOn.attr('data-id'),
                url = '/sys_app_module.do';
            if (!id) {
              jslog('No data id.');
              return;
            }
            if (selectedMenu.text() == 'Edit module') {
              if (invokedOn.hasClass('nav-app')) {
                url = '/sys_app_application.do';
              }

              jslog('snd_ui16_developer_patch opening navigation module');
              openLink(url + '?sys_id=' + id);
            } else {
              jslog('Unknown item selected.');
            }
          }
      });
      jslog('snd_ui16_developer_patch navigator patch applied');
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
          icon;
      createContextMenu(id, items);
      icon = $('.' + className + ' span.label-icon');
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
      var is_admin = userHasRole(),
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
      items.push('Refresh');
      if (is_admin) items.push('Import from XML');

      callback = function (invokedOn, selectedMenu) {
        switch (selectedMenu.text()) {
          case 'View Current':
            var sys_id = $('#update_set_picker_select').val();
            if (sys_id) {
              sys_id = sys_id.split(':').pop(); // remove 'string:' prefix
              openLink('/sys_update_set.do?sys_id=' + sys_id);
            }
            break;
          case 'Create New':
            openLink('/sys_update_set.do?sys_id=-1');
            break;
          case 'View All':
            openLink('sys_update_set_list.do');
            break;
          case 'View In Progress':
            openLink('sys_update_set_list.do?sysparm_query=state%3Din%20progress');
            break;
          case 'View Retrieved':
            openLink('sys_remote_update_set_list.do');
            break;
          case 'Import from XML':
            var url = 'upload.do';
            url += '?';
            url += 'sysparm_referring_url=sys_remote_update_set_list.do';
            url += '&';
            url += 'sysparm_target=sys_remote_update_set';
            openLink(url);
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
      items.push('View Current');
      items.push('Create New');
      items.push('-');
      items.push('View All');
      items.push('App Manager');
      items.push('-');
      items.push('Refresh');

      callback = function (invokedOn, selectedMenu) {
        switch (selectedMenu.text()) {
          case 'View Current':
            var sys_id = $('#application_picker_select').val();
            if (sys_id) {
              sys_id = sys_id.split(':').pop(); // remove 'string:' prefix
              openLink('/sys_scope.do?sys_id=' + sys_id);
            }
            break;
          case 'Create New':
            openLink('$sn_appcreator.do');
            break;
          case 'View All':
            openLink('sys_scope_list.do');
            break;
          case 'App Manager':
            openLink('$myappsmgmt.do');
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
                  openLink('/' + domain_table + '.do?sys_id=' + sys_id);
                }
              }
              break;
            case 'Create New':
              openLink(domain_table + '.do?sys_id=-1');
              break;
            case 'View All':
              openLink(domain_table + '_list.do');
              break;
            case 'Domain Map':
              openLink('domain_hierarchy.do?sysparm_stack=no&sysparm_attributes=record=domain,parent=parent,title=name,description=description,baseid=javascript:getPrimaryDomain();');
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
      var impersonate_item;

      function addUnimpersonateItem() {
        impersonate_item.parent().after('<li><a href="snd_ui16dp_unimpersonate.do"' +
          ' target="gsft_main">Unimpersonate</a>');
        jslog('snd_ui16_developer_patch user menu patch applied.');
      }

      // will only add unimpersonate link if impersonate link is found
      impersonate_item = $('#user_info_dropdown').next('ul').find('[sn-modal-show="impersonate"]');

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
    }

    function openLink(target) {
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

      var interval;

      // === run the navigator module opening mod ===
      if (config.navigator_context.active) {
        navigatorPatch();
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
          interval = setInterval(function () {
            pickerWidthPatch();
          }, 1000);
          setTimeout(function () {
            clearInterval(interval);
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