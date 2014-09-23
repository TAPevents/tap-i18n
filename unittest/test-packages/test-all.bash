#!/bin/bash

# synchronously get the dev bundle and NPM modules if they're not there.
meteor --get-ready || exit 1

export URL='http://localhost:4096/'

for test_dir in *; do
    if [ -d "$test_dir" ]; then
        cd "$test_dir"

        echo "*************************************************"
        echo "*${test_dir}*"
        echo "*************************************************"

        mrt test-packages ./

        cd ..
    fi
done
