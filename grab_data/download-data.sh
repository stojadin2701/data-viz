#!/usr/bin/env bash

set -e

START_DATE=2017-11-17
END_DATE=2017-11-17
FILEPATH=$(dirname `realpath $0`)/src/grab_data/download.py
ENVPATH=$(dirname `realpath $0`)/data-viz-env/

echo "It'll grab github's data from ${START_DATE} to ${END_DATE} and can take couple hours."
echo "Do you wanna proceed? (y/n)"
read DECISION
if [[ $DECISION == "y" ]]
then
    bash bootstrap-python-env.sh
    source $ENVPATH/bin/activate

    python3 $FILEPATH $START_DATE $END_DATE
fi
