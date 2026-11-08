"""Read-only npm measurement; never installs packages or counts distinct users."""
import argparse
import datetime as dt
import json
import statistics
import urllib.parse
import urllib.request

PACKAGES = ('atp-sdk', 'create-atp-agent', '@atpdeveloper/did-atp', 'atp-profiles', '@atpdevelopment/openclaw-atp')

def summarize(rows, release_days, start, end):
    expected = [(start + dt.timedelta(days=i)).isoformat() for i in range((end-start).days+1)]
    by_day = {}
    for row in rows:
        day, count = row['day'], row['downloads']
        if day in by_day or not isinstance(count, int) or isinstance(count, bool) or count < 0:
            raise ValueError('Duplicate date or invalid download count')
        by_day[day] = count
    missing = sorted(set(expected)-by_day.keys())
    if missing:
        raise ValueError('Missing daily observations: ' + ', '.join(missing))
    quiet = [by_day[d] for d in expected if d not in release_days]
    return dict(total=sum(by_day[d] for d in expected), release_date_total=sum(by_day[d] for d in expected if d in release_days), non_release_days=len(quiet), non_release_daily_mean=statistics.mean(quiet) if quiet else None, non_release_daily_median=statistics.median(quiet) if quiet else None, zero_dates=[d for d in expected if by_day[d]==0])

def fetch(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        return json.load(response)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--end', type=dt.date.fromisoformat, default=dt.datetime.now(dt.timezone.utc).date()-dt.timedelta(days=1))
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    start = args.end-dt.timedelta(days=59)
    report = dict(retrieved_at=dt.datetime.now(dt.timezone.utc).isoformat(), end=args.end.isoformat(), packages={}, limitations=['Package requests are not unique users.', 'Non-release dates still include CI and dependency installs; this is not an organic-user estimate.', 'Zeros can reflect reporting lag. Compare archived snapshots for backfills.', 'Combined packages overlap. Eligibility aggregation is not established.'])
    for package in PACKAGES:
        encoded = urllib.parse.quote(package, safe='')
        url = f'https://api.npmjs.org/downloads/range/{start}:{args.end}/{encoded}'
        raw = fetch(url)
        if raw.get('package') != package:
            raise ValueError('Package identity mismatch')
        registry_url = 'https://registry.npmjs.org/'+encoded
        registry = fetch(registry_url)
        releases = sorted({v[:10] for k,v in registry['time'].items() if k not in ('created','modified')})
        windows = {}
        for days in (7,30):
            for label, offset in (('current',0),('previous',days)):
                end = args.end-dt.timedelta(days=offset)
                windows[f'{label}_{days}d'] = summarize(raw['downloads'], releases, end-dt.timedelta(days=days-1), end)
        report['packages'][package] = dict(sources=[url,registry_url], latest=registry['dist-tags']['latest'], release_dates=releases, windows=windows, raw=raw)
    # Emit only after all five sources validate; a failed fetch must not become zero.
    with open(args.output, 'w') as target:
        json.dump(report,target,indent=2)
    print(json.dumps({p:d['windows'] for p,d in report['packages'].items()},indent=2))

if __name__ == '__main__':
    main()
