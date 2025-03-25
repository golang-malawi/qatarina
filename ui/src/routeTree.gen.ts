/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as appRouteImport } from './routes/(app)/route'
import { Route as appIndexImport } from './routes/(app)/index'
import { Route as authLogoutImport } from './routes/(auth)/logout'
import { Route as authLoginImport } from './routes/(auth)/login'
import { Route as appUsersIndexImport } from './routes/(app)/users/index'
import { Route as appTestersIndexImport } from './routes/(app)/testers/index'
import { Route as appTestPlansIndexImport } from './routes/(app)/test-plans/index'
import { Route as appTestCasesIndexImport } from './routes/(app)/test-cases/index'
import { Route as appSettingsIndexImport } from './routes/(app)/settings/index'
import { Route as appReportsIndexImport } from './routes/(app)/reports/index'
import { Route as appProjectsIndexImport } from './routes/(app)/projects/index'
import { Route as appIntegrationsIndexImport } from './routes/(app)/integrations/index'
import { Route as appDashboardIndexImport } from './routes/(app)/dashboard/index'
import { Route as appTestersInviteImport } from './routes/(app)/testers/invite'
import { Route as appUsersNewIndexImport } from './routes/(app)/users/new/index'
import { Route as appTestCasesNewIndexImport } from './routes/(app)/test-cases/new/index'
import { Route as appTestCasesInboxIndexImport } from './routes/(app)/test-cases/inbox/index'
import { Route as appProjectsNewIndexImport } from './routes/(app)/projects/new/index'
import { Route as appProjectsProjectIdIndexImport } from './routes/(app)/projects/$projectId/index'
import { Route as appUsersViewUserIDImport } from './routes/(app)/users/view/$userID'
import { Route as appTestCasesInboxTestCaseIdIndexImport } from './routes/(app)/test-cases/inbox/$testCaseId/index'
import { Route as appProjectsProjectIdTestersIndexImport } from './routes/(app)/projects/$projectId/testers/index'
import { Route as appProjectsProjectIdTestPlansIndexImport } from './routes/(app)/projects/$projectId/test-plans/index'
import { Route as appProjectsProjectIdTestCasesIndexImport } from './routes/(app)/projects/$projectId/test-cases/index'
import { Route as appProjectsProjectIdSettingsIndexImport } from './routes/(app)/projects/$projectId/settings/index'
import { Route as appProjectsProjectIdReportsIndexImport } from './routes/(app)/projects/$projectId/reports/index'
import { Route as appProjectsProjectIdInsightsIndexImport } from './routes/(app)/projects/$projectId/insights/index'
import { Route as appProjectsProjectIdTestPlansNewIndexImport } from './routes/(app)/projects/$projectId/test-plans/new/index'
import { Route as appProjectsProjectIdTestCasesNewIndexImport } from './routes/(app)/projects/$projectId/test-cases/new/index'
import { Route as appProjectsProjectIdTestCasesTestCaseIdIndexImport } from './routes/(app)/projects/$projectId/test-cases/$testCaseId/index'
import { Route as appProjectsProjectIdTestPlansTestPlanIDExecuteIndexImport } from './routes/(app)/projects/$projectId/test-plans/$testPlanID/execute/index'

// Create/Update Routes

const appRouteRoute = appRouteImport.update({
  id: '/(app)',
  getParentRoute: () => rootRoute,
} as any)

const appIndexRoute = appIndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => appRouteRoute,
} as any)

const authLogoutRoute = authLogoutImport.update({
  id: '/(auth)/logout',
  path: '/logout',
  getParentRoute: () => rootRoute,
} as any)

const authLoginRoute = authLoginImport.update({
  id: '/(auth)/login',
  path: '/login',
  getParentRoute: () => rootRoute,
} as any)

const appUsersIndexRoute = appUsersIndexImport.update({
  id: '/users/',
  path: '/users/',
  getParentRoute: () => appRouteRoute,
} as any)

const appTestersIndexRoute = appTestersIndexImport.update({
  id: '/testers/',
  path: '/testers/',
  getParentRoute: () => appRouteRoute,
} as any)

const appTestPlansIndexRoute = appTestPlansIndexImport.update({
  id: '/test-plans/',
  path: '/test-plans/',
  getParentRoute: () => appRouteRoute,
} as any)

const appTestCasesIndexRoute = appTestCasesIndexImport.update({
  id: '/test-cases/',
  path: '/test-cases/',
  getParentRoute: () => appRouteRoute,
} as any)

const appSettingsIndexRoute = appSettingsIndexImport.update({
  id: '/settings/',
  path: '/settings/',
  getParentRoute: () => appRouteRoute,
} as any)

