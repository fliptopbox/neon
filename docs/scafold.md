Objective:
I need a database admin website that will publish an API that is consumed by other webstes, using Cloudflase Workers.

The app consists of two main things

- The API that will be exposed publically
- The admin dashboard where add/edit/delete data via a UI

Rescources:

- database diagram: see [diagram](./database-diagram.png)
- database SQL: see [schema](./drawSQL-pgsql-export-2025-11-30.sql)

Technologies:

- nodejs (latest TLS)
- cloudflare workers
- cloudflare pages
- vite & vitetest (for bundeling and testsing)
- postgress database (cloudflare D1)

Database has the following tables:

- users (to allow a user register with emailaddress and password)
- user-metadata (describes the registered user with metadata, like fullname, description, type of user, etc)
- models (a table that manages users of type "MODEL", links to the users respective metadata)
- venues (a table that mangages a collection of venues, )
