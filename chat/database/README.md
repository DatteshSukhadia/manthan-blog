# Manthan MVP: database

This package contains:

- `manthan.db`: an initialized SQLite database with no learner records, passwords,
  sessions, lesson uploads, or private preview data.
- `schema.prisma`: all models and relationships.
- `migrations/`: the SQL that creates the schema and Prisma migration metadata.

Place this folder next to `backend/`, not inside it. No database server, account,
subscription, or API key is needed.

From the sibling backend folder:

```sh
npm ci
cp .env.example .env
npm run db:setup
```

This generates the Prisma client in `backend/node_modules/.prisma/client`, applies
any missing migrations, and initializes the sample content through the
`db:seed` step. The supplied database is intentionally empty of user data; the demo
is generated locally, not copied from the existing preview.

To skip sample data, run `npm run db:generate` followed by `npm run db:migrate` and
set `DEMO_ENABLED=false` in the backend `.env`.

Schema entities: User, Session, ResetToken, DevEmail, LearningPath, Lesson,
Attachment, PathItem, and QuizAttempt. Uploaded file metadata and extracted text are
stored with lessons; original uploaded files are not retained.

You can inspect `manthan.db` with a SQLite browser or the SQLite CLI. Stop the app
before replacing the database. Keep database files out of public Git repositories
once you start entering personal information.

For a consistent backup while the app is running:

```sh
sqlite3 manthan.db ".backup 'manthan-backup.db'"
```

Do not commit those backups publicly. Your local data stays on your computer.
