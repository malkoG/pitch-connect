import { useState, useRef, useEffect } from "preact/hooks";

interface UserMenuProps {
  user: {
    username: string;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div class="relative" ref={menuRef}>
      <button
        type="button"
        onClick={toggleMenu}
        class="inline-flex items-center justify-center rounded-md text-gray-700 hover:text-gray-900 hover:underline focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.username}
      </button>

      {isOpen && (
        <div
          class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          role="menu"
          aria-orientation="vertical"
        >
          <a
            href={`/@${user.username}`}
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
            onClick={closeMenu}
          >
            Profile
          </a>
          <a
            href="/sign/out"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
            onClick={closeMenu}
          >
            Logout
          </a>
        </div>
      )}
    </div>
  );
}
