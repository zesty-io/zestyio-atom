# Alpha: For Testing Only, Planned Beta for Jan 1st.

This package connects ATOM to your Zesty.io Content Instance. Files are be pulled down locally. A developer can then edit content instance files (views, css, javascript) and they write directly to the instance's development versions of the associated file. To publish files you must be logged into the Zesty.io manager of that instance.

**Functionality Notes**

* Any existing view, stylesheet, or script on a cloud instance will synchronize and become editable through ATOM
* New files may be created from the local, and they will sync to the cloud content instance
* Javascript and Stylesheets will save to the cloud, but will not compile into the `main.css` or `main.js` files, to compile you must save a stylesheet or javascript file in the zesty.io manager editor interface (this will change)
* Javascript and CSS files can be created remotely from the local project, and will be synced to the cloud instance
* This package now uses the open source node api wrapper for Zesty.io https://github.com/zesty-io/zestyio-node-api-wrapper
* File creation is in the works from local
* Tray loads relative stage URL to the view being edited
* Stylesheets and javascript compile in the cloud on save (SASS, SCSS, LESS supported)

### What still needs to be developed in beta (Post Jan 1)

* Remote login screen (removes the need for juggling session tokens in zesty.json)
* Have tray show a synchronize button to get latest file code from the cloud
* Have tray show the model fields relative to the file you are working on

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
