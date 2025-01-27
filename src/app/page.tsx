"use client";
import {
  useOrganization,
  useUser,
} from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UploadButton } from "./dashboard/_components/upload-button";
import { FileCard } from "./dashboard/_components/file-card";
import Image from "next/image";
import { Loader2 } from "lucide-react";

//1:41
export default function Home() {
  const organization = useOrganization();
  const user = useUser();

  
  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const files = useQuery(api.files.getFiles, orgId ? { orgId } : "skip");
  const isLoading = files === undefined;

  return (
    <main className="container mx-auto pt-12">
      {isLoading && <div className="flex mt-24 items-center flex-col gap-8 w-full">
        <Loader2 className="h-32 w-32 animate-spin" />
        <div className="text-2xl">Loading the images...</div>
      </div>}
      {!isLoading && files.length === 0 && (
            <div className="flex mt-24 items-center flex-col gap-8 w-full">
              <Image width="300" height="300" src="/empty.svg" alt="an image of empty folder"/>
              <div className="text-2xl">You have no files, please upload your file</div>
              <UploadButton/>
            </div>
        )}

      {!isLoading && files.length>0 && (<>
        <div className="flex justify-between mb-8 items-center">
        <h1 className="text-4xl font-bold">Your Files</h1>
        <UploadButton/>
      </div>
      <div className="grid grid-cols-4 mt-4">
      {files?.map((file) => {
        return <FileCard key={file._id} file={file}/>;
      })}
      </div>
      </>)}
      
    </main>
  );
}
