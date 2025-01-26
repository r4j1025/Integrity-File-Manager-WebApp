"use client"
import { Button } from "@/components/ui/button";
import {  SignedIn, SignedOut, SignInButton, SignOutButton, useOrganization } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const { organization } = useOrganization();
  const createFile = useMutation(api.files.createFile);
  const files = useQuery(api.files.getFiles, 
    organization?.id ? {orgId: organization.id} : "skip"
  );

  return (
    <main className="flex flex-col justify-between items-center">
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

      {files?.map((file)=>{
        return <div key={file._id}>{file.name}</div>
      })}

      <Button onClick={()=>{
        if(!organization){
          console.log('not found');
          return;
        } 
        createFile({
          name: "hello world",
          orgId: organization?.id,
        })
      }}>Click</Button>
    </main>
  );
}
