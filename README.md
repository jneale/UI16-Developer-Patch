# UI16 Developer Patch

[**Get the Update Set.**](https://share.servicenow.com/app.do#/search-result?search_query=sndeveloper&startRow=NaN&sort_parameter=title)

*UI16 Developer Patch* is an addon for ServiceNow that runs as a global UI
script to enhance the UI16 interface.

### Context Menus!
Context menus are now part of this patch, which means you can right click on any
navigator menu application or module and choose 'Edit module' to edit the record.

![Navigator Menu](readme-assets/navigator-menu.png)

### Widened Header Dropdown
The patch widens the choice list drop-downs in the header, including the Update
Set selector and the Application selector. This makes it easier to see what you
are working with instead of sticking with the ServiceNow default of 120px.

![Widened Pickers](readme-assets/pickers-wide-compare.png)

### Interactive Icons
The standard UI16 icons are no longer interactive, making it difficult to get
access to the Application or Update Set record you are working with. With this
patch, you can now click the icon next to the selector and it will open a menu
with a host of actions.

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

### User Profile Menu
The user profile menu is augmented so you (and any other user with the
'Impersonate User' option) now have a handy 'Unimpersonate' link to quickly exit
impersonation.

![User Profile Menu](readme-assets/user-profile-menu.png)

### General

The patch is deployed as a ServiceNow global application.
An application menu is also installed which gives easy access to properties
that control the patches.

## License

[MIT Licence](https://github.com/sn-developer/spoke/blob/master/LICENSE.md)
