"use client";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { UploadButton } from "./upload-button";
import { FileCard } from "./file-card";
import Image from "next/image";
import { GridIcon, Loader2, RowsIcon } from "lucide-react";
import { SearchBar } from "./search-bar";
import { useState } from "react";
import { DataTable } from "./file-table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { columns } from "./columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function Placeholder() {
  return (
    <div className="flex flex-col gap-8 w-full items-center mt-24">
      <Image
        alt="an image of a picture and directory icon"
        width="300"
        height="300"
        src="/empty.svg"
      />
      <div className="text-2xl">You have no files, upload one now</div>
      <UploadButton />
    </div>
  );
}

export function FileBrowser({
  title,
  favoritesOnly,
  deletedOnly,
}: {
  title: string;
  favoritesOnly?: boolean;
  deletedOnly?: boolean;
}) {
  const organization = useOrganization();
  const user = useUser();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<Doc<"files">["type"] | "all">("all");

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const favorites = useQuery(
    api.files.getAllFavorites,
    orgId ? { orgId } : "skip"
  );

  const files = useQuery(
    api.files.getFiles,
    orgId
      ? {
          orgId,
          type: type === "all" ? undefined : type,
          query,
          favorites: favoritesOnly,
          deletedOnly,
        }
      : "skip"
  );
  const isLoading = files === undefined;

  const logs = useQuery(api.files.getLogsByOrgId, orgId ? { orgId } : "skip"); // Query to get logs

  const modifiedFiles =
    files?.map((file) => ({
      ...file,
      isFavorited: (favorites ?? []).some(
        (favorite) => favorite.fileId === file._id
      ),
    })) ?? [];

  return (
    <div>
      <div className="flex gap-x-2   justify-between min-w-[520px] items-center mb-8">
        <h1 className="text-3xl  font-bold">{title}</h1>

        <SearchBar query={query} setQuery={setQuery} />

        <UploadButton />
      </div>

      <Tabs defaultValue="grid">
        <div className="flex justify-between items-center">
          <TabsList className="mb-2">
            <TabsTrigger value="grid" className="flex gap-2 items-center">
              <GridIcon />
              Grid
            </TabsTrigger>
            <TabsTrigger value="table" className="flex gap-2 mr-2 items-center">
              <RowsIcon /> Table
            </TabsTrigger>
          </TabsList>
          

          {/* Logs Button */}
          <Sheet>
            <SheetTrigger>
              <Button variant={"outline"}>Show Logs</Button>
            </SheetTrigger>
            <SheetContent className="">
              <SheetHeader>
                <SheetTitle>Log history of the folder</SheetTitle>
                <SheetDescription>
                  This shows all actions performed on files within the
                  organization.
                </SheetDescription>
              </SheetHeader>
                {/* Displaying logs as divs */}
              <div className="">
              {isLoading ? (
            <div>Loading logs...</div>
          ) : (
            <div className=" flex mt-2 flex-col-reverse overflow-y-scroll min-h-screen: max-h-[750px] space-y-4">
              {logs?.map((log, index) => (
                <div
                  key={index}
                  className="border-b py-4"
                >
                  <div className="flex flex-col justify-between">
                  <div>
                    <strong>File name:</strong> {log.fileName}
                  </div>
                    <div>
                      <strong>Action performed:</strong> {log.action}
                    </div>
                  <div>
                    <strong>performed by:</strong> {log.userName}
                  </div>
                    <div>
                      <strong>Time:</strong> {new Date(log._creationTime).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              
            </div>
          )}
              </div>
            </SheetContent>
          </Sheet>

          

          <div className="flex ml-2 gap-2 items-center">
            <Label htmlFor="type-select">Type Filter</Label>
            <Select
              value={type}
              onValueChange={(newType) => {
                setType(newType as any);
              }}
            >
              <SelectTrigger id="type-select" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="txt">Text</SelectItem>
                <SelectItem value="doc">Doc</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-8 w-full items-center mt-24">
            <Loader2 className="h-32 w-32 animate-spin text-gray-500" />
            <div className="text-2xl">Loading your files...</div>
          </div>
        )}

        <TabsContent value="grid">
          <div className="container min-w-[570px] grid grid-cols-2 sm:grid-cols-3  gap-4">
            {modifiedFiles?.map((file) => {
              return <FileCard key={file._id} file={file} />;
            })}
          </div>
        </TabsContent>
        {/* <TabsContent value="table">
          <DataTable columns={columns} data={modifiedFiles} />
        </TabsContent> */}
      </Tabs>

      {files?.length === 0 && <Placeholder />}
    </div>
  );
}
