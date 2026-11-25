import unittest

from crawler.crawler import canonical_drug_url, get_drug_urls, list_page_url


class CrawlerTests(unittest.TestCase):
    def test_canonical_drug_url(self):
        self.assertEqual(
            canonical_drug_url("/thuoc-10785/myonal-50mg.aspx?x=1"),
            "https://thuocbietduoc.com.vn/thuoc-10785/myonal-50mg.aspx",
        )
        self.assertIsNone(canonical_drug_url("https://example.com/thuoc-1/test.aspx"))
        self.assertIsNone(canonical_drug_url("/thuoc/drgsearch.aspx"))

    def test_get_drug_urls_deduplicates(self):
        html = '''<html><a href="/thuoc-1/a.aspx">A</a>
        <a href="https://www.thuocbietduoc.com.vn/thuoc-1/a.aspx?x=2">A again</a>
        <a href="/thuoc-2/b.aspx">B</a><a href="https://example.com/thuoc-3/c.aspx">C</a></html>'''
        self.assertEqual(
            get_drug_urls(html),
            [
                "https://thuocbietduoc.com.vn/thuoc-1/a.aspx",
                "https://thuocbietduoc.com.vn/thuoc-2/b.aspx",
            ],
        )

    def test_list_page_url(self):
        self.assertEqual(list_page_url(1), "https://thuocbietduoc.com.vn/thuoc/drgsearch.aspx")
        self.assertEqual(list_page_url(2), "https://thuocbietduoc.com.vn/thuoc/drgsearch.aspx?page=2")


if __name__ == "__main__":
    unittest.main()
