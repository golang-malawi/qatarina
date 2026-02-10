/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-empty-object-type */
"use client"

import type { IconButtonProps, SpanProps } from "@chakra-ui/react"
import {
  ClientOnly,
  IconButton,
  Menu,
  Skeleton,
  Span,
  Stack,
  Text,
} from "@chakra-ui/react"
import { ThemeProvider, useTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import * as React from "react"
import { LuMonitor, LuMoon, LuSun } from "react-icons/lu"

export const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: LuSun },
  { value: "dark", label: "Dark", icon: LuMoon },
  { value: "system", label: "System", icon: LuMonitor },
] as const

type ThemeValue = (typeof THEME_OPTIONS)[number]["value"]

export interface ColorModeProviderProps extends ThemeProviderProps {}

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      disableTransitionOnChange
      defaultTheme="system"
      enableSystem
      themes={["light", "dark"]}
      {...props}
    />
  )
}

export type ColorMode = ThemeValue

export interface UseColorModeReturn {
  colorMode: ColorMode
  setColorMode: (colorMode: ColorMode) => void
  toggleColorMode: () => void
}

export function useColorMode(): UseColorModeReturn {
  const { theme, setTheme, forcedTheme } = useTheme()
  const colorMode = (forcedTheme || theme || "system") as ColorMode
  const toggleColorMode = () => {
    const currentIndex = THEME_OPTIONS.findIndex(
      (theme) => theme.value === colorMode,
    )
    const nextIndex =
      currentIndex >= 0 ? (currentIndex + 1) % THEME_OPTIONS.length : 0
    setTheme(THEME_OPTIONS[nextIndex].value)
  }
  return {
    colorMode: colorMode as ColorMode,
    setColorMode: setTheme,
    toggleColorMode,
  }
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { theme, resolvedTheme } = useTheme()
  const activeTheme = theme === "system" ? resolvedTheme : theme
  return activeTheme === "dark" ? dark : light
}

export function ColorModeIcon() {
  const { theme } = useTheme()
  const activeTheme =
    THEME_OPTIONS.find((option) => option.value === (theme ?? "system")) ??
    THEME_OPTIONS[0]
  const Icon = activeTheme.icon
  return <Icon />
}

interface ColorModeButtonProps extends Omit<IconButtonProps, "aria-label"> {}

export const ColorModeButton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(function ColorModeButton(props, ref) {
  const { colorMode, setColorMode } = useColorMode()
  const activeTheme =
    THEME_OPTIONS.find((theme) => theme.value === colorMode) ??
    THEME_OPTIONS[0]
  return (
    <ClientOnly fallback={<Skeleton boxSize="9" />}>
      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton
            variant="ghost"
            aria-label="Change theme"
            size="sm"
            ref={ref}
            {...props}
            css={{
              _icon: {
                width: "5",
                height: "5",
              },
            }}
          >
            <ColorModeIcon />
          </IconButton>
        </Menu.Trigger>
        <Menu.Content
          zIndex={100}
          minW="44"
          bg="bg.surface"
          border="sm"
          borderColor="border.subtle"
        >
          {THEME_OPTIONS.map((theme) => {
            const Icon = theme.icon
            const isActive = theme.value === activeTheme.value
            return (
              <Menu.Item
                key={theme.value}
                value={theme.value}
                onClick={() => setColorMode(theme.value)}
              >
                <Stack direction="row" align="center" gap="3">
                  <Icon />
                  <Text fontSize="sm">{theme.label}</Text>
                  {isActive && (
                    <Text fontSize="xs" color="fg.muted">
                      Active
                    </Text>
                  )}
                </Stack>
              </Menu.Item>
            )
          })}
        </Menu.Content>
      </Menu.Root>
    </ClientOnly>
  )
})

export const LightMode = React.forwardRef<HTMLSpanElement, SpanProps>(
  function LightMode(props, ref) {
    return (
      <Span
        color="fg"
        display="contents"
        className="chakra-theme light"
        colorPalette="gray"
        colorScheme="light"
        ref={ref}
        {...props}
      />
    )
  },
)

export const DarkMode = React.forwardRef<HTMLSpanElement, SpanProps>(
  function DarkMode(props, ref) {
    return (
      <Span
        color="fg"
        display="contents"
        className="chakra-theme dark"
        colorPalette="gray"
        colorScheme="dark"
        ref={ref}
        {...props}
      />
    )
  },
)