const appReportsIndexRoute = appReportsIndexImport.update({
  id: '/reports/',
  path: '/reports/',
  getParentRoute: () => appRouteRoute,
} as any)

const appProjectsIndexRoute = appProjectsIndexImport.update({
  id: '/projects/',
  path: '/projects/',
  getParentRoute: () => appRouteRoute,
} as any)

const appIntegrationsIndexRoute = appIntegrationsIndexImport.update({
  id: '/integrations/',
  path: '/integrations/',
  getParentRoute: () => appRouteRoute,
} as any)

const appDashboardIndexRoute = appDashboardIndexImport.update({
  id: '/dashboard/',
  path: '/dashboard/',
  getParentRoute: () => appRouteRoute,
} as any)

const appTestersInviteRoute = appTestersInviteImport.update({
  id: '/testers/invite',
  path: '/testers/invite',
  getParentRoute: () => appRouteRoute,
} as any)

const appUsersNewIndexRoute = appUsersNewIndexImport.update({
  id: '/users/new/',
  path: '/users/new/',
  getParentRoute: () => appRouteRoute,
} as any)

const appTestCasesNewIndexRoute = appTestCasesNewIndexImport.update({
  id: '/test-cases/new/',
  path: '/test-cases/new/',
  getParentRoute: () => appRouteRoute,
} as any)

const appTestCasesInboxIndexRoute = appTestCasesInboxIndexImport.update({
  id: '/test-cases/inbox/',
  path: '/test-cases/inbox/',
  getParentRoute: () => appRouteRoute,
} as any)

const appProjectsNewIndexRoute = appProjectsNewIndexImport.update({
  id: '/projects/new/',
  path: '/projects/new/',
  getParentRoute: () => appRouteRoute,
} as any)

const appProjectsProjectIdIndexRoute = appProjectsProjectIdIndexImport.update({
  id: '/projects/$projectId/',
  path: '/projects/$projectId/',
  getParentRoute: () => appRouteRoute,
} as any)

const appUsersViewUserIDRoute = appUsersViewUserIDImport.update({
  id: '/users/view/$userID',
  path: '/users/view/$userID',
  getParentRoute: () => appRouteRoute,
} as any)

const appTestCasesInboxTestCaseIdIndexRoute =
  appTestCasesInboxTestCaseIdIndexImport.update({
    id: '/test-cases/inbox/$testCaseId/',
    path: '/test-cases/inbox/$testCaseId/',
    getParentRoute: () => appRouteRoute,
  } as any)

const appProjectsProjectIdTestersIndexRoute =
  appProjectsProjectIdTestersIndexImport.update({
    id: '/projects/$projectId/testers/',
    path: '/projects/$projectId/testers/',
    getParentRoute: () => appRouteRoute,
  } as any)

const appProjectsProjectIdTestPlansIndexRoute =
  appProjectsProjectIdTestPlansIndexImport.update({
    id: '/projects/$projectId/test-plans/',
    path: '/projects/$projectId/test-plans/',
    getParentRoute: () => appRouteRoute,
  } as any)

const appProjectsProjectIdTestCasesIndexRoute =
  appProjectsProjectIdTestCasesIndexImport.update({
    id: '/projects/$projectId/test-cases/',
    path: '/projects/$projectId/test-cases/',
    getParentRoute: () => appRouteRoute,
  } as any)

const appProjectsProjectIdSettingsIndexRoute =
  appProjectsProjectIdSettingsIndexImport.update({
    id: '/projects/$projectId/settings/',
    path: '/projects/$projectId/settings/',
    getParentRoute: () => appRouteRoute,
  } as any)

const appProjectsProjectIdReportsIndexRoute =
  appProjectsProjectIdReportsIndexImport.update({
    id: '/projects/$projectId/reports/',
    path: '/projects/$projectId/reports/',
    getParentRoute: () => appRouteRoute,
  } as any)

const appProjectsProjectIdInsightsIndexRoute =
  appProjectsProjectIdInsightsIndexImport.update({
    id: '/projects/$projectId/insights/',
    path: '/projects/$projectId/insights/',
    getParentRoute: () => appRouteRoute,
  } as any)

const appProjectsProjectIdTestPlansNewIndexRoute =
  appProjectsProjectIdTestPlansNewIndexImport.update({
    id: '/projects/$projectId/test-plans/new/',
    path: '/projects/$projectId/test-plans/new/',
    getParentRoute: () => appRouteRoute,
  } as any)

const appProjectsProjectIdTestCasesNewIndexRoute =
  appProjectsProjectIdTestCasesNewIndexImport.update({
    id: '/projects/$projectId/test-cases/new/',
    path: '/projects/$projectId/test-cases/new/',
    getParentRoute: () => appRouteRoute,
  } as any)

