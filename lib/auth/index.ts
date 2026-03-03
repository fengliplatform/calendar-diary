import { auth } from '@clerk/nextjs/server'

/**
 * Returns current user's familyId (Clerk orgId) and role.
 * Returns nulls if user has no organization yet.
 * Use in server components and server actions.
 */
export async function getFamily() {
  const { userId, orgId, orgRole } = await auth()
  return {
    userId: userId ?? null,
    familyId: orgId ?? null,
    role: orgRole ?? null,
  }
}

/**
 * Returns current user's familyId and role, or throws if unauthenticated
 * or no organization. Use in server actions to enforce auth.
 */
export async function requireFamily() {
  const { userId, orgId, orgRole } = await auth()
  if (!userId) throw new Error('Unauthenticated')
  if (!orgId) throw new Error('No family organization found. Please create or join a family in Settings.')
  return {
    userId,
    familyId: orgId,
    role: orgRole ?? null,
  }
}
