'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createFamilyAction } from '@/app/settings/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ActionResult = { error: string } | { success: true } | null

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating…' : 'Create Family'}
    </Button>
  )
}

export function CreateFamilyForm() {
  const [state, formAction] = useFormState<ActionResult, FormData>(createFamilyAction, null)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Welcome to Daybook</CardTitle>
        <CardDescription>
          Create your family group to start keeping your shared diary.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Family name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. The Smith Family"
              maxLength={64}
              required
            />
          </div>
          {state && 'error' in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
