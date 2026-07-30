import * as React from 'react'
import { useIsDesktopNav } from '@/shared/hooks/use-media-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/ui/drawer'

/**
 * 데스크톱(lg 이상)에서는 중앙 모달(Dialog), 모바일에서는 하단 바텀시트(Drawer)로
 * 렌더링되는 입력/수정 폼 전용 래퍼. 기존 Dialog* 사용처를 이름만 바꿔 마이그레이션한다.
 */
function FormSheet({ children, ...props }: React.ComponentProps<typeof Dialog>) {
  const isDesktop = useIsDesktopNav()
  const Root = isDesktop ? Dialog : Drawer
  return <Root {...props}>{children}</Root>
}

function FormSheetTrigger({ children, ...props }: React.ComponentProps<typeof DialogTrigger>) {
  const isDesktop = useIsDesktopNav()
  const Trigger = isDesktop ? DialogTrigger : DrawerTrigger
  return <Trigger {...props}>{children}</Trigger>
}

function FormSheetContent({ className, children, ...props }: React.ComponentProps<typeof DialogContent>) {
  const isDesktop = useIsDesktopNav()
  if (isDesktop) {
    return (
      <DialogContent className={className} {...props}>
        {children}
      </DialogContent>
    )
  }
  return <DrawerContent {...props}>{children}</DrawerContent>
}

function FormSheetHeader({ children, ...props }: React.ComponentProps<typeof DialogHeader>) {
  const isDesktop = useIsDesktopNav()
  const Header = isDesktop ? DialogHeader : DrawerHeader
  return <Header {...props}>{children}</Header>
}

function FormSheetTitle({ children, ...props }: React.ComponentProps<typeof DialogTitle>) {
  const isDesktop = useIsDesktopNav()
  const Title = isDesktop ? DialogTitle : DrawerTitle
  return <Title {...props}>{children}</Title>
}

function FormSheetDescription({ children, ...props }: React.ComponentProps<typeof DialogDescription>) {
  const isDesktop = useIsDesktopNav()
  const Description = isDesktop ? DialogDescription : DrawerDescription
  return <Description {...props}>{children}</Description>
}

function FormSheetFooter({ children, ...props }: React.ComponentProps<typeof DialogFooter>) {
  const isDesktop = useIsDesktopNav()
  const Footer = isDesktop ? DialogFooter : DrawerFooter
  return <Footer {...props}>{children}</Footer>
}

export {
  FormSheet,
  FormSheetContent,
  FormSheetDescription,
  FormSheetFooter,
  FormSheetHeader,
  FormSheetTitle,
  FormSheetTrigger,
}
