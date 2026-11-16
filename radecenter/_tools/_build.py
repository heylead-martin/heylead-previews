"""Generate the Rade Center static site (24 pages, 1:1 with the live site). Run: python3 _tools/_build.py"""
import os, sys, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib, content_pages, content_services, content_articles, content_extra

# folders from earlier revisions that are no longer pages
OBSOLETE = ["uslugi", "statii", "za-rado"]

if __name__ == "__main__":
    for d in OBSOLETE:
        shutil.rmtree(os.path.join(lib.ROOT, d), ignore_errors=True)
    content_pages.build()
    content_services.build()
    content_articles.build()
    content_extra.build()
    print("built")
