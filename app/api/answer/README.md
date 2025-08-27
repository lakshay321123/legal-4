# Answer API

POST requests should include a JSON body with a `q` field containing the
question. The server trims and normalizes this value, rejecting empty inputs or
any question longer than **500 characters**. If the limit changes, update this
file and the `MAX_Q_LEN` constant in `route.ts`.

