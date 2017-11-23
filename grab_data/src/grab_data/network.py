"""Network
Usage:
main <start-date> <end-date> --by-month
main <start-date> <end-date>
main 2017-06-11 2017-08-11 --by-month
main 2017-06-11 2017-08-11"""

import os
import pandas as pd
import logging as log
from docopt import docopt
from datetime import datetime
from itertools import combinations

from grab_data import helpers

COLS = ['payload.pull_request.base.repo.language', 'actor.id', 'created_at']


def create_new_cols(df):
    """
    Create new usefull columns
    :param df: dataframe
    :return: dataframe plus new columns
    """
    df['cohort'] = pd.to_datetime(df['created_at']).apply(lambda x: x.strftime('%Y-%m'))

    return df


def network_connections(df):
    """
    Calculate connection among languages
    :param df: dataframe
    :return: matrix with the number distinct common actors
    """
    counts = df['payload.pull_request.base.repo.language'].value_counts()
    langues = list(counts[counts > 10].index)
    comb = list(combinations(langues, r=2)) + list(zip(langues, langues))
    df = df.set_index('payload.pull_request.base.repo.language')

    common = []

    for l1, l2 in comb:
        unique_actors_l1 = pd.Series(df.loc[l1]['actor.id']).unique()
        unique_actors_l2 = pd.Series(df.loc[l2]['actor.id']).unique()
        same_actors = len(set(unique_actors_l1) & set(unique_actors_l2))
        common.append((l1, l2, same_actors))

    return pd.DataFrame(common, columns=['language1', 'language2', 'common_actors'])


if __name__ == '__main__':
    log.getLogger().setLevel(log.INFO)

    arguments = docopt(__doc__)
    start_date = arguments['<start-date>']
    end_date = arguments['<end-date>']
    by_month = arguments['--by-month']

    helpers.are_dates_valid(start_date, end_date)

    df = helpers.get_data(helpers.DATA_FOLDER, start_date, end_date)[COLS]
    df = create_new_cols(df)

    if by_month:
        cohorts = df['cohort'].unique()

        for cohort in cohorts:
            network = network_connections(df[df['cohort'] == cohort])
            file_network_data = os.path.join(helpers.DATA_FOLDER, 'network_{c}__processedat_{n}.csv'
                                             .format(c=str(cohort), n=datetime.now().strftime('%Y-%m-%d')))
            network.to_csv(file_network_data, index=False)
            log.info('Network data was saved in {f}'.format(f=network))

    else:
        network = network_connections(df)
        file_network_data = os.path.join(helpers.DATA_FOLDER, 'network_{s}_{e}__processedat_{n}.csv'
                                         .format(s=start_date, e=end_date, n=datetime.now().strftime('%Y-%m-%d')))
        network.to_csv(file_network_data, index=False)
        log.info('Network data was saved in {f}'.format(f=network))
