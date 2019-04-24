# Atom Editor in Beta

This package connects Atom to your Zesty.io Content Instance. Files are pulled down locally from the cloud to your computer. A developer can then edit content instance files (views, css, javascript) and save them directly to the instance's development versions of the associated file. To publish files you must be logged into the Zesty.io manager of that instance.

**Functionality Notes**

* Any existing view, stylesheet, or script on a cloud instance will synchronize and become editable through Atom
* New files may be created from on the local machine, and they will sync to the cloud content instance
* Javascript and CSS files can be created remotely from the local project, and will be synced to the cloud instance
* This package now uses the open source node api wrapper for Zesty.io https://github.com/zesty-io/zestyio-node-api-wrapper
* Tray loads relative stage URL to the view being edited
* Stylesheets and javascript compile in the cloud on save (SASS, SCSS, LESS supported)

### New in this Release

Release 0.32.6 adds the following functionality:

* Login support - users can now login to Zesty.io from within the Atom editor.  This includes support for uses using Authy two factor authentication both by manual entry of the 2FA code and through the use of the One Touch app

### What still needs to be developed in beta

* Fix requirement to quit and reopen Atom to activate the plugin
* Have tray show a synchronize button to get latest file code from the cloud
* Have tray show the model fields relative to the file you are working on
* Better exposure of error codes / reasons should a save fail (for example when saving a less file with syntax errors that will not compile in the cloud successfully)

### Planned for post production

* Type ahead for Parsley models and fields to enmulate the expierence in 
* Remote publishing button for views
* Have tray show a publish button for the file
* Have publish trigger a cache refresh/destroy

Submit feedback in the [zestyiodevs slack channel](https://chat.zesty.io/).

---

## Zesty.io ATOM plugin

Syncs Atom project to a Zesty.io Cloud Content Instance to sync and write files, and build Parsley autocomplete references.

## How to use

Create a directory and start an empty project in it. Then create a file in the root directory named `zesty.json`

To get started, you need a JSON object that looks like:

```
{
	"instanceZUID": "INSTANCE_ZUID_TO_CONNECT_TO",
	"token": "ACCESS_TOKEN_FROM_ZESTY_IO"
}
```

This information can be accessed from the Zesty.io Manager Code Editor tab. From inside that tab, there is a link in the object helper tray labeled "external editing". Click that tray option for this file.

You may now also omit the token and the plugin will ask you to login to Zesty.io interactively.  This will also now happen if the token becomes stale.  The login process will manage writing the new token to `zesty.json` for you.