const appProjectsProjectIdTestCasesTestCaseIdIndexRoute =
  appProjectsProjectIdTestCasesTestCaseIdIndexImport.update({
    id: '/projects/$projectId/test-cases/$testCaseId/',
    path: '/projects/$projectId/test-cases/$testCaseId/',
    getParentRoute: () => appRouteRoute,
  } as any)

const appProjectsProjectIdTestPlansTestPlanIDExecuteIndexRoute =
  appProjectsProjectIdTestPlansTestPlanIDExecuteIndexImport.update({
    id: '/projects/$projectId/test-plans/$testPlanID/execute/',
    path: '/projects/$projectId/test-plans/$testPlanID/execute/',
    getParentRoute: () => appRouteRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/(app)': {
      id: '/(app)'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof appRouteImport
      parentRoute: typeof rootRoute
    }
    '/(auth)/login': {
      id: '/(auth)/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof authLoginImport
      parentRoute: typeof rootRoute
    }
    '/(auth)/logout': {
      id: '/(auth)/logout'
      path: '/logout'
      fullPath: '/logout'
      preLoaderRoute: typeof authLogoutImport
      parentRoute: typeof rootRoute
    }
    '/(app)/': {
      id: '/(app)/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof appIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/testers/invite': {
      id: '/(app)/testers/invite'
      path: '/testers/invite'
      fullPath: '/testers/invite'
      preLoaderRoute: typeof appTestersInviteImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/dashboard/': {
      id: '/(app)/dashboard/'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof appDashboardIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/integrations/': {
      id: '/(app)/integrations/'
      path: '/integrations'
      fullPath: '/integrations'
      preLoaderRoute: typeof appIntegrationsIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/': {
      id: '/(app)/projects/'
      path: '/projects'
      fullPath: '/projects'
      preLoaderRoute: typeof appProjectsIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/reports/': {
      id: '/(app)/reports/'
      path: '/reports'
      fullPath: '/reports'
      preLoaderRoute: typeof appReportsIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/settings/': {
      id: '/(app)/settings/'
      path: '/settings'
      fullPath: '/settings'
      preLoaderRoute: typeof appSettingsIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/test-cases/': {
      id: '/(app)/test-cases/'
      path: '/test-cases'
      fullPath: '/test-cases'
      preLoaderRoute: typeof appTestCasesIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/test-plans/': {
      id: '/(app)/test-plans/'
      path: '/test-plans'
      fullPath: '/test-plans'
      preLoaderRoute: typeof appTestPlansIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/testers/': {
      id: '/(app)/testers/'
      path: '/testers'
      fullPath: '/testers'
      preLoaderRoute: typeof appTestersIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/users/': {
      id: '/(app)/users/'
      path: '/users'
      fullPath: '/users'
      preLoaderRoute: typeof appUsersIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/users/view/$userID': {
      id: '/(app)/users/view/$userID'
      path: '/users/view/$userID'
      fullPath: '/users/view/$userID'
      preLoaderRoute: typeof appUsersViewUserIDImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/$projectId/': {
      id: '/(app)/projects/$projectId/'
      path: '/projects/$projectId'
      fullPath: '/projects/$projectId'
      preLoaderRoute: typeof appProjectsProjectIdIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/new/': {
      id: '/(app)/projects/new/'
      path: '/projects/new'
      fullPath: '/projects/new'
      preLoaderRoute: typeof appProjectsNewIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/test-cases/inbox/': {
      id: '/(app)/test-cases/inbox/'
      path: '/test-cases/inbox'
      fullPath: '/test-cases/inbox'
      preLoaderRoute: typeof appTestCasesInboxIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/test-cases/new/': {
      id: '/(app)/test-cases/new/'
      path: '/test-cases/new'
      fullPath: '/test-cases/new'
      preLoaderRoute: typeof appTestCasesNewIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/users/new/': {
      id: '/(app)/users/new/'
      path: '/users/new'
      fullPath: '/users/new'
      preLoaderRoute: typeof appUsersNewIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/$projectId/insights/': {
      id: '/(app)/projects/$projectId/insights/'
      path: '/projects/$projectId/insights'
      fullPath: '/projects/$projectId/insights'
      preLoaderRoute: typeof appProjectsProjectIdInsightsIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/$projectId/reports/': {
      id: '/(app)/projects/$projectId/reports/'
      path: '/projects/$projectId/reports'
      fullPath: '/projects/$projectId/reports'
      preLoaderRoute: typeof appProjectsProjectIdReportsIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/$projectId/settings/': {
      id: '/(app)/projects/$projectId/settings/'
      path: '/projects/$projectId/settings'
      fullPath: '/projects/$projectId/settings'
      preLoaderRoute: typeof appProjectsProjectIdSettingsIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/$projectId/test-cases/': {
      id: '/(app)/projects/$projectId/test-cases/'
      path: '/projects/$projectId/test-cases'
      fullPath: '/projects/$projectId/test-cases'
      preLoaderRoute: typeof appProjectsProjectIdTestCasesIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/$projectId/test-plans/': {
      id: '/(app)/projects/$projectId/test-plans/'
      path: '/projects/$projectId/test-plans'
      fullPath: '/projects/$projectId/test-plans'
      preLoaderRoute: typeof appProjectsProjectIdTestPlansIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/$projectId/testers/': {
      id: '/(app)/projects/$projectId/testers/'
      path: '/projects/$projectId/testers'
      fullPath: '/projects/$projectId/testers'
      preLoaderRoute: typeof appProjectsProjectIdTestersIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/test-cases/inbox/$testCaseId/': {
      id: '/(app)/test-cases/inbox/$testCaseId/'
      path: '/test-cases/inbox/$testCaseId'
      fullPath: '/test-cases/inbox/$testCaseId'
      preLoaderRoute: typeof appTestCasesInboxTestCaseIdIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/$projectId/test-cases/$testCaseId/': {
      id: '/(app)/projects/$projectId/test-cases/$testCaseId/'
      path: '/projects/$projectId/test-cases/$testCaseId'
      fullPath: '/projects/$projectId/test-cases/$testCaseId'
      preLoaderRoute: typeof appProjectsProjectIdTestCasesTestCaseIdIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/$projectId/test-cases/new/': {
      id: '/(app)/projects/$projectId/test-cases/new/'
      path: '/projects/$projectId/test-cases/new'
      fullPath: '/projects/$projectId/test-cases/new'
      preLoaderRoute: typeof appProjectsProjectIdTestCasesNewIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/$projectId/test-plans/new/': {
      id: '/(app)/projects/$projectId/test-plans/new/'
      path: '/projects/$projectId/test-plans/new'
      fullPath: '/projects/$projectId/test-plans/new'
      preLoaderRoute: typeof appProjectsProjectIdTestPlansNewIndexImport
      parentRoute: typeof appRouteImport
    }
    '/(app)/projects/$projectId/test-plans/$testPlanID/execute/': {
      id: '/(app)/projects/$projectId/test-plans/$testPlanID/execute/'
      path: '/projects/$projectId/test-plans/$testPlanID/execute'
      fullPath: '/projects/$projectId/test-plans/$testPlanID/execute'
      preLoaderRoute: typeof appProjectsProjectIdTestPlansTestPlanIDExecuteIndexImport
      parentRoute: typeof appRouteImport
    }
  }
}

