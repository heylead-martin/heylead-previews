import hashlib
import io
from pathlib import Path
import runpy
import tarfile
import tempfile
import unittest

install = runpy.run_path(str(Path(__file__).with_name('import-logos.py')))['install']


class LogoImportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def config(self, entries):
        bundle = self.root / 'logos.tar.gz'
        logos = []
        with tarfile.open(bundle, 'w:gz') as archive:
            for name, raw in entries:
                digest = hashlib.sha256(raw).hexdigest()
                member = tarfile.TarInfo(name)
                member.size = len(raw)
                archive.addfile(member, io.BytesIO(raw))
                file = Path(name)
                logos.append({'localPath': name, 'sha256': digest, 'src': f'/roster/assets/logos/{file.stem}-{digest[:12]}{file.suffix}'})
        return {'root': str(self.root), 'bundle': str(bundle), 'logos': logos}

    def test_installs_verified_assets_and_reuses_local_files(self):
        config = self.config([('logos/example.png', b'\x89PNG\r\n\x1a\nexample')])
        self.assertEqual(install(config)['verifiedFiles'], 1)
        config['bundle'] = ''
        self.assertEqual(install(config)['verifiedFiles'], 1)

    def test_checksum_failure_leaves_entire_batch_unwritten(self):
        config = self.config([('logos/one.png', b'\x89PNG\r\n\x1a\none'), ('logos/two.png', b'\x89PNG\r\n\x1a\ntwo')])
        config['logos'][1]['sha256'] = 'b' * 64
        config['logos'][1]['src'] = '/roster/assets/logos/two-bbbbbbbbbbbb.png'
        with self.assertRaisesRegex(ValueError, 'checksum mismatch'):
            install(config)
        self.assertFalse((self.root / 'assets').exists())

    def test_path_traversal_and_archive_links_are_rejected(self):
        config = self.config([('logos/../../escape.png', b'\x89PNG\r\n\x1a\n')])
        with self.assertRaisesRegex(ValueError, 'Invalid logo path'):
            install(config)
        config = self.config([('logos/example.png', b'\x89PNG\r\n\x1a\n')])
        with tarfile.open(config['bundle'], 'w:gz') as archive:
            member = tarfile.TarInfo('logos/example.png')
            member.type = tarfile.SYMTYPE
            member.linkname = '/etc/passwd'
            archive.addfile(member)
        with self.assertRaisesRegex(ValueError, 'Invalid or duplicate'):
            install(config)

    def test_active_svg_and_non_image_bytes_are_rejected(self):
        for name, raw in [('logos/example.svg', b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), ('logos/example.png', b'<html>not a logo</html>')]:
            with self.subTest(name=name):
                with self.assertRaises(ValueError):
                    install(self.config([(name, raw)]))
        self.assertFalse((self.root / 'assets').exists())


if __name__ == '__main__':
    unittest.main()
