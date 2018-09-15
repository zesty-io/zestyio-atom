'use babel';

import ZestyioAtomPluginView from './zestyio-atom-plugin-view';
import { CompositeDisposable } from 'atom';
import request from 'request'

export default {

  zestyioAtomPluginView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.zestyioAtomPluginView = new ZestyioAtomPluginView(state.zestyioAtomPluginViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.zestyioAtomPluginView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'zestyio-atom-plugin:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.zestyioAtomPluginView.destroy();
  },

  serialize() {
    return {
      zestyioAtomPluginViewState: this.zestyioAtomPluginView.serialize()
    };
  },

	toggle() {
	  let editor
	  if (editor = atom.workspace.getActiveTextEditor()) {
	    let selection = editor.getSelectedText()
	    this.fetch(selection)
	  }
	},
	fetch() {
	  let editor
	  if (editor = atom.workspace.getActiveTextEditor()) {
	    let selection = editor.getSelectedText()
	    this.download(selection)
	  }
	},
	download(url) {
    return new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          resolve(body)
        } else {
          reject({
            reason: 'Unable to download page'
          })
        }
      })
    })
  }


};
