## Zesty.io ATOM plugin

Syncs Atom project to a Zesty.io Cloud Content Instance to sync and write files, and build Parsley autocomplete references.

## How to use

The project need a file in the root directory named `zesty.json`

Example contents to get started

```
{
	"instanceZUID": "INSTANCE_ZUID_TO_CONNECT_TO",
	"token": "ACCESS_TOKEN_FROM_ZESTY_IO"
}
```

### Todos for alpha launch

* Stylesheet and Scripts Saving
* Have tray load information on the file opened
* Have tray load relative information on the model associated with the views
* Have tray show a publish button for the file

### Todos for beta launch

* parsley code highlighting (mixed html + handlebars)
*

### Ideas

* Sync File Content from Zesty.io to Local File on Opening
	* Possibly check the file last edited and user who edited before writing to cloud to prevent collisions
