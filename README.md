# Zesty.io Atom Editor Plugin

This package connects Atom to your Zesty.io Content Instance. Files are pulled down locally from the cloud to your computer. A developer can then edit content instance files (views, css, javascript) and save them directly to the instance's development versions of the associated file. To publish files you must be logged into the Zesty.io manager of that instance.

**Functionality Notes**

* Any existing view, stylesheet, or script on a cloud instance will synchronize and become editable through Atom
* New files may be created from on the local machine, and they will sync to the cloud content instance
* Javascript and CSS files can be created remotely from the local project, and will be synced to the cloud instance
* This package now uses the open source node api wrapper for Zesty.io https://github.com/zesty-io/zestyio-node-api-wrapper
* Tray loads relative stage URL to the view being edited
* Stylesheets and javascript compile in the cloud on save (SASS, SCSS, LESS supported)
* Custom endpoints for xml,json, html, etc. can be created by making a new file in your views folder with an extension

### Release Notes

Planned for Release 0.45.0

* Developer Token now store outside the zesty.json file, and in the atom editor


Release 0.44.0

* Pull down Button for Single File available in file context

Release 0.43.0

* Publishing Button for Single Javascript, View, or CSS File


Release 0.42.0

* Instance View to add ZUID to a set
* Fixed login/instance ZUID input flow
* Fixed bug when tokens were not referenced in memory correctly

Release 0.40.0

* Audit Trail (cloud file change history) is now available when editing each file under in file context tray.
* Added clearer wording around file context
* fixed external compile bug. When an external compile occured, the new file would be ovewritten by the active editor content.


Release 0.39.0

* Initialize added, which creates a zesty.json file and prompts login

Release 0.38.0

* Removed arbitrary dates in zesty.io
* added instantiate call to dropdown menu
* Functionality: pull latest file from cloud available (ctrl + alt + g), or right click zesty.io pull
* Functionality: command to get new files available from dropdown or shortcut (ctrl + alt + a)
* Functionality: dropdown menu option to get all files and overwrite the existing one
* Functionality: login available from dropdown or shortcut (ctrl + alt + l)
* UX: After an instance sync, file context updates


Release 0.37.0

* Endpoint and Snippet file creation
* Endpoint, Snippet, and View file saving
* Quick link to web engine urls for custom endpoints like JSON, xml files etc.
* support for directories locally to map to custom endpoints, like `myweb.com/my/custom/file.json` is represented by a folder structure locally `/view/my/custom/` with a file named `file.json` in it
* Better exposure of error codes / reasons should a save fail (for example when saving a less file with syntax errors that will not compile in the cloud successfully)

### Still to be developed in Beta

* ~~Fix requirement to quit and reopen Atom to activate the plugin~~
* ~~Have tray show a synchronize button to get latest file code from the cloud~~ this is available by right clicking, using the package dropdown, or shortcut ctrl + alt + g
* ~~Remote publishing button for views~~
* ~~Have tray show a publish button for the file~~
* ~~Have publish trigger a cache refresh/destroy~~

### Planned for post production

* Type ahead for Parsley models and fields to enmulate the expierence inline (see https://codersblock.com/blog/creating-an-autocomplete-plug-in-for-atom/ and https://github.com/lonekorean/atom-autocomplete-boilerplate/blob/master/lib/basic-provider.js)
* Have tray show the model fields relative to the file you are working on
* open old version of code from the cloud

Submit feedback in the [zestyiodevs slack channel](https://chat.zesty.io/).

---

## Zesty.io ATOM plugin

Syncs Atom project to a Zesty.io Cloud Content Instance to sync and write files, and build Parsley autocomplete references.

## How to use

Create a directory and start an empty project in it. Then create a file in the root directory named `zesty.json`

This file can be created by the plugin from the ATOM application dropdown Packages > Zesty.io > Initilize, or by using the key command shortcut (ctrl + alt + i)

To get started, you need a JSON object that looks like:

```
{
	"instanceZUID": "INSTANCE_ZUID_TO_CONNECT_TO",
	"token": "ACCESS_TOKEN_FROM_ZESTY_IO"
}
```

INSTANCE_ZUID_TO_CONNECT_TO can be found in accounts.zesty.io, when looking into your instance settings.


This information can be accessed from the Zesty.io Manager Code Editor tab. From inside that tab, there is a link in the object helper tray labeled "external editing". Click that tray option for this file.

You may now also omit the token and the plugin will ask you to login to Zesty.io interactively.  This will also now happen if the token becomes stale.  The login process will manage writing the new token to `zesty.json` for you.
