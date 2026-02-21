// @ts-nocheck
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { getPhaseLabel, getStatusBadgeColor, formatCurrency, calculateMargin } from '@/lib/project-utils'
import { format } from 'date-fns'

interface ProjectsTableProps {
  projects: any[]
  architects?: { id: string; first_name: string | null; last_name: string | null }[]
  onEdit: (project: any) => void
  onDelete: (project: any) => void
}

export function ProjectsTable({ projects, architects = [], onEdit, onDelete }: ProjectsTableProps) {
  const getArchitectName = (project: any) => {
    if (project.profiles) {
      return `${project.profiles.first_name || ''} ${project.profiles.last_name || ''}`.trim()
    }
    if (project.architect_id && architects.length) {
      const a = architects.find((x) => x.id === project.architect_id)
      return a ? `${a.first_name || ''} ${a.last_name || ''}`.trim() : ''
    }
    return ''
  }
  const [sortColumn, setSortColumn] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedProjects = [...projects].sort((a, b) => {
    let aValue = a[sortColumn]
    let bValue = b[sortColumn]

    if (sortColumn === 'client') {
      aValue = `${a.clients?.first_name || ''} ${a.clients?.last_name || ''}`
      bValue = `${b.clients?.first_name || ''} ${b.clients?.last_name || ''}`
    }

    if (sortColumn === 'architect') {
      aValue = getArchitectName(a)
      bValue = getArchitectName(b)
    }

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    if (typeof aValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
  })

  return (
    <div className="space-y-4 md:space-y-0">
      {/* Vue cartes mobile */}
      <div className="space-y-3 md:hidden">
        {sortedProjects.length === 0 ? (
          <p className="py-8 text-center text-gray-500">Aucun projet trouvé</p>
        ) : (
          sortedProjects.map((project) => {
            return (
              <Card key={project.id} className="p-4">
                <CardContent className="p-0">
                  <div className="flex items-start gap-3">
                    {project.cover_image_url ? (
                      <img
                        src={project.cover_image_url}
                        alt={project.name}
                        className="h-14 w-14 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-gray-200 text-xs text-gray-400">
                        Photo
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/projects/${project.id}`}
                        className="block truncate font-medium text-gray-900 hover:text-[#C5A572] hover:underline"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {project.clients
                          ? `${project.clients.first_name} ${project.clients.last_name}`
                          : '-'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {getPhaseLabel(project.current_phase)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {Math.round(Number(project.progress) || 0)}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        Budget: {formatCurrency(Number(project.budget_estimated) || 0)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/projects/${project.id}`}
                            className="flex cursor-pointer items-center"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEdit(project)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(project)}
                          className="cursor-pointer text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Tableau tablette / desktop */}
      <div className="hidden md:block overflow-x-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Photo</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('name')}
            >
              Nom du projet
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('client')}
            >
              Client
            </TableHead>
            <TableHead>Adresse</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('current_phase')}
            >
              Phase
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('progress')}
            >
              Progression
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('budget_estimated')}
            >
              Budget
            </TableHead>
            <TableHead>Dépensé</TableHead>
            <TableHead>Marge</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('deadline')}
            >
              Livraison
            </TableHead>
            <TableHead>Architecte</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                Aucun projet trouvé
              </TableCell>
            </TableRow>
          ) : (
            sortedProjects.map((project) => {
              const margin = calculateMargin(
                Number(project.budget_estimated) || 0,
                Number(project.budget_spent) || 0
              )

              return (
                <TableRow key={project.id} className="hover:bg-gray-50">
                  <TableCell>
                    {project.cover_image_url ? (
                      <img
                        src={project.cover_image_url}
                        alt={project.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                        Pas de photo
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/projects/${project.id}`}
                      className="hover:text-[#C5A572] hover:underline"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {project.clients ? (
                      <div>
                        <p className="font-medium text-sm">
                          {project.clients.first_name} {project.clients.last_name}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {project.address && (
                        <p className="text-gray-900">{project.address}</p>
                      )}
                      {project.city && (
                        <p className="text-gray-500 text-xs">
                          {project.postal_code} {project.city}
                        </p>
                      )}
                      {!project.address && !project.city && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getPhaseLabel(project.current_phase)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={Number(project.progress) || 0} className="w-20" />
                      <span className="text-xs text-gray-600 min-w-[2rem]">
                        {Math.round(Number(project.progress) || 0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(project.budget_estimated) || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(project.budget_spent) || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p
                        className={`font-medium text-sm ${
                          margin.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(margin.amount)}
                      </p>
                      <p
                        className={`text-xs ${
                          margin.amount >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {margin.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.deadline ? (
                      <span className="text-sm">
                        {format(new Date(project.deadline), 'dd MMM yyyy')}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getArchitectName(project) ? (
                      <span className="text-sm">{getArchitectName(project)}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/projects/${project.id}`}
                            className="flex items-center cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEdit(project)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(project)}
                          className="cursor-pointer text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
