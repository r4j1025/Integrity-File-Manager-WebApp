import { Doc,} from "../../../../convex/_generated/dataModel";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileIcon,
  MoreVertical,
  StarIcon,
  StarOff,
  TrashIcon,
  UndoIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import { Protect, useOrganization, useUser } from "@clerk/nextjs";
import emailjs from '@emailjs/browser';


export function FileCardActions({
  file,
  isFavorited,
}: {
   file: Doc<"files"> & { url: string | null };
  isFavorited: boolean;
}) {
  const deleteFile = useMutation(api.files.deleteFile);
  const restoreFile = useMutation(api.files.restoreFile);
  const toggleFavorite = useMutation(api.files.toggleFavorite);
  const logDownload = useMutation(api.files.logDownload);  // Mutation for logging the download
  const { toast } = useToast();
  const me = useQuery(api.users.getMe);


  const organization = useOrganization();
  const user = useUser();
  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }
  const emails = useQuery(api.files.getUserEmailsByOrgId, orgId ? { orgId } : "skip" ) ?? [];
    let orgName = "Your organization";
    if(emails!==undefined){
      orgName = useQuery(api.files.getOrgNameByOrgId, orgId ? { orgId } : "skip" ) ?? "";
    }


  async function sendEmail(action: string) {
    if (!orgId) return;
    
//////////////////////////////////////////////////////////////////////////////////////////////////
      if(emails.length>0){
        for (const email of emails) {
          const templateParams = {
            action: action,
            member: email,
            message: `User "${user?.user?.fullName}" has ${action} the file "${file.name}" in your organization's folder

             Organization folder name: ${orgName}

             (ID: ${orgId}).`,
          };

          emailjs
            .send("service_ntg9ws8", "IFMid", templateParams, "ImV2HhBVWI1jG0VET")
            .then(
              (response) => {
                console.log("SUCCESS!", response.status, response.text);
              },
              (err) => {
                console.log("FAILED...", err);
              }
            );
        }
      }
////////////////////////////////////////////////////////////////////////////////////////
  }

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the file for our deletion process. Files are
              deleted periodically
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await deleteFile({
                  fileId: file._id,
                });
                sendEmail("deleted");
                toast({
                  variant: "default",
                  title: "File marked for deletion",
                  description: "Your file will be deleted soon",
                });
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={async () => {
              if (!file.url) return;
              window.open(file.url, "_blank");

              sendEmail("downloaded");

              // Call the logDownload mutation
              await logDownload({
                fileId: file._id,
                orgId: file.orgId,
                fileName: file.name,
              });
            }}
            className="flex gap-1 items-center cursor-pointer"
          >
            <FileIcon className="w-4 h-4" /> Download
          </DropdownMenuItem>
          

          <DropdownMenuItem
            onClick={() => {
              toggleFavorite({
                fileId: file._id,
              });
            }}
            className="flex gap-1 items-center cursor-pointer"
          >
            {isFavorited ? (
              <div className="flex gap-1 items-center">
                <StarOff className="w-4 h-4" /> Unfavorite
              </div>
            ) : (
              <div className="flex gap-1 items-center">
                <StarIcon className="w-4 h-4" /> Favorite
              </div>
            )}
            
          </DropdownMenuItem>

          <Protect
            condition={(check) => {
              return (
                check({
                  role: "org:admin",
                }) || file.userId === me?._id
              );
            }}
            fallback={<></>}
          >
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (file.shouldDelete) {
                  restoreFile({
                    fileId: file._id,
                  });
                } else {
                  setIsConfirmOpen(true);
                }
              }}
              className="flex gap-1 items-center cursor-pointer"
            >
              {file.shouldDelete ? (
                <div className="flex gap-1 text-green-600 items-center cursor-pointer">
                  <UndoIcon className="w-4 h-4" /> Restore
                </div>
              ) : (
                <div className="flex gap-1 text-red-600 items-center cursor-pointer">
                  <TrashIcon className="w-4 h-4" /> Delete
                </div>
              )}
            </DropdownMenuItem>
          </Protect>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
