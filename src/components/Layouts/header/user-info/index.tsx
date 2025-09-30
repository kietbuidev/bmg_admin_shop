"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import {
  AUTH_EVENT,
  AUTH_STORAGE_KEY,
  clearAuth,
  getStoredAuth,
} from "@/lib/auth";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LogOutIcon, SettingsIcon, UserIcon } from "./icons";

const DEFAULT_USER = {
  name: "John Smith",
  email: "johnson@nextadmin.com",
  img: "/images/user/user-03.png",
};

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const applyAuthState = () => {
      const stored = getStoredAuth();
      const authUser = stored?.user;

      if (stored?.accessToken) {
        setIsAuthenticated(true);
        setUser((prev) => ({
          ...prev,
          name: authUser?.fullName ?? authUser?.email ?? DEFAULT_USER.name,
          email: authUser?.email ?? DEFAULT_USER.email,
        }));
      } else {
        setIsAuthenticated(false);
        setUser(DEFAULT_USER);
      }
    };

    applyAuthState();

    const handleAuthEvent = () => {
      applyAuthState();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) {
        applyAuthState();
      }
    };

    window.addEventListener(AUTH_EVENT, handleAuthEvent);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    setIsOpen(false);
    setUser(DEFAULT_USER);
    setIsAuthenticated(false);
    toast.success("You have been logged out");
    router.push("/auth/sign-in");
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>

        <figure className="flex items-center gap-3">
          <Image
            src={user.img}
            className="size-12"
            alt={`Avatar of ${user.name}`}
            role="presentation"
            width={200}
            height={200}
          />
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{user.name}</span>

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">User information</h2>

        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <Image
            src={user.img}
            className="size-12"
            alt={`Avatar for ${user.name}`}
            role="presentation"
            width={200}
            height={200}
          />

          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">
              {user.name}
            </div>

            <div className="leading-none text-gray-6">{user.email}</div>
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link
            href={"/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <UserIcon />

            <span className="mr-auto text-base font-medium">View profile</span>
          </Link>

          <Link
            href={"/pages/settings"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />

            <span className="mr-auto text-base font-medium">
              Account Settings
            </span>
          </Link>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-dark-3 dark:hover:text-white"
            onClick={handleLogout}
            disabled={!isAuthenticated}
          >
            <LogOutIcon />

            <span className="text-base font-medium">Log out</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