// Create and export the route tree

interface appRouteRouteChildren {
  appIndexRoute: typeof appIndexRoute
  appTestersInviteRoute: typeof appTestersInviteRoute
  appDashboardIndexRoute: typeof appDashboardIndexRoute
  appIntegrationsIndexRoute: typeof appIntegrationsIndexRoute
  appProjectsIndexRoute: typeof appProjectsIndexRoute
  appReportsIndexRoute: typeof appReportsIndexRoute
  appSettingsIndexRoute: typeof appSettingsIndexRoute
  appTestCasesIndexRoute: typeof appTestCasesIndexRoute
  appTestPlansIndexRoute: typeof appTestPlansIndexRoute
  appTestersIndexRoute: typeof appTestersIndexRoute
  appUsersIndexRoute: typeof appUsersIndexRoute
  appUsersViewUserIDRoute: typeof appUsersViewUserIDRoute
  appProjectsProjectIdIndexRoute: typeof appProjectsProjectIdIndexRoute
  appProjectsNewIndexRoute: typeof appProjectsNewIndexRoute
  appTestCasesInboxIndexRoute: typeof appTestCasesInboxIndexRoute
  appTestCasesNewIndexRoute: typeof appTestCasesNewIndexRoute
  appUsersNewIndexRoute: typeof appUsersNewIndexRoute
  appProjectsProjectIdInsightsIndexRoute: typeof appProjectsProjectIdInsightsIndexRoute
  appProjectsProjectIdReportsIndexRoute: typeof appProjectsProjectIdReportsIndexRoute
  appProjectsProjectIdSettingsIndexRoute: typeof appProjectsProjectIdSettingsIndexRoute
  appProjectsProjectIdTestCasesIndexRoute: typeof appProjectsProjectIdTestCasesIndexRoute
  appProjectsProjectIdTestPlansIndexRoute: typeof appProjectsProjectIdTestPlansIndexRoute
  appProjectsProjectIdTestersIndexRoute: typeof appProjectsProjectIdTestersIndexRoute
  appTestCasesInboxTestCaseIdIndexRoute: typeof appTestCasesInboxTestCaseIdIndexRoute
  appProjectsProjectIdTestCasesTestCaseIdIndexRoute: typeof appProjectsProjectIdTestCasesTestCaseIdIndexRoute
  appProjectsProjectIdTestCasesNewIndexRoute: typeof appProjectsProjectIdTestCasesNewIndexRoute
  appProjectsProjectIdTestPlansNewIndexRoute: typeof appProjectsProjectIdTestPlansNewIndexRoute
  appProjectsProjectIdTestPlansTestPlanIDExecuteIndexRoute: typeof appProjectsProjectIdTestPlansTestPlanIDExecuteIndexRoute
}

