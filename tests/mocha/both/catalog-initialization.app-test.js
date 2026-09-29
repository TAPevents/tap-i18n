import {expect} from 'chai';
import {TAPi18n} from 'meteor/tap:i18n';
import {TapI18nTest} from '../../helpers';

if (TapI18nTest.scenario === 'catalog-initialization') describe('TAPi18n - compiled catalog invalidation', function () {
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
});
