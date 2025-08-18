'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormState } from 'react-dom';
import { loginUser } from '@/app/auth/actions';
export default function LoginForm() {
  const initialState = {
    message: '',
  };
  const [formState, formAction] = useFormState(loginUser, initialState);
  return (
    <>
      <form action={formAction}>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" name="email" required />
        </div>
        <div className="mt-2 grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" name="password" required />
        </div>
        <Button className="mt-4 w-full" type="submit">
          Sign In
        </Button>
        {formState?.message && (
          <p className="py-2 text-center text-sm text-red-500">{formState.message}</p>
        )}
      </form>
    </>
  );
}