const appRouteRouteChildren: appRouteRouteChildren = {
  appIndexRoute: appIndexRoute,
  appTestersInviteRoute: appTestersInviteRoute,
  appDashboardIndexRoute: appDashboardIndexRoute,
  appIntegrationsIndexRoute: appIntegrationsIndexRoute,
  appProjectsIndexRoute: appProjectsIndexRoute,
  appReportsIndexRoute: appReportsIndexRoute,
  appSettingsIndexRoute: appSettingsIndexRoute,
  appTestCasesIndexRoute: appTestCasesIndexRoute,
  appTestPlansIndexRoute: appTestPlansIndexRoute,
  appTestersIndexRoute: appTestersIndexRoute,
  appUsersIndexRoute: appUsersIndexRoute,
  appUsersViewUserIDRoute: appUsersViewUserIDRoute,
  appProjectsProjectIdIndexRoute: appProjectsProjectIdIndexRoute,
  appProjectsNewIndexRoute: appProjectsNewIndexRoute,
  appTestCasesInboxIndexRoute: appTestCasesInboxIndexRoute,
  appTestCasesNewIndexRoute: appTestCasesNewIndexRoute,
  appUsersNewIndexRoute: appUsersNewIndexRoute,
  appProjectsProjectIdInsightsIndexRoute:
    appProjectsProjectIdInsightsIndexRoute,
  appProjectsProjectIdReportsIndexRoute: appProjectsProjectIdReportsIndexRoute,
  appProjectsProjectIdSettingsIndexRoute:
    appProjectsProjectIdSettingsIndexRoute,
  appProjectsProjectIdTestCasesIndexRoute:
    appProjectsProjectIdTestCasesIndexRoute,
  appProjectsProjectIdTestPlansIndexRoute:
    appProjectsProjectIdTestPlansIndexRoute,
  appProjectsProjectIdTestersIndexRoute: appProjectsProjectIdTestersIndexRoute,
  appTestCasesInboxTestCaseIdIndexRoute: appTestCasesInboxTestCaseIdIndexRoute,
  appProjectsProjectIdTestCasesTestCaseIdIndexRoute:
    appProjectsProjectIdTestCasesTestCaseIdIndexRoute,
  appProjectsProjectIdTestCasesNewIndexRoute:
    appProjectsProjectIdTestCasesNewIndexRoute,
  appProjectsProjectIdTestPlansNewIndexRoute:
    appProjectsProjectIdTestPlansNewIndexRoute,
  appProjectsProjectIdTestPlansTestPlanIDExecuteIndexRoute:
    appProjectsProjectIdTestPlansTestPlanIDExecuteIndexRoute,
}

const appRouteRouteWithChildren = appRouteRoute._addFileChildren(
  appRouteRouteChildren,
)

