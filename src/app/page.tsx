"use client";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UploadButton } from "./dashboard/_components/upload-button";
import { FileCard } from "./dashboard/_components/file-card";
import Image from "next/image";
import { FileIcon, Loader2, StarIcon } from "lucide-react";
import { SearchBar } from "./dashboard/_components/search-bar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function Placeholder() {
  return (
    <div className="flex mt-24 items-center flex-col gap-8 w-full">
      <Image
        width="300"
        height="300"
        src="/empty.svg"
        alt="an image of empty folder"
      />
      <div className="text-2xl">You have no files, please upload your file</div>
      <UploadButton />
    </div>
  );
}

export default function Home() {
  const organization = useOrganization();
  const user = useUser();
  const [query, setQuery] = useState("");

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const files = useQuery(api.files.getFiles, orgId ? { orgId, query } : "skip");
  const isLoading = files === undefined;

  return (
    <main className="container mx-auto pt-12">
      <div className="flex">
        <div className="w-40 flex flex-col gap-4">
          <Link href="/dashboard/files">
          <Button variant={"link"} className="flex gap-2">
            <FileIcon/> All Files
          </Button>
          </Link>
          <Link href="/dashboard/favorites">
          <Button variant={"link"} className="flex gap-2">
            <StarIcon/> Favorites
          </Button>
          </Link>
        </div>
        <div className="w-full">
        {isLoading && (
          <div className="flex mt-24 items-center flex-col gap-8 w-full">
            <Loader2 className="h-32 w-32 animate-spin" />
            <div className="text-2xl">Loading the images...</div>
          </div>
        )}

        {!isLoading && (
          <>
            <div className="flex justify-between mb-8 items-center">
              <h1 className="text-4xl font-bold">Your Files</h1>
              <SearchBar query={query} setQuery={setQuery} />

              <UploadButton />
            </div>
            {files.length === 0 && <Placeholder />}
            <div className="grid gap-4 grid-cols-3 mt-4">
              {files?.map((file) => {
                return <FileCard key={file._id} file={file} />;
              })}
            </div>
          </>
        )}
      </div>
      </div>
    </main>
  );
}
