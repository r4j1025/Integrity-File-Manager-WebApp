"use client"
import { Button } from "@/components/ui/button";
import {  SignedIn, SignedOut, SignInButton, SignOutButton } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const createFile = useMutation(api.files.createFile);
  return (
    <main className="flex flex-col min-h-screen justify-between items-center">
      <SignedIn>
        <SignOutButton>
          <Button>Sign out</Button>
        </SignOutButton>
      </SignedIn>
      <SignedOut>
        <SignInButton>
          <Button>Sign in</Button>
        </SignInButton>
      </SignedOut>
      <Button onClick={()=>{
        createFile({
          name: "hello world",
        })
      }}>Click</Button>
    </main>
  );
}
