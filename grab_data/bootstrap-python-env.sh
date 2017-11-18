#!/usr/bin/env
set -e

ENVPATH=$(dirname `realpath $0`)/data-viz-env/

if [ -d $ENVPATH ]; then rm -rf $ENVPATH; fi

virtualenv -p python3 $ENVPATH
echo " --- virtualenv in $ENVPATH --- "
echo " --- activate virtualenv --- "

cd $(dirname $(dirname `realpath $0`))/grab_data/


source $ENVPATH/bin/activate
pip3 install -e .
deactivate
