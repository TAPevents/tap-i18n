#!/bin/bash

set -m

update_package_js_test_section () {
    test_name="$1"
    test_specific="$2"

    package_js_on_test="$(cat <<EOF
  api.use('coffeescript', ['client', 'server']);

  api.use(['tinytest', 'test-helpers'], ['client', 'server']);

  api.use(['test-pack-a'], ['client', 'server']);
  api.use(['test-pack-b'], ['client', 'server']);

  api.add_files('test/environments/$test_name/client.coffee', ['client']);
  api.add_files('test/environments/$test_name/server.coffee', ['server']);

  $test_specific
EOF
    )"
    package_js_on_test="$(sed ':a;N;$!ba;s/\n/\\n/g' <<< "$package_js_on_test")"
    package_js_on_test="${package_js_on_test//\//\\/}"

    perl -0777 -i -pe 's/(Package\.on_test\(function \(api\) \{).*?(\n\}\);)/$1'"$package_js_on_test"'$2/ms' package.js
}

run_meteor_test () {
    local test="$1"

    echo "run test $test"

    meteor rebuild-all

    meteor test-packages ./

    echo "test done $test"
}

environment="$1"

if [[ "$environment" == "" ]]; then
    echo $'Running all environments tests\n'
fi

test="enabled-default"
if [[ "$environment" == "" || "$environment" == "$test" ]]; then
    echo "Test Environment 1 ($test): tap-i18n enabled. default project-tap.i18n"
    echo "to run this test alone run $ unit-test.bash $test"

    cat > project-tap.i18n <<EOF
{}
EOF

    package_js_on_test="$(cat <<EOF
  api.add_files('project-tap.i18n', ['client', 'server']);
EOF
    )"

    update_package_js_test_section "$test" "$package_js_on_test"

    run_meteor_test $test
fi

test="enabled-custom"
if [[ "$environment" == "" || "$environment" == "$test" ]]; then
    echo "Test Environment 2 ($test): tap-i18n enabled. All custom settings"
    echo "to run this test alone run $ unit-test.bash $test"

    cat > project-tap.i18n <<EOF
{
    default_language: "pt",
    supported_languages: ["pt", "pt-BR", "fr"], // This array specify the languages the
                                                // project users are allowed to pick from
    build_files_path: null, // if null the i18n files will be delivered by the meteor project
    browser_path: "http://localhost:3000/translations/"
}
EOF

    package_js_on_test="$(cat <<EOF
  api.add_files('project-tap.i18n', ['client', 'server']);
EOF
    )"

    update_package_js_test_section "$test" "$package_js_on_test"

    run_meteor_test $test
fi

test="disabled"
if [[ "$environment" == "" || "$environment" == "$test" ]]; then
    echo "Test Environment 3 ($test): tap-i18n disabled"
    echo "to run this test alone run $ unit-test.bash $test"

    rm project-tap.i18n

    update_package_js_test_section "$test"

    run_meteor_test $test
fi

rm project-tap.i18n
