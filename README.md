# UI16 Developer Patch

[**Get the Update Set.**](https://share.servicenow.com/app.do#/search-result?search_query=sndeveloper&startRow=NaN&sort_parameter=title)

*UI16 Developer Patch* is an addon for ServiceNow that enhances the UI16
interface to add some features that were taken away in the upgrade to UI16 or
just have never existed. Patches are configurable using system properties and
are applied using a global UI Script.

### Navigator Module Context Menus!
You can right click on any navigator menu application or module and choose
'Edit module' to edit the record.

![Navigator Menu](readme-assets/navigator-menu.png)

### Widened Header Dropdown
The choice list drop-downs in the header are 120px wide by default. This makes
them hard to read and work with, so this patch widens all the selectors in the
header, including Update Set, Application and Domain pickers.

The pickers are automatically resized when you resize the browser window or when
you open the global search. They are automatically hidden if there is literally
no room to show them.

The minimum and maximum widths can be controlled using system properties.

![Widened Pickers](readme-assets/pickers-wide-compare.png)

### Interactive Icons
By default, the icons in the header next to the Update Set and Application pickers don't do
anything. With this patch, you can now click the icon next to the selector and
it will open an action menu.

### Update Set Menu
Click the icon next to the update set picker to view a list of handy actions.

- View the current update set record.
- Create a new update set.
- View a list of all the update sets in the system.
- View a list of all the update sets that are in progress.
- Go to the Retrieved Update Sets list (admin only).
- Force refresh the update set picker.
- Navigate directly to Import an Update Set from XML (admin only).

![Update Set Menu](readme-assets/update-set-menu.png)

### Application Menu
Click the icon next to the application menu to view a list of handy actions.
- View the current application record.
- Create a new application.
- View all the application records in the system.
- Go directly to the App Manager.
- Force refresh the application picker.

![Application Menu](readme-assets/application-menu.png)

### Domain Menu
Click the icon next to the domain menu to view a list of handy actions. This
is restricted to the _domain_admin_ role.
- View the current domain record.
- Create a new domain.
- View all the domain records in the current domain.
- Go directly to the Domain Map.
- Force refresh the domain picker.

![Application Menu](readme-assets/domain-menu.png)

### User Profile Menu
The user profile menu has an 'Unimpersonate' option added so you (and any other
user with the 'Impersonate User' option) now have a handy link to quickly exit
impersonation.

![User Profile Menu](readme-assets/user-profile-menu.png)

### General

The patch is deployed as a ServiceNow global application.

An application menu is installed which gives easy access to properties
that control the patches.

## License

[MIT Licence](https://github.com/sn-developer/spoke/blob/master/LICENSE.md)
