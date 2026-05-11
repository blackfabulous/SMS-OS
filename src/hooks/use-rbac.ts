'use client'

import { useState, useCallback, useMemo } from 'react'
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
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole)

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
    (groups: Array<{ label: string; items: Array<{ id: string; [key: string]: unknown }> }>) => {
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
