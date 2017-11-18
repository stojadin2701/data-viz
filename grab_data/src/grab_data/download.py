"""Grab Data
Usage:
main <start-date> <end-date>
main 2017-06-11 2017-08-11"""

import io
import os
import gzip
import json
import pandas as pd
import logging as log
from itertools import product
from urllib import request
from docopt import docopt
from datetime import datetime

BASE_URL = 'http://data.githubarchive.org/'
VALID_EVENTS = ['PullRequestEvent']
VALID_ACTIONS = ['closed']
COLS_TO_KEEP = ['id', 'created_at', 'type', 'public',
                'actor.id', 'actor.url', 'actor.display_login', 'org.id',  # info about creator
                'payload.action', 'payload.number',  # info about payload
                'payload.pull_request.number', 'payload.pull_request.title',  # info about pull request
                'payload.pull_request.comments', 'payload.pull_request.commits',
                'payload.pull_request.author_association', 'payload.pull_request.additions',
                'payload.pull_request.created_at', 'payload.pull_request.closed_at', 'payload.pull_request.merged',
                'payload.pull_request.merged_at', 'payload.pull_request.merged_by.id',
                'payload.pull_request.merged_by.login', 'payload.pull_request.merged_by.type',
                'repo.id', 'repo.name', 'repo.url',  # info about repo
                'payload.pull_request.head.repo.pushed_at', 'payload.pull_request.author_association',
                'payload.pull_request.base.repo.created_at', 'payload.pull_request.base.repo.language',
                'payload.pull_request.base.repo.watchers_count', 'payload.pull_request.base.repo.open_issues_count',
                'payload.pull_request.head.repo.size', 'payload.pull_request.changed_files',
                'payload.pull_request.head.repo.description', 'payload.pull_request.head.repo.has_downloads',
                'payload.pull_request.head.repo.has_issues', 'payload.pull_request.head.repo.has_pages',
                'payload.pull_request.head.repo.has_projects', 'payload.pull_request.head.repo.has_wiki'
                ]


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


def read_file(url):
    """
    Read files from github
    :param url: string with entire url of `json.gz` file
    :return: list of dictionaries
    """
    log.info('Reading from {u}'.format(u=url))

    response = request.urlopen(url)
    compressed_file = io.BytesIO(response.read())
    decompressed_file = gzip.GzipFile(fileobj=compressed_file)

    data = []
    for line in decompressed_file.readlines():
        data.append(json.loads(line))

    return data


def filter_data(data):
    """
    Filter list of observations by event type, action type and if language is available
    :param data: list of dictionaries
    :return: list of dictionaries with filtered data
    """
    filter_events = lambda x: x['type'] in VALID_EVENTS
    filter_actions = lambda x: x['payload']['action'] in VALID_ACTIONS
    filter_langue = lambda x: pd.notnull(x['payload']['pull_request']['base']['repo']['language'])

    filtered_data = filter(filter_events, data)
    filtered_data = filter(filter_actions, filtered_data)
    filtered_data = filter(filter_langue, filtered_data)

    return filtered_data


def read_and_filter(url):
    return filter_data(read_file(url))


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


if __name__ == '__main__':
    log.getLogger().setLevel(log.INFO)

    arguments = docopt(__doc__, version='FIXME')
    start_date = arguments['<start-date>']
    end_date = arguments['<end-date>']

    are_dates_valid(start_date, end_date)

    urls = get_urls(start_date, end_date)
    data = map(read_and_filter, urls)
    flat_data = [item for sublist in data for item in sublist]
    del data

    df = pd.io.json.json_normalize(flat_data)[COLS_TO_KEEP]
    del flat_data

    file_path = os.path.join(os.path.abspath(os.path.join(__file__, '../../../..')),
                             'data', 'data_{s}_{e}.csv'.format(s=start_date, e=end_date))
    df.to_csv(file_path)

    log.info('The data was saved in {f}'.format(f=file_path))
