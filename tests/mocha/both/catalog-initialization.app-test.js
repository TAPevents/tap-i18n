import {expect} from 'chai';
import {TAPi18n} from 'meteor/tap:i18n';
import {Meteor} from 'meteor/meteor';
import {TapI18nTest} from '../../helpers';

if (TapI18nTest.scenario === 'catalog-initialization') describe('TAPi18n - compiled catalog invalidation', function () {
  if (Meteor.isClient) it('keeps the shared default-name table private to the package', function () {
    expect(typeof language_names).to.equal('undefined');
    expect(Package['tap:i18n']).not.to.have.property('language_names');
  });

  it('replaces early snapshots after generated configuration and language metadata writes', function () {
    const probe = Package['tap-i18n-tests:catalog-probe'].catalogProbe;
    expect(probe.disabled).to.equal(null);
    expect(probe.duringEnable.en.name).to.equal('Before configuration');
    expect(probe.afterConfiguration.en.name).to.equal('English');
    expect(Object.keys(probe.afterConfiguration)).to.deep.equal(['en']);
    expect(Object.keys(probe.afterLanguage)).to.deep.equal(['en', 'fr']);
    expect(probe.afterLanguage).not.to.equal(probe.afterConfiguration);
    expect(probe.afterConfiguration).not.to.equal(probe.duringEnable);
    expect(probe.afterLanguage.fr.name).to.equal('Français');
    expect(TAPi18n.getLanguagesCached()).to.deep.equal(probe.afterLanguage);
  });

  it('replaces intervening overrides and array/snapshot identities at every classic file', function () {
    const probe = Package['tap-i18n-tests:catalog-probe'].catalogProbe;
    expect(probe.overridden.fr.name).to.equal('Application override between files');
    expect(probe.secondNames).to.deep.equal(['French', 'Français']);
    expect(probe.secondNames).not.to.equal(probe.firstNames);
    expect(probe.thirdNames).to.deep.equal(probe.secondNames);
    expect(probe.thirdNames).not.to.equal(probe.secondNames);
    expect(probe.afterRepeat).not.to.equal(probe.overridden);
    expect(probe.afterSame).not.to.equal(probe.afterRepeat);
    expect(probe.afterSame.fr.name).to.equal('Français');
    if (Meteor.isClient) {
      expect(probe.invalidationsBeforeStop).to.equal(2);
      expect(probe.reactiveReads.map(catalog => catalog.fr.name)).to.deep.equal([
        'Application override between files', 'Français', 'Français'
      ]);
    }
  });

  it('retains explicit module imports and their interleaved metadata writes', function () {
    const probe = Package['tap-i18n-tests:catalog-module-probe'].moduleProbe;
    expect(probe.afterFirst).not.to.equal(probe.before);
    expect(probe.overridden.fr.name).to.equal('Override between imported modules');
    expect(probe.secondNames).to.deep.equal(['French', 'Français']);
    expect(probe.secondNames).not.to.equal(probe.firstNames);
    expect(probe.afterSecond).not.to.equal(probe.overridden);
    expect(probe.afterSecond.fr.name).to.equal('Français');
    expect(Object.keys(probe.afterSecond)).to.deep.equal(['en', 'fr']);
  });
});
