#!/usr/bin/env bash

set -e

bash bootstrap-python-env.sh

ENVPATH=$(dirname `realpath $0`)/python-env/
source $ENVPATH/bin/activate

FILEPATH=$(dirname `realpath $0`)/src/grab_data/main.py
python3 $FILEPATH
