# !! Alpha: Not For Production Use

Currently the Atom package will connect to your content instance and download all of the files. You can then edit the files and they will write directly to the development version of the file. To publish files you must be logged into the Zesty.io manager of that instance.

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

* Have tray load information on the file opened
* Have tray load relative information on the model associated with the views
* Have tray show a publish button for the file

### Ideas

* Sync File Content from Zesty.io to Local File on Opening
	* Possibly check the file last edited and user who edited before writing to cloud to prevent collisions
