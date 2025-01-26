"use client"
import { Button } from "@/components/ui/button";
import {  SignedIn, SignedOut, SignInButton, SignOutButton, useOrganization, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const organization = useOrganization();
  const user = useUser();

  let orgId:string | undefined = undefined;
  if(organization.isLoaded && user.isLoaded){
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const files = useQuery(api.files.getFiles, orgId ? { orgId } : "skip");
  const createFile = useMutation(api.files.createFile);
  
  return (
    <main className="flex flex-col justify-between items-center">
  

      {files?.map((file)=>{
        return <div key={file._id}>{file.name}</div>
      })}

      <Button onClick={()=>{
        if(!orgId) return;
        createFile({
          name: "hello world",
          orgId,
        });
      }}>Click</Button>
    </main>
  );
}
