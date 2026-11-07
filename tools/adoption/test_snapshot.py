import datetime as dt
import unittest
from snapshot import summarize

class SnapshotTests(unittest.TestCase):
    def test_release_exclusion_and_zero_preserved(self):
        rows=[{'day':'2026-10-01','downloads':100},{'day':'2026-10-02','downloads':0},{'day':'2026-10-03','downloads':10}]
        r=summarize(rows,{'2026-10-01'},dt.date(2026,10,1),dt.date(2026,10,3))
        self.assertEqual((r['total'],r['release_date_total'],r['non_release_daily_mean']),(110,100,5))
        self.assertEqual(r['zero_dates'],['2026-10-02'])
    def test_missing_day_refused(self):
        with self.assertRaises(ValueError):
            summarize([],set(),dt.date(2026,10,1),dt.date(2026,10,1))
    def test_duplicate_refused(self):
        with self.assertRaises(ValueError):
            summarize([{'day':'2026-10-01','downloads':1}]*2,set(),dt.date(2026,10,1),dt.date(2026,10,1))

if __name__ == '__main__': unittest.main()
