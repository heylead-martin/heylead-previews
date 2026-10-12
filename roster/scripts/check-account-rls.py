"""Exercise the actual migration in an isolated temporary PostgreSQL cluster."""
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
bindir = Path(subprocess.check_output(["pg_config", "--bindir"], text=True).strip())
with tempfile.TemporaryDirectory(prefix="roster-rls-") as folder:
    directory = Path(folder)
    cluster = directory / "data"
    init = subprocess.run([str(bindir / "initdb"), "-D", str(cluster), "-A", "trust", "--no-locale"], text=True, capture_output=True)
    if init.returncode:
        raise RuntimeError(init.stderr)
    # Unix socket only. This never connects to an existing or remote database.
    options = f"-k {directory} -c listen_addresses='' -p 55439"
    subprocess.run([str(bindir / "pg_ctl"), "-D", str(cluster), "-l", str(directory / "server.log"), "-o", options, "-w", "start"], check=True, capture_output=True)
    def sql(statement, fails=None):
        result = subprocess.run([str(bindir / "psql"), "-X", "-h", str(directory), "-p", "55439", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At", "-c", statement], text=True, capture_output=True)
        if fails:
            assert result.returncode != 0 and fails in result.stderr, result.stderr or result.stdout
        else:
            assert result.returncode == 0, result.stderr
        return result.stdout.strip().splitlines()[-1] if result.stdout.strip() else ""
    alice = "00000000-0000-0000-0000-000000000001"
    bob = "00000000-0000-0000-0000-000000000002"
    def as_user(owner, statement):
        return f"set role authenticated; set request.jwt.claim.sub = '{owner}'; {statement}"
    try:
        sql("""
          create role anon nologin;
          create role authenticated nologin;
          create schema auth;
          create table auth.users (id uuid primary key);
          create function auth.uid() returns uuid language sql stable as
            $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
          grant usage on schema auth to authenticated;
          grant execute on function auth.uid() to authenticated;
        """)
        sql(f"insert into auth.users values ('{alice}'), ('{bob}');")
        sql((root / "supabase/migrations/202610120001_saved_companies.sql").read_text())
        sql(as_user(alice, f"insert into public.roster_saved_companies (user_id,company_slug) values ('{alice}','alice-company');"))
        sql(as_user(bob, f"insert into public.roster_saved_companies (user_id,company_slug) values ('{bob}','bob-company');"))
        assert sql(as_user(alice, "select company_slug from public.roster_saved_companies;")) == "alice-company"
        assert sql(as_user(bob, "select company_slug from public.roster_saved_companies;")) == "bob-company"
        sql("set role anon; select * from public.roster_saved_companies;", fails="permission denied")
        sql(as_user(alice, f"insert into public.roster_saved_companies (user_id,company_slug) values ('{bob}','intruder');"), fails="row-level security")
        assert sql(as_user(alice, f"delete from public.roster_saved_companies where user_id='{bob}';")) == "DELETE 0"
        sql(as_user(alice, "update public.roster_saved_companies set company_slug='changed';"), fails="permission denied")
        sql(as_user(alice, f"insert into public.roster_saved_companies (user_id,company_slug) values ('{alice}','../invalid');"), fails="check constraint")
        sql(as_user(alice, f"insert into public.roster_saved_companies (user_id,company_slug) values ('{alice}','alice-company') on conflict (user_id,company_slug) do nothing;"))
        assert sql(as_user(alice, "select count(*) from public.roster_saved_companies;")) == "1"
        assert sql(as_user(alice, "delete from public.roster_saved_companies where company_slug='alice-company';")) == "DELETE 1"
        sql(f"delete from auth.users where id='{bob}';")
        assert sql("select count(*) from public.roster_saved_companies;") == "0"
        print("PASS: private reads, guest denial, cross-account insert/delete denial, update denial, slug constraint, duplicate saves, own removal and account deletion cascade.")
    finally:
        subprocess.run([str(bindir / "pg_ctl"), "-D", str(cluster), "-m", "fast", "-w", "stop"], check=True, capture_output=True)
