# Security Specification - Gestor Financeiro Empresarial

## Data Invariants
1. A transaction must belong to a user and have a valid category ID belonging to the same user.
2. Users can only read and write their own transactions, categories, and business profile.
3. Transactions must have a valid type (income/expense) and a date.
4. Categories must belong to one of the predefined groups.

## The Dirty Dozen Payloads
1. Create a transaction with another user's `userId`.
2. Update a transaction to change the `userId`.
3. Read all transactions without being signed in.
4. Delete another user's transaction.
5. Create a category with an invalid `group`.
6. Update the `companyName` of another user's business profile.
7. Create a transaction with a 1MB string in the `description`.
8. List another user's categories by guessing their `userId`.
9. Create a transaction with a client-provided `createdAt` that is in the future.
10. Update a transaction and remove the `amount` field.
11. Inject a script tag into the `description` field.
12. Attempt to write to a collection not defined in the blueprint.

## Test Runner (Conceptual)
All tests will verify `PERMISSION_DENIED` for unauthorized access and structure-breaking payloads.
