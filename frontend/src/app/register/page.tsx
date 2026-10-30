import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <AuthForm mode="register" />
    </div>
  );
}
