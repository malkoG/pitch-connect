import { h } from "preact";

export default function SentPage() {
  return (
    <main class="prose mx-auto p-4">
      <h1>Check Your Email</h1>
      <p>
        If we found an account matching that email address, we've sent you a sign-in link.
      </p>
      <p>
        Please check your inbox and click the link to sign in. The link will expire in 15 minutes.
      </p>
      <p>
        <a href="/" class="text-blue-600 hover:underline">Return to home page</a>
      </p>
    </main>
  );
}
