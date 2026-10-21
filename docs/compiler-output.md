# Generated language registration

Non-English project translation files emit one browser call to
`TAPi18n._registerLanguage(tag)` at the original input resource position. The
browser runtime and compiler load the same package-private default-name table
from `lib/plugin/etc/language_names.js`. It is not exported and does not itself
register any supported languages.

The internal helper copies the default pair (or `[tag, tag]` for an unknown tag)
into a fresh mutable array, assigns it to `languages_names[tag]`, and immediately
calls `invalidateLanguagesCache()`. Repeated registrations are intentional:
they replace intervening application overrides and invalidate existing catalog
snapshots and Tracker readers even when the names are equal. Never share a
default array with the public dictionary, skip repeated tags, or aggregate calls
across input resources. JavaScript can execute between translation files.

These metadata-only browser files need no Underscore or namespace declarations.
Their generated JavaScript resource is retained, including when imported as a
module. Default configuration remains in its original first-file position.
English catalogs, explicit project configuration, namespaced package setup and
template registration, and all server output retain their existing paths and
invalidation boundaries. The helper/table are browser-only; server startup and
translation-resource merging are unchanged.

This trades a fixed browser cost (the complete default-name table and a helper)
for smaller output per translation file. Small applications with few translation
files can grow; large applications with many repeated languages benefit. Measure
whole production bundles with the same source snapshot and minifier, and report
raw and compressed sizes separately. Source reduction alone does not establish
faster application startup or fewer runtime registrations.

## Verification

Run the ordinary fixture matrix and the legacy-browser matrix:

```sh
npm test --prefix tests
TEST_CLIENT_ARCH=web.browser.legacy npm test --prefix tests
```

Both run real Meteor server tests and isolated Chrome. The browser adapter
asserts the served architecture to reject fallback to the modern bundle.
Legacy JavaScript is executed by current Chrome; this does not establish support
for every historical browser engine.

The catalog-initialization fixture covers reads during enablement, interleaved
overrides, repeated equal-value registration, fresh array/snapshot identities,
Tracker invalidation, classic files and explicitly imported translation modules.
Fast compiler tests cover all default name pairs, unknown tags, modern/legacy/
Cordova targets, source-resource retention, repeated batches and error recovery.

For compiler changes, also compare clean and live incremental Meteor builds:
add/remove/rename translations, switch JSON/YAML, add/remove project and package
configuration, and add/remove package dependencies. Compile a real Cordova
program separately; compiler adapters do not prove Meteor linker behavior.
Keep these acceptance artifacts attributable to the exact tested source.
