import { h } from "preact";

export default function SentPage() {
  return (
    <main class="prose max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
      <h1 class="text-2xl font-bold mb-4">Check Your Email</h1>
      <p class="text-gray-700 mb-4">
        If we found an account matching that email address, we've sent you a sign-in link.
      </p>
      <p class="text-gray-700 mb-4">
        Please check your inbox and click the link to sign in. The link will expire in 15 minutes.
      </p>
      <p class="text-gray-700 mb-4">
        <a href="/" class="text-blue-600 hover:underline inline-block mt-4">Return to home page</a>
      </p>
    </main>
  );
}
