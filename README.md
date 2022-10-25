# Zesty.io Atom IDE Package

Use this package to connect the [Atom IDE](https://atom.io/) to your [Zesty.io Content Instance](https://zesty.org/content-instance). Files are synced to your local computer from a remote content instance. You can then edit content instance files (views, css, javascript) and save them directly to the instance's development versions of the associated file. To publish files you must be logged into the Zesty.io manager of that instance.

## Getting Started

1. Install the [`zestyio-atom`](https://atom.io/packages/zestyio-atom) package.
```
apm install zestyio-atom
```

2. Create an empty directory for your instance.
```bash
mkdir mydomain.com
```

3. Create a file within your instance directory named `zesty.json`. 

   a) This file can also be created by the package using the Atom application dropdown *Packages > Zesty.io > Initialize*, or by using the key command shortcut (*ctrl + alt + i*)

4. Add the following JSON to the `zesty.json` file.
```
{
	"instanceZUID": "INSTANCE_ZUID",
	"token": "INSTANCE_TOKEN"
}
```

5. In the `zesty.json` file replace `INSTANCE_ZUID` & `INSTANCE_TOKEN` with the values from your instance. *This information can be accessed from the Zesty.io Manager Code Editor tab. From inside that tab, there is a link in the object helper tray labeled "external editing". Click that tray option to find these values.*

	a) You can also omit the `INSTANCE_TOKEN` and the package will provide an interative login to Zesty.io. This will also happen if the token becomes stale. The login process will manage writing the new access token to your `zesty.json` file.

6. Open your instance directory in Atom to trigger the instance sync. *If Atom is already open you will need to restart it.*

**Once syncing is completed you should see your instance code files in your Atom project file tree.**


### Functionality Notes

* Any existing view, stylesheet, or script on a cloud instance will synchronize and become editable through Atom
* New files may be created from on the local machine, and they will sync to the cloud content instance
* Javascript and CSS files can be created remotely from the local project, and will be synced to the cloud instance
* This package now uses the open source node api wrapper for Zesty.io https://github.com/zesty-io/zestyio-node-api-wrapper
* Tray loads relative stage URL to the view being edited
* Stylesheets and javascript compile in the cloud on save (SASS, SCSS, LESS supported)
* Custom endpoints for xml,json, html, etc. can be created by making a new file in your views folder with an extension

### Release Notes

Release 0.46.0

* Developer Token can optionally be stored outside the zesty.json file, and in the atom editor zestyio settings
* Better invalid session checking to trigger a login


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


### Planned for post production

* Type ahead for Parsley models and fields to enmulate the expierence inline (see https://codersblock.com/blog/creating-an-autocomplete-plug-in-for-atom/ and https://github.com/lonekorean/atom-autocomplete-boilerplate/blob/master/lib/basic-provider.js)
* Have tray show the model fields relative to the file you are working on
* open old version of code from the cloud

Submit feedback in the [zestyiodevs slack channel](https://chat.zesty.io/).

---
