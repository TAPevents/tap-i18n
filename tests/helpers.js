import {Meteor} from 'meteor/meteor';

export const TapI18nTest = {
  scenario: (Meteor.settings.public || {}).tapI18nTestScenario || 'disabled',

  enabled: function () {
    return this.scenario !== 'disabled';
  },

  regularCatalog: function () {
    return this.enabled() && this.scenario !== 'raw-config' && this.scenario !== 'catalog-initialization';
  },

  languages: function () {
    if (this.scenario === 'configured') return ['cc', 'cc-CC', 'en', 'fr'];
    return ['bb', 'cc', 'cc-CC', 'en'];
  }
};

// TAPi18n's public async API uses jQuery Deferred. Convert its rejection values
// into Errors so Mocha's async/await tests report failures with useful messages.
export function asPromise(deferred) {
  return new Promise((resolve, reject) => {
    deferred.done(resolve).fail(error => reject(error instanceof Error ? error : new Error(String(error))));
  });
}
