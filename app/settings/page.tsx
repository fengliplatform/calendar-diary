import { auth, clerkClient } from '@clerk/nextjs/server'
import { CreateFamilyForm } from '@/components/settings/CreateFamilyForm'
import { FamilySettings } from '@/components/settings/FamilySettings'

export default async function SettingsPage() {
  const { userId, orgId } = await auth()

  // Branch A — no org: prompt user to create their family
  if (!orgId) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/40 p-4">
        <CreateFamilyForm />
      </div>
    )
  }

  // Branch B — has org: fetch and serialize org data for the client component.
  // Clerk SDK objects are class instances (not plain JSON) so we extract
  // only the primitive fields we need before crossing the RSC boundary.
  const clerk = await clerkClient()

  const [org, membershipsRes] = await Promise.all([
    clerk.organizations.getOrganization({ organizationId: orgId }),
    clerk.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: 100 }),
  ])

  const members = membershipsRes.data.map((m) => ({
    id: m.id,
    userId: m.publicUserData?.userId ?? '',
    role: m.role, // 'org:admin' | 'org:member'
    identifier: m.publicUserData?.identifier ?? '', // email
    firstName: m.publicUserData?.firstName ?? null,
    lastName: m.publicUserData?.lastName ?? null,
  }))

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-muted/40 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <FamilySettings
          orgName={org.name}
          members={members}
          currentUserId={userId!}
        />
      </div>
    </div>
  )
}
