import React, { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Box, Button, Drawer } from "@chakra-ui/react";
import { LuPanelLeft as PanelLeft } from "react-icons/lu";

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "var(--chakra-sizes-sidebar)";
const SIDEBAR_WIDTH_MOBILE = "var(--chakra-sizes-sidebarMobile)";
const SIDEBAR_WIDTH_ICON = "var(--chakra-sizes-sidebarIcon)";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarState = "expanded" | "collapsed";

type SidebarContext = {
  state: SidebarState;
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  toggleState: () => void;
  isCollapsed: boolean;
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

    // Collapsed state for icon-only mode (desktop only)
    const [collapsed, setCollapsed] = React.useState<boolean>(() => {
      if (typeof window !== "undefined") {
        const cookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("sidebar:collapsed="));
        return cookie ? cookie.split("=")[1] === "true" : false;
      }
      return false;
    });

    const toggleState = React.useCallback(() => {
      if (isMobile) return;
      const newCollapsed = !collapsed;
      setCollapsed(newCollapsed);
      document.cookie = `sidebar:collapsed=${newCollapsed}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    }, [collapsed, isMobile]);

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
    // On desktop, collapsed state controls icon-only mode
    // On mobile, open controls visibility
    const state: SidebarState = isMobile
      ? (openMobile ? "expanded" : "collapsed")
      : (collapsed ? "collapsed" : "expanded");
    const isCollapsed = isMobile ? !openMobile : collapsed;

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        toggleState,
        isCollapsed,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, toggleState, isCollapsed]
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
    variant?: "default" | "inset";
  }
>(({ className, children, style, header, variant = "default", ...props }, ref) => {
  const { isMobile, openMobile, toggleSidebar, isCollapsed } = useSidebar();
  const isInset = variant === "inset";
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
  // On desktop, sidebar can be fully collapsed (hidden).
  const width = SIDEBAR_WIDTH;
  const isVisible = !isCollapsed;
  
  return (
    <Box
      ref={ref}
      className={className}
      data-state={isCollapsed ? "collapsed" : "expanded"}
      style={{
        position: "relative",
        width: isVisible ? width : "0",
        backgroundColor: "transparent",
        transition: "width 200ms ease-linear",
        ...style,
      }}
      {...props}
    >
      <Box
        style={{
          width: width,
          position: "fixed",
          top: 0,
          bottom: 0,
          left: isVisible ? 0 : `calc(0px - ${width})`,
          right: "auto",
          zIndex: 10,
          height: "100svh",
          transition: "left 200ms ease-linear, width 200ms ease-linear",
          flexDirection: "column",
        }}
        p={isInset ? (isCollapsed ? "2" : "3") : "0"}
        bg={isInset ? "bg.canvas" : "transparent"}
      >
        <Box
          display="flex"
          height="100%"
          width="100%"
          flexDirection="column"
          bg="bg.surface"
          borderColor="border.subtle"
          {...(isInset
            ? {
                border: "sm",
                borderRadius: "xl",
                shadow: "sm",
              }
            : {
                borderRight: "sm",
              })}
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
  React.ComponentProps<"main"> & {
    variant?: "default" | "inset";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const { isCollapsed, isMobile } = useSidebar();
  const isInset = variant === "inset";
  const insetPadding = isInset && !isMobile ? (isCollapsed ? "2" : "3") : "0";
  
  return (
    <Box
      ref={ref}
      as="main"
      className={className}
      {...props}
      p={insetPadding}
      bg={isInset ? "bg.canvas" : "initial"}
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        flex: 1,
        flexDirection: "column",
        minHeight: "100svh",
      }}
    />
  );
});
SidebarInset.displayName = "SidebarInset";

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar, toggleState, isMobile } = useSidebar();

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="sm"
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (isMobile) {
          toggleSidebar();
        } else {
          toggleState();
        }
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
