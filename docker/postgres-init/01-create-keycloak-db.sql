-- Create the database used by Keycloak. Runs only on first container bring-up
-- (postgres image executes /docker-entrypoint-initdb.d/*.sql once, when the
-- data volume is empty). If you change this file after the first boot, run
-- `docker compose down -v` to wipe the volume and re-run.
CREATE DATABASE keycloak;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO admin_console;
