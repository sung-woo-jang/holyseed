import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/features/auth/auth-layout'
import { OtpForm } from '@/features/auth/otp/ui/otp-form'

export function Otp() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-base tracking-tight'>
            Two-factor Authentication
          </CardTitle>
          <CardDescription>
            Please enter the authentication code. <br /> We have sent the
            authentication code to your email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OtpForm />
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground px-8 text-center text-sm'>
            Haven't received it?{' '}
            <Link
              to='/sign-in'
              className='hover:text-primary underline underline-offset-4'
            >
              Resend a new code.
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
