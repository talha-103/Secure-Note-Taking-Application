# Application plan

The root package serves the Express API under /api. The React client exercises the existing backend features with these routes.

| Route            | Access    | Purpose                               |
| ---------------- | --------- | ------------------------------------- |
| /login           | Visitor   | Sign in                               |
| /register        | Visitor   | Register with name and email          |
| /notes           | Signed in | List and manage owned notes           |
| /posts           | Signed in | Publish posts and list them by author |
| /admin/notes     | Admin     | View all notes                        |
| /admin/users     | Admin     | Manage users                          |
| /admin/interests | Admin     | View users grouped by interest        |

Lists use the shared pagination component and the API's data, page, limit, and total response. API authorization applies independently of client route guards.