export interface FileRoutesByFullPath {
  '/': typeof appIndexRoute
  '/login': typeof authLoginRoute
  '/logout': typeof authLogoutRoute
  '/testers/invite': typeof appTestersInviteRoute
  '/dashboard': typeof appDashboardIndexRoute
  '/integrations': typeof appIntegrationsIndexRoute
  '/projects': typeof appProjectsIndexRoute
  '/reports': typeof appReportsIndexRoute
  '/settings': typeof appSettingsIndexRoute
  '/test-cases': typeof appTestCasesIndexRoute
  '/test-plans': typeof appTestPlansIndexRoute
  '/testers': typeof appTestersIndexRoute
  '/users': typeof appUsersIndexRoute
  '/users/view/$userID': typeof appUsersViewUserIDRoute
  '/projects/$projectId': typeof appProjectsProjectIdIndexRoute
  '/projects/new': typeof appProjectsNewIndexRoute
  '/test-cases/inbox': typeof appTestCasesInboxIndexRoute
  '/test-cases/new': typeof appTestCasesNewIndexRoute
  '/users/new': typeof appUsersNewIndexRoute
  '/projects/$projectId/insights': typeof appProjectsProjectIdInsightsIndexRoute
  '/projects/$projectId/reports': typeof appProjectsProjectIdReportsIndexRoute
  '/projects/$projectId/settings': typeof appProjectsProjectIdSettingsIndexRoute
  '/projects/$projectId/test-cases': typeof appProjectsProjectIdTestCasesIndexRoute
  '/projects/$projectId/test-plans': typeof appProjectsProjectIdTestPlansIndexRoute
  '/projects/$projectId/testers': typeof appProjectsProjectIdTestersIndexRoute
  '/test-cases/inbox/$testCaseId': typeof appTestCasesInboxTestCaseIdIndexRoute
  '/projects/$projectId/test-cases/$testCaseId': typeof appProjectsProjectIdTestCasesTestCaseIdIndexRoute
  '/projects/$projectId/test-cases/new': typeof appProjectsProjectIdTestCasesNewIndexRoute
  '/projects/$projectId/test-plans/new': typeof appProjectsProjectIdTestPlansNewIndexRoute
  '/projects/$projectId/test-plans/$testPlanID/execute': typeof appProjectsProjectIdTestPlansTestPlanIDExecuteIndexRoute
}

