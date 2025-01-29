import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelative } from "date-fns";

import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { DeleteIcon, FileTextIcon, GanttChartIcon, ImageIcon, MoreVerticalIcon, StarsIcon, TrashIcon } from "lucide-react";
import { ReactNode, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Image from "next/image";
//import { FileCardActions } from "./file-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

//2:54
function FileCardActions({file}:{file: Doc<"files">}){
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const deleteFile = useMutation(api.files.deleteFile);
  const toggleFavorite = useMutation(api.files.toggleFavorite);
  const { toast } = useToast();

return (
<>
<AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your account
        and remove your data from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={async ()=>{
          await deleteFile({
            fileId: file._id,
          });
          toast({
            variant: "default",
            title: "File deleted",
            description: "The file is deleted!"
          })
        }}
      >Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

<DropdownMenu>
  <DropdownMenuTrigger><MoreVerticalIcon/></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem
    onClick={()=>toggleFavorite({
      fileId: file._id,
    })}
      
      className="flex gap-1 items-center cursor-pointer">
      <StarsIcon className="w-4 h-4"/> Favorite
    </DropdownMenuItem>
    <DropdownMenuSeparator/>
    <DropdownMenuItem
      onClick={()=>setIsConfirmOpen(true)}
      className="flex gap-1 text-red-600 items-center cursor-pointer">
      <TrashIcon className="w-4 h-4"/> Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
</>
)
}
///not working /////////////////
function getFileUrl(fileId: Id<"_storage">): string {
  return `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${fileId}`;
}

export function FileCard({
  file,
}: {
   file: Doc<"files"> //& { isFavorited: boolean; url: string | null };
}) {
  // const userProfile = useQuery(api.users.getUserProfile, {
  //   userId: file.userId,
  // });

  const typeIcons = {
    image: <ImageIcon />,
    pdf: <FileTextIcon />,
    csv: <GanttChartIcon />,
  } as Record<Doc<"files">["type"], ReactNode>;

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle className="flex gap-2 text-base font-normal">
          <div className="flex justify-center">{typeIcons[file.type]}</div>{" "}
          {file.name}
        </CardTitle>
        <div className="absolute top-2 right-2">
          <FileCardActions file={file} />
        </div>
      </CardHeader>
      <CardContent className="h-[200px] flex justify-center items-center">
        {file.type === "image" && file.fileId && (
          <Image alt={file.name} width="200" height="100" src={getFileUrl(file.fileId)} />
        )}

        {file.type === "csv" && <GanttChartIcon className="w-20 h-20" />}
        {file.type === "pdf" && <FileTextIcon className="w-20 h-20" />}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={()=>{
          window.open(getFileUrl(file.fileId), "_blank")
        }}>
          Download
        </Button>
        {/* <div className="flex gap-2 text-xs text-gray-700 w-40 items-center">
          <Avatar className="w-6 h-6">
            <AvatarImage src={userProfile?.image} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          {userProfile?.name}
        </div> */}
        <div className="text-xs text-gray-700">
          Uploaded on {formatRelative(new Date(file._creationTime), new Date())}
        </div>
      </CardFooter>
    </Card>
  );
}
