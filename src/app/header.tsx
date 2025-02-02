import { Button } from "@/components/ui/button";
import {
  OrganizationSwitcher,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useSession,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { dark } from '@clerk/themes'

export function Header() {
  return (
    <div className="min-w-[750px] z-10 border-b py-4 bg-gray-800">
      <div className="items-center w-[100%] container mx-auto justify-between flex">
        <Link href="/" className="flex gap-2 items-center text-xl text-white">
          <Image src="/logo.png" className="rounded-md" width="50" height="50" alt="file drive logo" />
          Integrity File Manager
        </Link>

        <SignedIn>
          <Button className="bg-gray-200" variant={"outline"}>
            <Link href="/dashboard/files">Your Files</Link>
          </Button>
        </SignedIn>

        <div className="flex gap-2">
          <OrganizationSwitcher appearance={{
        baseTheme: dark,
      }} />
          <UserButton appearance={{
        baseTheme: dark,
      }} />
          <SignedOut >
            <SignInButton >
              <Button>Sign In</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