export interface FileRoutesByTo {
  '/login': typeof authLoginRoute
  '/logout': typeof authLogoutRoute
  '/': typeof appIndexRoute
  '/testers/invite': typeof appTestersInviteRoute
  '/dashboard': typeof appDashboardIndexRoute
  '/integrations': typeof appIntegrationsIndexRoute
  '/projects': typeof appProjectsIndexRoute
  '/reports': typeof appReportsIndexRoute
  '/settings': typeof appSettingsIndexRoute
  '/test-cases': typeof appTestCasesIndexRoute
  '/test-plans': typeof appTestPlansIndexRoute
  '/testers': typeof appTestersIndexRoute
  '/users': typeof appUsersIndexRoute
  '/users/view/$userID': typeof appUsersViewUserIDRoute
  '/projects/$projectId': typeof appProjectsProjectIdIndexRoute
  '/projects/new': typeof appProjectsNewIndexRoute
  '/test-cases/inbox': typeof appTestCasesInboxIndexRoute
  '/test-cases/new': typeof appTestCasesNewIndexRoute
  '/users/new': typeof appUsersNewIndexRoute
  '/projects/$projectId/insights': typeof appProjectsProjectIdInsightsIndexRoute
  '/projects/$projectId/reports': typeof appProjectsProjectIdReportsIndexRoute
  '/projects/$projectId/settings': typeof appProjectsProjectIdSettingsIndexRoute
  '/projects/$projectId/test-cases': typeof appProjectsProjectIdTestCasesIndexRoute
  '/projects/$projectId/test-plans': typeof appProjectsProjectIdTestPlansIndexRoute
  '/projects/$projectId/testers': typeof appProjectsProjectIdTestersIndexRoute
  '/test-cases/inbox/$testCaseId': typeof appTestCasesInboxTestCaseIdIndexRoute
  '/projects/$projectId/test-cases/$testCaseId': typeof appProjectsProjectIdTestCasesTestCaseIdIndexRoute
  '/projects/$projectId/test-cases/new': typeof appProjectsProjectIdTestCasesNewIndexRoute
  '/projects/$projectId/test-plans/new': typeof appProjectsProjectIdTestPlansNewIndexRoute
  '/projects/$projectId/test-plans/$testPlanID/execute': typeof appProjectsProjectIdTestPlansTestPlanIDExecuteIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/(app)': typeof appRouteRouteWithChildren
  '/(auth)/login': typeof authLoginRoute
  '/(auth)/logout': typeof authLogoutRoute
  '/(app)/': typeof appIndexRoute
  '/(app)/testers/invite': typeof appTestersInviteRoute
  '/(app)/dashboard/': typeof appDashboardIndexRoute
  '/(app)/integrations/': typeof appIntegrationsIndexRoute
  '/(app)/projects/': typeof appProjectsIndexRoute
  '/(app)/reports/': typeof appReportsIndexRoute
  '/(app)/settings/': typeof appSettingsIndexRoute
  '/(app)/test-cases/': typeof appTestCasesIndexRoute
  '/(app)/test-plans/': typeof appTestPlansIndexRoute
  '/(app)/testers/': typeof appTestersIndexRoute
  '/(app)/users/': typeof appUsersIndexRoute
  '/(app)/users/view/$userID': typeof appUsersViewUserIDRoute
  '/(app)/projects/$projectId/': typeof appProjectsProjectIdIndexRoute
  '/(app)/projects/new/': typeof appProjectsNewIndexRoute
  '/(app)/test-cases/inbox/': typeof appTestCasesInboxIndexRoute
  '/(app)/test-cases/new/': typeof appTestCasesNewIndexRoute
  '/(app)/users/new/': typeof appUsersNewIndexRoute
  '/(app)/projects/$projectId/insights/': typeof appProjectsProjectIdInsightsIndexRoute
  '/(app)/projects/$projectId/reports/': typeof appProjectsProjectIdReportsIndexRoute
  '/(app)/projects/$projectId/settings/': typeof appProjectsProjectIdSettingsIndexRoute
  '/(app)/projects/$projectId/test-cases/': typeof appProjectsProjectIdTestCasesIndexRoute
  '/(app)/projects/$projectId/test-plans/': typeof appProjectsProjectIdTestPlansIndexRoute
  '/(app)/projects/$projectId/testers/': typeof appProjectsProjectIdTestersIndexRoute
  '/(app)/test-cases/inbox/$testCaseId/': typeof appTestCasesInboxTestCaseIdIndexRoute
  '/(app)/projects/$projectId/test-cases/$testCaseId/': typeof appProjectsProjectIdTestCasesTestCaseIdIndexRoute
  '/(app)/projects/$projectId/test-cases/new/': typeof appProjectsProjectIdTestCasesNewIndexRoute
  '/(app)/projects/$projectId/test-plans/new/': typeof appProjectsProjectIdTestPlansNewIndexRoute
  '/(app)/projects/$projectId/test-plans/$testPlanID/execute/': typeof appProjectsProjectIdTestPlansTestPlanIDExecuteIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/login'
    | '/logout'
    | '/testers/invite'
    | '/dashboard'
    | '/integrations'
    | '/projects'
    | '/reports'
    | '/settings'
    | '/test-cases'
    | '/test-plans'
    | '/testers'
    | '/users'
    | '/users/view/$userID'
    | '/projects/$projectId'
    | '/projects/new'
    | '/test-cases/inbox'
    | '/test-cases/new'
    | '/users/new'
    | '/projects/$projectId/insights'
    | '/projects/$projectId/reports'
    | '/projects/$projectId/settings'
    | '/projects/$projectId/test-cases'
    | '/projects/$projectId/test-plans'
    | '/projects/$projectId/testers'
    | '/test-cases/inbox/$testCaseId'
    | '/projects/$projectId/test-cases/$testCaseId'
    | '/projects/$projectId/test-cases/new'
    | '/projects/$projectId/test-plans/new'
    | '/projects/$projectId/test-plans/$testPlanID/execute'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/login'
    | '/logout'
    | '/'
    | '/testers/invite'
    | '/dashboard'
    | '/integrations'
    | '/projects'
    | '/reports'
    | '/settings'
    | '/test-cases'
    | '/test-plans'
    | '/testers'
    | '/users'
    | '/users/view/$userID'
    | '/projects/$projectId'
    | '/projects/new'
    | '/test-cases/inbox'
    | '/test-cases/new'
    | '/users/new'
    | '/projects/$projectId/insights'
    | '/projects/$projectId/reports'
    | '/projects/$projectId/settings'
    | '/projects/$projectId/test-cases'
    | '/projects/$projectId/test-plans'
    | '/projects/$projectId/testers'
    | '/test-cases/inbox/$testCaseId'
    | '/projects/$projectId/test-cases/$testCaseId'
    | '/projects/$projectId/test-cases/new'
    | '/projects/$projectId/test-plans/new'
    | '/projects/$projectId/test-plans/$testPlanID/execute'
  id:
    | '__root__'
    | '/(app)'
    | '/(auth)/login'
    | '/(auth)/logout'
    | '/(app)/'
    | '/(app)/testers/invite'
    | '/(app)/dashboard/'
    | '/(app)/integrations/'
    | '/(app)/projects/'
    | '/(app)/reports/'
    | '/(app)/settings/'
    | '/(app)/test-cases/'
    | '/(app)/test-plans/'
    | '/(app)/testers/'
    | '/(app)/users/'
    | '/(app)/users/view/$userID'
    | '/(app)/projects/$projectId/'
    | '/(app)/projects/new/'
    | '/(app)/test-cases/inbox/'
    | '/(app)/test-cases/new/'
    | '/(app)/users/new/'
    | '/(app)/projects/$projectId/insights/'
    | '/(app)/projects/$projectId/reports/'
    | '/(app)/projects/$projectId/settings/'
    | '/(app)/projects/$projectId/test-cases/'
    | '/(app)/projects/$projectId/test-plans/'
    | '/(app)/projects/$projectId/testers/'
    | '/(app)/test-cases/inbox/$testCaseId/'
    | '/(app)/projects/$projectId/test-cases/$testCaseId/'
    | '/(app)/projects/$projectId/test-cases/new/'
    | '/(app)/projects/$projectId/test-plans/new/'
    | '/(app)/projects/$projectId/test-plans/$testPlanID/execute/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  appRouteRoute: typeof appRouteRouteWithChildren
  authLoginRoute: typeof authLoginRoute
  authLogoutRoute: typeof authLogoutRoute
}

