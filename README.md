# !! Alpha: Not For Production Use

This package will connect ATOM to your Zesty.io Content Instance. Files will be pulled down locally. You can then edit the files and they will write directly to the development version of the file. To publish files you must be logged into the Zesty.io manager of that instance.

**Functionality Notes**

* Any existing view, stylesheet, or script on a cloud instance will synchronize and become editable through ATOM
* New files must be created through the Zesty.io manager editor interface
* Javascript and Stylesheets will save to the cloud, but will not compile into the `main.css` or `main.js` files, to compile you must save a stylesheet or javascript file in the zesty.io manager editor interface (this will change)

**Update: October 4, 2018**

* This package now uses the open source node api wrapper for Zesty.io https://github.com/zesty-io/zestyio-node-api-wrapper
* File creation is in the works, we plan to release this by Oct 8th
* Remote publishing is on its way, we plan to release this Oct 12th


Please help us complete this package by submitting feedback in the [zestyiodevs slack channel](https://chat.zesty.io/).

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

### In the works for alpha

* [complete] Have tray load information on the file opened
* [complete] Have tray load relative information on the model associated with the views
* Have tray show a publish button for the file
* Have tray show a synchronize button to get latest file code from the cloud
* Have tray show the model fields relative to the file you are working on
* [complete] Show relative stage preview URLs for each file

### Planned for beta

* Type ahead for Parsley models and fields

### Ideas

* Sync File Content from Zesty.io to Local File on Opening
	* Possibly check the file last edited and user who edited before writing to cloud to prevent collisions
