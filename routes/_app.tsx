import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App({ Component }: AppProps) {
  return (
    <>
      <Head>
        <title>My Slide Share</title>
      </Head>
      <header class="p-4 bg-gray-100 flex justify-between items-center">
        <h1 class="text-xl font-bold"><a href="/">Home</a></h1>
        <nav>
          <a href="/sign/in" class="mr-4 hover:underline">로그인</a>
          {/* (로그인 후엔 사용자 메뉴로 바꿔주세요) */}
        </nav>
      </header>
      <main class="p-6">
        <Component />
      </main>
    </>
  );
}
