import { AppProps } from "$fresh/server.ts";

import UserMenu from "../islands/UserMenu.tsx";

interface State {
  user: { id: string; username: string; email: string; } | null;
}

export default function App({ Component, state }: AppProps<State>) {
  return (
    <>
      <head>
		<meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Pitch Connect</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <header class="p-4 bg-gray-100 flex justify-between items-center">
        <h1 class="text-xl font-bold"><a href="/">Home</a></h1>
        <nav>
          {state.user ? (
            <>
              <UserMenu user={state.user} />
            </>
          ) : (
            <a href="/sign/in" class="mr-4 hover:underline">로그인</a>
          )}
          {/* (로그인 후엔 사용자 메뉴로 바꿔주세요) */}
        </nav>
      </header>
      <main class="p-6">
        <Component />
      </main>
    </>
  );
}
