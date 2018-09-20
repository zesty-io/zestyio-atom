'use babel';

import ZestyioAtom from '../lib/zestyio-atom-plugin';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('ZestyioAtom', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('zestyio-atom');
  });

  describe('when the zestyio-atom-plugin:toggle event is triggered', () => {
    it('hides and shows the modal panel', () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      expect(workspaceElement.querySelector('.zestyio-atom')).not.toExist();


      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        expect(workspaceElement.querySelector('.zestyio-atom')).toExist();

        let zestyioAtomPluginElement = workspaceElement.querySelector('.zestyio-atom');
        expect(zestyioAtomPluginElement).toExist();

        let zestyioAtomPluginPanel = atom.workspace.panelForItem(zestyioAtomPluginElement);
        expect(zestyioAtomPluginPanel.isVisible()).toBe(true);

        expect(zestyioAtomPluginPanel.isVisible()).toBe(false);
      });
    });

    it('hides and shows the view', () => {
      // This test shows you an integration test testing at the view level.

      // Attaching the workspaceElement to the DOM is required to allow the
      // `toBeVisible()` matchers to work. Anything testing visibility or focus
      // requires that the workspaceElement is on the DOM. Tests that attach the
      // workspaceElement to the DOM are generally slower than those off DOM.
      jasmine.attachToDOM(workspaceElement);

      expect(workspaceElement.querySelector('.zestyio-atom')).not.toExist();


      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        // Now we can test for view visibility
        let zestyioAtomPluginElement = workspaceElement.querySelector('.zestyio-atom');
        expect(zestyioAtomPluginElement).toBeVisible();
        atom.commands.dispatch(workspaceElement, 'zestyio-atom:toggle');
        expect(zestyioAtomPluginElement).not.toBeVisible();
      });
    });
  });
});
