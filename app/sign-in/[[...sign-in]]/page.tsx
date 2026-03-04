import { SignIn } from '@clerk/nextjs'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="text-center pb-0">
            <CardTitle className="text-3xl font-bold tracking-tight">Daybook</CardTitle>
            <CardDescription>Your family&apos;s daily diary</CardDescription>
          </CardHeader>
        </Card>
        <SignIn />
      </div>
    </div>
  )
}
