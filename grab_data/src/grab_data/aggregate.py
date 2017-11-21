"""Aggregate Data
Usage:
main <start-date> <end-date>
main 2017-06-11 2017-08-11"""

import os
import pandas as pd
import logging as log
from docopt import docopt
from datetime import datetime
from grab_data.download import are_dates_valid

COLS_GENERAL_METRICS = ['payload.pull_request.changed_files', 'payload.pull_request.commits',
                        'payload.pull_request.merged', 'payload.pull_request.comments',
                        'payload.pull_request.number', 'payload.pull_request.base.repo.open_issues_count',
                        'days_open_merged', 'creator_merge']
METRICS = ['mean', 'std', '25%', '50%', '75%']
LANGUE_COL = ['payload.pull_request.base.repo.language', 'cohort']
DATA_FOLDER = os.path.join(os.path.abspath(os.path.join(__file__, '../../../..')), 'data')


def get_data(path, start_date, end_date):
    """
    Concatenate all data by day
    :param path: path where the raw data in stored
    :param start_date: string
    :param end_date: string
    :return: dataframe with all files concatenated
    """
    all_dates = list(map(lambda x:
                         x.strftime('%Y-%m-%d').replace('-0', '-'),
                         list(pd.date_range(start_date, end_date))))
    all_files_requeried = list(map(lambda x: 'data_{d}_{d}.csv'.format(d=x), all_dates))
    diff = list(set(all_files_requeried) - set(os.listdir(path)))

    if diff:
        raise ValueError('The following files are not available: {f}'.format(f=diff))

    path_files = list(map(lambda x: os.path.join(path, x), all_files_requeried))

    df = pd.DataFrame()
    for p in path_files:
        df = pd.concat([df, pd.read_csv(p)])

    return df


def create_new_cols(df):
    """
    Create new usefull columns
    :param df: dataframe
    :return: dataframe plus new columns
    """
    df['days_open_merged'] = ((pd.to_datetime(df['payload.pull_request.merged_at'])
                               - pd.to_datetime(df['payload.pull_request.created_at']))
                              .apply(lambda x: x.days))
    df['creator_merge'] = df['payload.pull_request.merged_by.login'] == df['actor.display_login']
    df['cohort'] = pd.to_datetime(df['created_at']).apply(lambda x: x.strftime('%Y-%m'))

    return df

def aggregate_by_language(df):
    """
    Aggregate data by usefull metrics
    :param df: dataframe
    :return: dataframe with aggregated informations
    """
    agg_by_language = pd.DataFrame(df[COLS_GENERAL_METRICS + LANGUE_COL]
                                   .groupby(LANGUE_COL)
                                   .describe()
                                   .unstack(1)
                                   .unstack(1)
                                   .reset_index()
                                   .rename(columns={'level_0': 'column',
                                                    'level_1': 'metric',
                                                    'payload.pull_request.base.repo.language': 'language',
                                                    0: 'value'}))
    agg_by_language = agg_by_language[agg_by_language['metric'].apply(lambda x: x in METRICS)]
    count_by_language = pd.DataFrame(df
                                     .groupby(LANGUE_COL)
                                     .size()
                                     .reset_index()
                                     .rename(columns={'payload.pull_request.base.repo.language': 'language',
                                                      0: 'number_prs'}))
    return (agg_by_language
            .merge(count_by_language, on=LANGUE_COL, how='left'))



if __name__ == '__main__':
    log.getLogger().setLevel(log.INFO)

    arguments = docopt(__doc__)
    start_date = arguments['<start-date>']
    end_date = arguments['<end-date>']

    are_dates_valid(start_date, end_date)

    df = get_data(DATA_FOLDER, start_date, end_date)
    df = create_new_cols(df)
    agg_by_language = aggregate_by_language(df)

    file_agg_data = os.path.join(DATA_FOLDER, 'agg_language_{s}_{e}__processedat_{n}.csv'
                                 .format(s=start_date, e=end_date, n=datetime.now().strftime('%Y-%m-%d')))
    print(file_agg_data.shape)
    file_agg_data.to_csv(file_agg_data, index=False)
    log.info('The data was saved in {f}'.format(f=file_agg_data))
