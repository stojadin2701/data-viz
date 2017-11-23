import os
import pandas as pd
from itertools import product
from datetime import datetime

BASE_URL = 'http://data.githubarchive.org/'
DATA_FOLDER = os.path.join(os.path.abspath(os.path.join(__file__, '../../../..')), 'data')


def are_dates_valid(start, end):
    """
    Check if the dates are valid
    :param start: string
    :param end: string
    :return: None, just throws a error if start and end date are invalid
    """
    try:
        start = datetime.strptime(start, '%Y-%m-%d')
        end = datetime.strptime(end, '%Y-%m-%d')
    except:
        raise ValueError('invalid dates')

    if end < start:
        raise ValueError('start date must be greater or equal to end date')

    if end >= datetime.today():
        raise ValueError('end date must be before today')


def get_urls(start_date, end_date):
    """
    Generate all urls github's files
    :param start_date: string
    :param end_date: string
    :return: list of strings with the entire url for each date and hour of day
    """
    days = list(pd.date_range(start_date, end_date, freq='1D'))
    days_str = map(lambda x: x.strftime('%Y-%m-%d'), days)
    days_hours = product(range(0, 24), days_str)

    fn_url = lambda x: BASE_URL + x[1] + '-' + str(x[0]) + '.json.gz'

    return map(fn_url, days_hours)


def get_data(path, start_date, end_date):
    """
    Concatenate all data by day
    :param path: path where the raw data in stored
    :param start_date: string
    :param end_date: string
    :return: dataframe with all files concatenated
    """
    all_dates = map(lambda x: x.strftime('%Y-%m-%d'), pd.date_range(start_date, end_date))
    # xunxo! I shouldn't be doing it! It is to work around the files saved like `2017-11-8` instead of `2017-11-08`
    fixed_dates = list(
        map(lambda x: '-'.join(x.split('-')[0:-1] + [('-' + x.split('-')[-1]).replace('-0', '').replace('-', '')]),
            all_dates))
    all_files_requeried = list(map(lambda x: 'data_{d}_{d}.csv'.format(d=x), fixed_dates))
    diff = list(set(all_files_requeried) - set(os.listdir(path)))

    if diff:
        raise ValueError('The following files are not available: {f}'.format(f=diff))

    path_files = list(map(lambda x: os.path.join(path, x), all_files_requeried))

    df = pd.DataFrame()
    for p in path_files:
        df = pd.concat([df, pd.read_csv(p)])

    return df
