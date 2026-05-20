I will resolve the authentication and signup issues by ensuring the backend configuration is correct and adding the missing token management feature for recruiters.

### Technical Details
- **Database**:
  - Update the `handle_new_user` function to correctly sync `recruiter_id` from Auth metadata to the `profiles` table.
  - Ensure Row Level Security (RLS) policies allow recruiters to manage their own tokens and anyone (guests) to validate tokens during signup.
- **Frontend**:
  - Create a new `/dashboard/tokens` route for recruiters to generate, deactivate, and track recruitment tokens.
  - Update `DashboardShell` to include a "Tokens" menu item for recruiters.
  - Verify that the signup flow in `login.tsx` correctly handles the token validation for collaborators.

### Steps
1. **Migration**: Update the `handle_new_user` trigger function to include the `recruiter_id` field.
2. **New Page**: Implement `src/routes/dashboard.tokens.tsx` with a modern UI for token management.
3. **Navigation**: Add the "Tokens de Acesso" link to the `DashboardShell` component.
4. **Validation**: Double-check `auth.ts` and `login.tsx` to ensure the signup flow is robust.
5. **Confirmation**: Verify the fix by checking the Supabase auth settings one last time.