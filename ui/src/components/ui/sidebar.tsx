import React, { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Box, Button, Drawer } from "@chakra-ui/react";
import { LuPanelLeft as PanelLeft } from "react-icons/lu";

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(isMobile ? false : defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open]
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed";

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <Box
          style={
            {
              "--sidebar-width": isMobile
                ? SIDEBAR_WIDTH_MOBILE
                : SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              display: !isMobile ? "flex" : undefined,
              ...style,
            } as React.CSSProperties
          }
          className={
            "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar " +
            className
          }
          ref={ref}
          {...props}
        >
          {children}
        </Box>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    header?: ReactNode;
  }
>(({ className, children, style, header, ...props }, ref) => {
  const { isMobile, open, openMobile, toggleSidebar } = useSidebar();
  if (isMobile) {
    return (
      <Drawer.Root
        open={openMobile}
        onOpenChange={toggleSidebar}
        size="xl"
        placement="start"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            {header}
            {children}
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    );
  }
  const width = isMobile ? SIDEBAR_WIDTH_MOBILE : SIDEBAR_WIDTH;
  return (
    <Box
      ref={ref}
      className={className}
      style={{
        position: "relative",
        width: open ? width : "0",
        backgroundColor: "transparent",
        transition: "width 200ms linear",
        ...style,
      }}
      {...props}
    >
      <Box
        style={{
          width: width,
          left: !open ? `calc(${width} * -1)` : undefined,
          position: "fixed",
          inset: "0 auto 0 0",
          zIndex: 10,
          height: "100svh",
          transition:
            "left 200ms linear, right 200ms linear, width 200ms linear",
          flexDirection: "column",
          padding: "0.5rem",
        }}
      >
        <Box
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
            flexDirection: "column",
            backgroundColor: "var(--sidebar)",
          }}
        >
          {header}
          {children}
        </Box>
      </Box>
    </Box>
  );
});

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <Box
      ref={ref}
      as="main"
      className={className}
      {...props}
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        flex: 1,
        flexDirection: "column",
        background: "initial",
      }}
    />
  );
});
SidebarInset.displayName = "SidebarInset";

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      className={className}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

// eslint-disable-next-line react-refresh/only-export-components
export { SidebarProvider, Sidebar, useSidebar, SidebarTrigger, SidebarInset };
