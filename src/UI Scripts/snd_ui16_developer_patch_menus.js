/**
 * A list of functions that return arrays of menu items.
 *
 * Return menu item arrays have menu items that look like this:
 *   {
 *     name   {String}          The label shown to the user.
 *     fn     {Function}        Optional. A function to do whatever you like.
 *     target {Function|String} The name of the target window.
 *                              A function must return a string.
 *     url    {Function|String} The address to load in the target window.
 *                              A function must return a string.
 *   }
 *
 * All functions are passed in two arguments:
 *   options {Object} An array of options relevent to the menu. See localised
 *                    menu comments for what options are available.
 *   config  {Object} The configuration object containing system properties.
 *
 * @return {Array}
 */
var snd_ui16_developer_patch_menus = {

  /**
   * Menu items for the navigator module context menu.
   *
   * Function options:
   *   module  The selected module element.
   *
   * @return {Array}
   */
  navigator: function () {
    return [
      {
        name: 'Open in new window',
        target: function (options) {
          return options.module.$id;
        },
        url: function (options) {
          if (options.module.hasClass('nav-app') || options.module.hasClass('app-node')) {
            return '';
          }
          return options.module.attr('href');
        }
      },
      {
        name: 'Edit',
        role: 'admin',
        url: function (options) {
          var url = '/sys_app_module.do';
          if (options.module.hasClass('nav-app') || options.module.hasClass('app-node')) {
            url = '/sys_app_application.do';
          }
          jslog('snd_ui16_developer_patch opening navigation module');
          return url + '?sys_id=' + options.module.$id;
        }
      },
      {
        name: '-',
        role: 'admin'
      },
      {
        name: 'Events',
        role: 'admin',
        target: 'events',
        url: '/sysevent_list.do?sysparm_query=sys_created_onONToday%40javascript%3Ags.daysAgoStart(0)%40javascript%3Ags.daysAgoEnd(0)'
      },
      {
        name: 'Properties',
        role: 'admin',
        target: 'properties',
        url: '/sys_properties_list.do'
      },
      {
        name: 'Preferences',
        role: 'admin',
        target: 'preferences',
        url: '/sys_user_preference_list.do'
      },
      {
        name: 'Logs',
        role: 'admin',
        target: 'syslog',
        url: '/syslog_list.do'
      },
      {
        name: '-',
        role: 'admin'
      },
      {
        name: 'Cache',
        role: 'admin',
        target: 'cache',
        url: '/cache.do'
      },
      {
        name: 'Stats',
        role: 'admin',
        target: 'stats',
        url: '/stats.do'
      }
    ];
  },

  /**
   * Menu items for the update set picker icon context menu.
   *
   * Function options:
   *   set_id  The sys_id of the selected update set.
   *
   * @return {Array}
   */
  update_set: function () {
    return [
     {
        name: 'View Current',
        url: function (options) {
          if (options.set_id) {
            options.set_id = options.set_id.split(':').pop(); // remove 'string:' prefix
            return '/sys_update_set.do?sys_id=' + options.set_id;
          }
        }
      },
      {
        name: 'Create New',
        url: '/sys_update_set.do?sys_id=-1'
      },
      {
        name: '-'
      },
      {
        name: 'View All',
        url: 'sys_update_set_list.do'
      },
      {
        name: 'View In Progress',
        url: 'sys_update_set_list.do?sysparm_query=state%3Din%20progress'
      },
      {
        name: 'View Retrieved',
        role: 'admin',
        url: 'sys_remote_update_set_list.do'
      },
      {
        name: '-'
      },
      {
        name: 'Import from Remote',
        role: 'admin',
        url: 'sys_update_set_source_list.do'
      },
      {
        name: 'Import from XML',
        role: 'admin',
        url: 'upload.do' +
             '?' +
             'sysparm_referring_url=sys_remote_update_set_list.do' +
             '&' +
             'sysparm_target=sys_remote_update_set'
      },
      {
        name: '-',
        role: 'admin'
      },
      {
        name: 'Refresh'
      }
    ];
  },

  /**
   * Menu items for the application picker icon context menu.
   *
   * Function options:
   *   app_id  The sys_id of the selected application.
   *
   * @return {Array}
   */
  application: function () {
    return [
      {
        name: 'Open Studio',
        fn: function (options, config) {
          var DevStudio = window.top.DevStudio,
              window_name,
              url;

          if (options.app_id) {
            window_name = config.dev_studio.allow_multiple ? options.app_id : 'studio';
            url = '/$studio.do?sysparm_transaction_scope=' + options.app_id + '&sysparm_nostack=true';

            if (!DevStudio || !DevStudio.isOpen(window_name) || DevStudio.navigatedAway(window_name)) {
              win = window.open(url); // : window.open(url, window_name, features, false);
            } else {
              win = DevStudio.getWindow(window_name);
              search = win.location.search;
              if (search.indexOf('sysparm_transaction_scope=' + options.app_id) < 0) {
                win.location.replace(url);
              }
            }
            win.focus();
            if (DevStudio) {
              DevStudio.addWindow(window_name, win);
            }
          }
        }
      },
      {
        name: '-'
      },
      {
        name: 'View Current',
        url: function (options) {
          if (options.app_id) {
            return '/sys_scope.do?sys_id=' + options.app_id;
          }
        }
      },
      {
        name: 'Create New',
        url: '$sn_appcreator.do'
      },
      {
        name: '-'
      },
      {
        name: 'View All',
        url: 'sys_scope_list.do'
      },
      {
        name: 'App Manager',
        url: '$myappsmgmt.do'
      },
      {
        name: '-'
      },
      {
        name: 'Refresh'
      }
    ];
  },

  /**
   * Menu items for the domain picker icon context menu.
   *
   * Function options:
   *   domain_id    The sys_id of the selected domain.
   *   domain_table The name of the configured domain table.
   *
   * @return {Array}
   */
  domain: function () {
    return [
      {
        name: 'View Current',
        url: function (options) {
          if (options.domain_id == 'global') {
            alert('The global domain does not exist as a domain record.');
          } else {
            return '/' + options.domain_table + '.do?sys_id=' + options.domain_id;
          }
        }
      },
      {
        name: 'Create New',
        url: function (options) {
          return options.domain_table + '.do?sys_id=-1';
        }
      },
      {
        name: '-'
      },
      {
        name: 'View All',
        url: function (options) {
          return options.domain_table + '_list.do';
        }
      },
      {
        name: 'Domain Map',
        url: 'domain_hierarchy.do?sysparm_stack=no&' +
             'sysparm_attributes=record=domain,parent=parent,title=name,description=description,baseid=javascript:getPrimaryDomain();'
      },
      {
        name: '-'
      },
      {
        name: 'Refresh'
      }
    ];
  }
};