const rootRouteChildren: RootRouteChildren = {
  appRouteRoute: appRouteRouteWithChildren,
  authLoginRoute: authLoginRoute,
  authLogoutRoute: authLogoutRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/(app)",
        "/(auth)/login",
        "/(auth)/logout"
      ]
    },
    "/(app)": {
      "filePath": "(app)/route.tsx",
      "children": [
        "/(app)/",
        "/(app)/testers/invite",
        "/(app)/dashboard/",
        "/(app)/integrations/",
        "/(app)/projects/",
        "/(app)/reports/",
        "/(app)/settings/",
        "/(app)/test-cases/",
        "/(app)/test-plans/",
        "/(app)/testers/",
        "/(app)/users/",
        "/(app)/users/view/$userID",
        "/(app)/projects/$projectId/",
        "/(app)/projects/new/",
        "/(app)/test-cases/inbox/",
        "/(app)/test-cases/new/",
        "/(app)/users/new/",
        "/(app)/projects/$projectId/insights/",
        "/(app)/projects/$projectId/reports/",
        "/(app)/projects/$projectId/settings/",
        "/(app)/projects/$projectId/test-cases/",
        "/(app)/projects/$projectId/test-plans/",
        "/(app)/projects/$projectId/testers/",
        "/(app)/test-cases/inbox/$testCaseId/",
        "/(app)/projects/$projectId/test-cases/$testCaseId/",
        "/(app)/projects/$projectId/test-cases/new/",
        "/(app)/projects/$projectId/test-plans/new/",
        "/(app)/projects/$projectId/test-plans/$testPlanID/execute/"
      ]
    },
    "/(auth)/login": {
      "filePath": "(auth)/login.tsx"
    },
    "/(auth)/logout": {
      "filePath": "(auth)/logout.tsx"
    },
    "/(app)/": {
      "filePath": "(app)/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/testers/invite": {
      "filePath": "(app)/testers/invite.tsx",
      "parent": "/(app)"
    },
    "/(app)/dashboard/": {
      "filePath": "(app)/dashboard/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/integrations/": {
      "filePath": "(app)/integrations/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/": {
      "filePath": "(app)/projects/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/reports/": {
      "filePath": "(app)/reports/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/settings/": {
      "filePath": "(app)/settings/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/test-cases/": {
      "filePath": "(app)/test-cases/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/test-plans/": {
      "filePath": "(app)/test-plans/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/testers/": {
      "filePath": "(app)/testers/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/users/": {
      "filePath": "(app)/users/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/users/view/$userID": {
      "filePath": "(app)/users/view/$userID.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/$projectId/": {
      "filePath": "(app)/projects/$projectId/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/new/": {
      "filePath": "(app)/projects/new/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/test-cases/inbox/": {
      "filePath": "(app)/test-cases/inbox/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/test-cases/new/": {
      "filePath": "(app)/test-cases/new/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/users/new/": {
      "filePath": "(app)/users/new/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/$projectId/insights/": {
      "filePath": "(app)/projects/$projectId/insights/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/$projectId/reports/": {
      "filePath": "(app)/projects/$projectId/reports/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/$projectId/settings/": {
      "filePath": "(app)/projects/$projectId/settings/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/$projectId/test-cases/": {
      "filePath": "(app)/projects/$projectId/test-cases/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/$projectId/test-plans/": {
      "filePath": "(app)/projects/$projectId/test-plans/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/$projectId/testers/": {
      "filePath": "(app)/projects/$projectId/testers/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/test-cases/inbox/$testCaseId/": {
      "filePath": "(app)/test-cases/inbox/$testCaseId/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/$projectId/test-cases/$testCaseId/": {
      "filePath": "(app)/projects/$projectId/test-cases/$testCaseId/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/$projectId/test-cases/new/": {
      "filePath": "(app)/projects/$projectId/test-cases/new/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/$projectId/test-plans/new/": {
      "filePath": "(app)/projects/$projectId/test-plans/new/index.tsx",
      "parent": "/(app)"
    },
    "/(app)/projects/$projectId/test-plans/$testPlanID/execute/": {
      "filePath": "(app)/projects/$projectId/test-plans/$testPlanID/execute/index.tsx",
      "parent": "/(app)"
    }
  }
}
ROUTE_MANIFEST_END */
