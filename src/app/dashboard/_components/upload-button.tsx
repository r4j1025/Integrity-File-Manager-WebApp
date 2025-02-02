"use client";
import { Button } from "@/components/ui/button";
import {
  useOrganization,
  useUser,
} from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Doc } from "../../../../convex/_generated/dataModel";
import emailjs from '@emailjs/browser';


const formSchema = z.object({
  title: z.string().min(1).max(200),
  file: z
    .custom<FileList>((val) => val instanceof FileList, "Required")
    .refine((files) => files.length > 0, "Required"),
});

export function UploadButton() {
  const { toast } = useToast();
  const organization = useOrganization();
  const user = useUser();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  
  
  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      file: undefined,
    },
  });

  const fileRef = form.register("file");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!orgId) return;
    const postUrl = await generateUploadUrl();
    const fileType = values.file[0].type;

    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": fileType },
      body: values.file[0],
    });
    const { storageId } = await result.json();

    //console.log(values.file[0].type); // to see and check the type of file 
    const types = {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "doc",
      "application/msword": "doc",
      "text/plain":"txt",
      "image/jpeg": "image",
      "image/png": "image",
      "application/pdf": "pdf",
      "text/csv": "csv",
    } as Record<string, Doc<"files">["type"]>;

    try {
      await createFile({
        name: values.title,
        fileId: storageId,
        orgId,
        type: types[fileType],
      });

      form.reset();
//////////////////////////////////////////////////////////////////////////////////////////////////
      if(emails.length>0){
        for (const email of emails) {
          const templateParams = {
            action: "uploaded",
            member: email,
            message: `User "${user?.user?.fullName}" has uploaded the file "${values.title}" in your organization's folder
              
            Organization folder name: ${orgName}
            
            (ID: ${orgId}).`,
          };//

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
      setIsFileDialogOpen(false);

      toast({
        variant: "success",
        title: "File Uploaded",
        description: "Now everyone can view your file",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Your file could not be uploaded, try again later",
      });
    }
  }

  const emails = useQuery(api.files.getUserEmailsByOrgId, orgId ? { orgId } : "skip" ) ?? [];
  let orgName = "Your organization";
  if(emails!==undefined){
    orgName = useQuery(api.files.getOrgNameByOrgId, orgId ? { orgId } : "skip" ) ?? "";
  }
    

  const createFile = useMutation(api.files.createFile);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

  return (
        <Dialog
          open={isFileDialogOpen}
          onOpenChange={(isOpen) => {
            setIsFileDialogOpen(isOpen);
            form.reset();
          }}
        >
          <DialogTrigger>
            <Button>Upload File</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="mb-8">Upload your file here</DialogTitle>
              <DialogDescription>
                This file will be accessible by anyone in your organization
              </DialogDescription>
            </DialogHeader>
            <div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="file"
                    render={() => (
                      <FormItem>
                        <FormLabel>File</FormLabel>
                        <FormControl>
                          <Input type="file" {...fileRef} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="flex gap-1"
                  >
                    {form.formState.isSubmitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Submit
                  </Button>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
  );
}
