'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import {
  hasPermission,
  canPerformAction,
  getAccessibleModules,
  getRolePermissions,
  hasFullAccess,
  getRoleDisplayName,
  getRoleColor,
  getAllRoles,
  type UserRole,
  type Action,
} from '@/lib/rbac'

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useRBAC(initialRole: UserRole = 'ADMIN') {
  const storeRole = useAppStore((state) => state.currentRole)
  const storeSetRole = useAppStore((state) => state.setCurrentRole)

  const currentRole = storeRole || initialRole

  useEffect(() => {
    if (!storeRole && initialRole) {
      storeSetRole(initialRole)
    }
  }, [initialRole, storeRole, storeSetRole])

  const setCurrentRole = storeSetRole

  const accessibleModules = useMemo(() => getAccessibleModules(currentRole), [currentRole])
  const rolePermissions = useMemo(() => getRolePermissions(currentRole), [currentRole])

  const checkPermission = useCallback(
    (module: string) => hasPermission(currentRole, module),
    [currentRole]
  )

  const checkAction = useCallback(
    (module: string, action: Action) => canPerformAction(currentRole, module, action),
    [currentRole]
  )

  const checkFullAccess = useCallback(
    (module: string) => hasFullAccess(currentRole, module),
    [currentRole]
  )

  const filterNavItems = useCallback(
    (items: Array<{ id: string; [key: string]: unknown }>) => {
      return items.filter((item) => hasPermission(currentRole, item.id))
    },
    [currentRole]
  )

  const filterNavGroups = useCallback(
    <T extends { id: string }>(
      groups: Array<{ label: string; items: T[] }>
    ): Array<{ label: string; items: T[] }> => {
      return groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => hasPermission(currentRole, item.id)),
        }))
        .filter((group) => group.items.length > 0)
    },
    [currentRole]
  )

  return {
    currentRole,
    setCurrentRole,
    roleName: getRoleDisplayName(currentRole),
    roleColor: getRoleColor(currentRole),
    accessibleModules,
    rolePermissions,
    allRoles: getAllRoles(),
    hasPermission: checkPermission,
    canPerformAction: checkAction,
    hasFullAccess: checkFullAccess,
    filterNavItems,
    filterNavGroups,
  }
}
