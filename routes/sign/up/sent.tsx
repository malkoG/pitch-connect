import { h } from "preact";

export default function SentPage() {
  return (
    <main class="prose mx-auto p-4">
      <h1>Request Sent</h1>
      <p>
        Thank you for your interest! We've received your account request and will review it shortly.
      </p>
      <p>
        You'll receive an email when your request has been approved with instructions to complete your registration.
      </p>
      <p>
        <a href="/" class="text-blue-600 hover:underline">Return to home page</a>
      </p>
    </main>
  );
}
