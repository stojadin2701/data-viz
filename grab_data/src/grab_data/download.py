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
from urllib import request
from docopt import docopt

from grab_data import helpers

BASE_URL = 'http://data.githubarchive.org/'
VALID_EVENTS = ['PullRequestEvent']
VALID_ACTIONS = ['closed']
COLS_TO_KEEP = ['id', 'created_at', 'type', 'public',
                'actor.id', 'actor.url', 'actor.display_login', 'org.id',  # info about creator
                'payload.action', 'payload.number',  # info about payload
                'payload.pull_request.number', 'payload.pull_request.title',  # info about pull request
                'payload.pull_request.comments', 'payload.pull_request.commits', 'payload.pull_request.additions',
                'payload.pull_request.created_at', 'payload.pull_request.closed_at', 'payload.pull_request.merged',
                'payload.pull_request.merged_at', 'payload.pull_request.merged_by.id',
                'payload.pull_request.merged_by.login', 'payload.pull_request.merged_by.type',
                'repo.id', 'repo.name', 'repo.url',  # info about repo
                'payload.pull_request.head.repo.pushed_at',
                'payload.pull_request.base.repo.created_at', 'payload.pull_request.base.repo.language',
                'payload.pull_request.base.repo.watchers_count', 'payload.pull_request.base.repo.open_issues_count',
                'payload.pull_request.head.repo.size', 'payload.pull_request.changed_files',
                'payload.pull_request.head.repo.description', 'payload.pull_request.head.repo.has_downloads',
                'payload.pull_request.head.repo.has_issues', 'payload.pull_request.head.repo.has_pages',
                'payload.pull_request.head.repo.has_projects', 'payload.pull_request.head.repo.has_wiki'
                ]


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
    for i, line in enumerate(decompressed_file.readlines()):
        try:  # commit messages with \\ causes issues to parse
            data.append(json.loads(line))
        except:
            log.error('Error to parse line {l} from {u}'.format(l=i, u=url))

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


if __name__ == '__main__':
    log.getLogger().setLevel(log.INFO)

    arguments = docopt(__doc__)
    start_date = arguments['<start-date>']
    end_date = arguments['<end-date>']

    helpers.are_dates_valid(start_date, end_date)

    urls = helpers.get_urls(start_date, end_date)

    data = map(read_and_filter, urls)

    flat_data = [item for sublist in data for item in sublist]
    del data

    df = pd.io.json.json_normalize(flat_data)[COLS_TO_KEEP]
    del flat_data

    file_path = os.path.join(os.path.abspath(os.path.join(__file__, '../../../..')),
                             'data', 'data_{s}_{e}.csv'.format(s=start_date, e=end_date))
    df.to_csv(file_path, index=False)

    log.info('The data was saved in {f}'.format(f=file_path))
