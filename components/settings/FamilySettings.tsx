'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  updateFamilyNameAction,
  inviteMemberAction,
  changeMemberRoleAction,
  removeMemberAction,
} from '@/app/settings/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type MemberData = {
  id: string
  userId: string
  role: string // 'org:admin' | 'org:member'
  identifier: string // email
  firstName: string | null
  lastName: string | null
}

type Props = {
  orgName: string
  members: MemberData[]
  currentUserId: string
}

function getMemberDisplayName(member: MemberData): string {
  const full = [member.firstName, member.lastName].filter(Boolean).join(' ')
  return full || member.identifier
}

export function FamilySettings({ orgName, members, currentUserId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ---- Family Name ----
  const [nameValue, setNameValue] = useState(orgName)

  function handleNameSave() {
    const fd = new FormData()
    fd.set('name', nameValue)
    startTransition(async () => {
      const result = await updateFamilyNameAction(null, fd)
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Family name updated.')
      }
    })
  }

  // ---- Invite ----
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'org:member' | 'org:admin'>('org:member')

  function handleInviteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('email', inviteEmail)
    fd.set('role', inviteRole)
    startTransition(async () => {
      const result = await inviteMemberAction(null, fd)
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`Invitation sent to ${inviteEmail}.`)
        setInviteEmail('')
      }
    })
  }

  // ---- Remove Member Dialog ----
  const [memberToRemove, setMemberToRemove] = useState<MemberData | null>(null)

  function handleRemoveConfirm() {
    if (!memberToRemove) return
    const displayName = getMemberDisplayName(memberToRemove)
    startTransition(async () => {
      const result = await removeMemberAction(memberToRemove.userId)
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        setMemberToRemove(null)
        toast.success(`${displayName} has been removed.`)
        router.refresh()
      }
    })
  }

  // ---- Role change ----
  function handleRoleChange(targetUserId: string, newRole: string) {
    startTransition(async () => {
      const result = await changeMemberRoleAction(targetUserId, newRole)
      if (result && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Role updated.')
        router.refresh()
      }
    })
  }

  const currentUserMembership = members.find((m) => m.userId === currentUserId)
  const isAdmin = currentUserMembership?.role === 'org:admin'

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div>
        <h1 className="text-2xl font-bold">Family Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your family group and members.</p>
      </div>

      <Separator />

      {/* Family Name */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Family Name</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="family-name">Name</Label>
              <Input
                id="family-name"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                maxLength={64}
                disabled={!isAdmin || isPending}
              />
            </div>
            {isAdmin && (
              <Button variant="outline" onClick={handleNameSave} disabled={isPending}>
                Save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isCurrentUser = member.userId === currentUserId
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{getMemberDisplayName(member)}</p>
                        <p className="text-xs text-muted-foreground">{member.identifier}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'org:admin' ? 'default' : 'secondary'}>
                        {member.role === 'org:admin' ? 'Owner' : 'Member'}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        {isCurrentUser ? (
                          <span className="text-xs italic text-muted-foreground">You</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Select
                              value={member.role}
                              onValueChange={(newRole) =>
                                handleRoleChange(member.userId, newRole)
                              }
                              disabled={isPending}
                            >
                              <SelectTrigger className="h-8 w-28 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="org:member">Member</SelectItem>
                                <SelectItem value="org:admin">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isPending}
                              onClick={() => setMemberToRemove(member)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Remove Member Confirmation Dialog (controlled — no DialogTrigger) */}
      <Dialog
        open={!!memberToRemove}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove family member?</DialogTitle>
            <DialogDescription>
              {memberToRemove && (
                <>
                  This will remove{' '}
                  <strong>{getMemberDisplayName(memberToRemove)}</strong> from your family
                  group. They will lose access to all shared diary entries.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveConfirm} disabled={isPending}>
              {isPending ? 'Removing…' : 'Remove member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite — admin only */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite a Family Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="family.member@email.com"
                    disabled={isPending}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as 'org:member' | 'org:admin')}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="org:member">Member</SelectItem>
                      <SelectItem value="org:admin">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isPending || !inviteEmail}>
                  {isPending ? 'Sending…' : 'Invite'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
