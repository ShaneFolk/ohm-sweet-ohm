import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Log in | Ohm Sweet Ohm IT Support" };

// Static page: the form is a client component that talks to /api/auth/*.
export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg appliance-panel p-6 sm:p-10">
        <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-orange">
          Tomorrow Industries
        </p>
        <h1 className="mt-2 text-center font-display text-3xl text-teal sm:text-4xl">
          Welcome to the Help Desk of Tomorrow!
        </h1>
        <p className="mb-8 mt-3 text-center">
          Sign in and a friendly technician will be along shortly.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
