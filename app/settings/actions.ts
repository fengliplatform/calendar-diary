'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireFamily } from '@/lib/auth'

type ActionResult = { error: string } | { success: true }

// ---------- createFamilyAction ----------
// Called when user has no org. Uses auth() directly (can't use requireFamily).
export async function createFamilyAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthenticated')

  const name = formData.get('name')
  if (typeof name !== 'string' || name.trim().length < 2) {
    return { error: 'Family name must be at least 2 characters.' }
  }
  if (name.trim().length > 64) {
    return { error: 'Family name must be 64 characters or fewer.' }
  }

  try {
    const clerk = await clerkClient()
    await clerk.organizations.createOrganization({
      name: name.trim(),
      createdBy: userId,
    })
  } catch (err) {
    console.error('Failed to create organization:', err)
    return { error: 'Failed to create family. Please try again.' }
  }

  redirect('/calendar')
}

// ---------- updateFamilyNameAction ----------
export async function updateFamilyNameAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { familyId } = await requireFamily()

  const name = formData.get('name')
  if (typeof name !== 'string' || name.trim().length < 2) {
    return { error: 'Family name must be at least 2 characters.' }
  }
  if (name.trim().length > 64) {
    return { error: 'Family name must be 64 characters or fewer.' }
  }

  try {
    const clerk = await clerkClient()
    await clerk.organizations.updateOrganization(familyId, { name: name.trim() })
    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error('Failed to update family name:', err)
    return { error: 'Failed to update name. Please try again.' }
  }
}

// ---------- inviteMemberAction ----------
export async function inviteMemberAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { userId, familyId, role } = await requireFamily()

  if (role !== 'org:admin') {
    return { error: 'Only admins can invite members.' }
  }

  const email = formData.get('email')
  const inviteRole = formData.get('role')

  if (typeof email !== 'string' || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }
  if (inviteRole !== 'org:admin' && inviteRole !== 'org:member') {
    return { error: 'Invalid role selected.' }
  }

  try {
    const clerk = await clerkClient()
    await clerk.organizations.createOrganizationInvitation({
      organizationId: familyId,
      emailAddress: email.trim().toLowerCase(),
      role: inviteRole,
      inviterUserId: userId,
    })
    return { success: true }
  } catch (err) {
    console.error('Failed to send invitation:', err)
    return { error: 'Failed to send invitation. The email may already be a member.' }
  }
}

// ---------- changeMemberRoleAction ----------
// Takes direct args (not FormData) — called from client event handlers.
export async function changeMemberRoleAction(
  targetUserId: string,
  newRole: string,
): Promise<ActionResult> {
  const { familyId, role } = await requireFamily()

  if (role !== 'org:admin') {
    return { error: 'Only admins can change roles.' }
  }
  if (newRole !== 'org:admin' && newRole !== 'org:member') {
    return { error: 'Invalid role.' }
  }

  try {
    const clerk = await clerkClient()
    await clerk.organizations.updateOrganizationMembership({
      organizationId: familyId,
      userId: targetUserId,
      role: newRole,
    })
    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error('Failed to change member role:', err)
    return { error: 'Failed to change role. Please try again.' }
  }
}

// ---------- removeMemberAction ----------
// Takes direct args (not FormData) — called from confirmation dialog.
export async function removeMemberAction(targetUserId: string): Promise<ActionResult> {
  const { userId, familyId, role } = await requireFamily()

  if (role !== 'org:admin') {
    return { error: 'Only admins can remove members.' }
  }
  if (targetUserId === userId) {
    return { error: 'You cannot remove yourself from the family.' }
  }

  try {
    const clerk = await clerkClient()
    await clerk.organizations.deleteOrganizationMembership({
      organizationId: familyId,
      userId: targetUserId,
    })
    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    console.error('Failed to remove member:', err)
    return { error: 'Failed to remove member. Please try again.' }
  }
}
