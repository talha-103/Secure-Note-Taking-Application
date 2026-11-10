# MongoDB index verification

Verified with MongoDB Community 8.0.34 and synthetic data in a fresh local database. The fixture contained 1,000 users, 4,000 notes, and 4,000 posts. One account owned 40 notes and authored 40 posts. Ten users listed chess as an interest. List queries used page 2 with a limit of 10. The exact-interest query used page 1.

## Indexes

| Collection | Keys                         | Purpose                                                           |
| ---------- | ---------------------------- | ----------------------------------------------------------------- |
| Users      | `{ email: 1 }`, unique       | Exact sign-in lookup and email uniqueness                         |
| Users      | `{ interests: 1 }`, multikey | Initial exact-match stage of the filtered interest pipeline       |
| Notes      | `{ owner: 1, _id: -1 }`      | Owner-scoped pagination and counting                              |
| Posts      | `{ author: 1, _id: -1 }`     | Equality join on author and descending ID order inside the lookup |

MongoDB's built-in `_id_` indexes support individual ID reads, global user and note lists and counts, and the outer match for the posts lookup. The database contained only the built-in indexes and the four model-defined indexes above.

## Observed execution statistics

These values come from `explain("executionStats")`. For aggregations, the cursor row reports the documents entering the pipeline. Count rows report the one document holding the total.

| Operation                          | Winning access stage | Index          | Returned | Keys examined | Docs examined |
| ---------------------------------- | -------------------- | -------------- | -------: | ------------: | ------------: |
| Sign-in email lookup               | EXPRESS_IXSCAN       | email_1        |        1 |             1 |             1 |
| Profile and admin user ID lookup   | EXPRESS_IXSCAN       | _id_           |        1 |             1 |             1 |
| Note ID and owner lookup           | IXSCAN               | _id_           |        1 |             1 |             1 |
| Admin user list                    | IXSCAN               | _id_           |       10 |            20 |            10 |
| Admin user count                   | COUNT_SCAN           | _id_           |        1 |         1,000 |             0 |
| Owned note list                    | IXSCAN               | owner_1__id_-1 |       10 |            20 |            10 |
| Owned note count                   | COUNT_SCAN           | owner_1__id_-1 |        1 |            40 |             0 |
| Admin note list                    | IXSCAN               | _id_           |       10 |            20 |            10 |
| Admin note count                   | COUNT_SCAN           | _id_           |        1 |         4,000 |             0 |
| All interest groups, input cursor  | COLLSCAN             | —              |    1,000 |             0 |         1,000 |
| Chess interest group, input cursor | IXSCAN               | interests_1    |       10 |            10 |            10 |
| Posts by author, outer user match  | EXPRESS_IXSCAN       | _id_           |        1 |             1 |             1 |

The posts lookup reported `indexesUsed: ["author_1__id_-1"]`, `totalKeysExamined: 40`, `totalDocsExamined: 40`, and `collectionScans: 0`. The API returned 10 posts with a total of 40. The exact total accounts for the scan across all 40 matching posts.

The unfiltered interest pipeline returned 10 of 42 groups on page 2. It scans all profiles because every interest contributes to the result. The filtered pipeline applies the interest index before unwinding and then filters the unwound values to remove unrelated interests. It returned one group with 10 members.

Live HTTP checks passed for registration, note ownership, admin authorization, post publishing, and browsing another author's posts.
