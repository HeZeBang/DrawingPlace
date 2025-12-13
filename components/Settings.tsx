"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSettingsConfigContext } from "@/components/SettingsProvider"
import { SettingsEntries } from "@/lib/frontend-settings"
import { Switch } from "./ui/switch"

export function SettingsDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>设置</DialogTitle>
            <DialogDescription>
              在此处更改偏好设置和查看统计信息
            </DialogDescription>
          </DialogHeader>
          <SettingsContent />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>设置</DrawerTitle>
          <DrawerDescription>
            在此处更改偏好设置和查看统计信息
          </DrawerDescription>
        </DrawerHeader>
        <SettingsContent className="px-4" />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">取消</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function SettingsContent({ className }: React.ComponentProps<"form">) {
  const { config, updateConfig } = useSettingsConfigContext();

  return (
    <form className={cn("grid items-start gap-6 py-2", className)}>
      {
        Object.entries(SettingsEntries).map(([key, { label, description, displayType }]) => {
          if (displayType === "boolean") {
            return (
              <div key={key} className="grid gap-1.5">
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={key}
                    checked={config[key as keyof typeof config] as boolean}
                    onCheckedChange={(checked) => {
                      updateConfig({ [key]: checked });
                    }}
                  />
                  <Label htmlFor={key}>{label}</Label>
                </div>
                {description && (
                  <p className="text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            )
          }
          else {
            return (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  defaultValue={config[key] || ""}
                  onBlur={(e) => {
                    updateConfig({ [key]: e.target.value });
                  }}
                />
              </div>
            );
          }
        })
      }
      <Button type="submit">保存更改</Button>
    </form>
  )
}
