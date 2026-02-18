// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Eye, Download, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import jsPDF from 'jspdf'

const OUTILS = ['Mètre laser', 'Mètre ruban', 'Laser + ruban', 'Scanner 3D']
const FORMES = ['Rectangle', 'L', 'U', 'Trapèze', 'Irrégulière']
const NOMS_PIECES = [
  'Entrée', 'Salon', 'Salle à manger', 'Cuisine', 'Chambre parentale', 'Chambre enfant',
  'Bureau', 'Salle de bain', 'Salle d\'eau', 'WC', 'Buanderie', 'Dressing', 'Couloir',
  'Terrasse', 'Jardin', 'Autre',
]

type Room = {
  id: string
  roomName: string
  roomNameCustom: string
  shape: string
  length: string
  width: string
  heightCeiling: string
  heightBeam: string
  doorsCount: string
  doorsWidth: string
  doorsHeight: string
  windowsCount: string
  windowsWidth: string
  windowsHeight: string
  windowsAllège: string
  radiatorsCount: string
  radiatorsWidth: string
  outletsCount: string
  outletsPositions: string
  remarks: string
}

function generateId() {
  return `room-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function roomSurfaceSol(room: Room): number {
  const l = parseFloat(room.length) || 0
  const w = parseFloat(room.width) || 0
  return (l * w) / 10000
}

function roomSurfaceMurs(room: Room): number {
  const len = parseFloat(room.length) || 0
  const wid = parseFloat(room.width) || 0
  const h = parseFloat(room.heightCeiling) || 0
  return (2 * (len + wid) * h) / 10000
}

const defaultRoom = (): Room => ({
  id: generateId(),
  roomName: '',
  roomNameCustom: '',
  shape: 'Rectangle',
  length: '',
  width: '',
  heightCeiling: '',
  heightBeam: '',
  doorsCount: '',
  doorsWidth: '',
  doorsHeight: '',
  windowsCount: '',
  windowsWidth: '',
  windowsHeight: '',
  windowsAllège: '',
  radiatorsCount: '',
  radiatorsWidth: '',
  outletsCount: '',
  outletsPositions: '',
  remarks: '',
})

export default function MeasurementsPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('form')
  const [docNumber] = useState(() => `RM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`)
  const [dateReleve, setDateReleve] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [projectId, setProjectId] = useState('')
  const [clientName, setClientName] = useState('')
  const [personReleve, setPersonReleve] = useState('')
  const [outil, setOutil] = useState('')
  const [rooms, setRooms] = useState<Room[]>([])
  const [escalier, setEscalier] = useState(false)
  const [escalierMarches, setEscalierMarches] = useState('')
  const [escalierGiron, setEscalierGiron] = useState('')
  const [escalierHauteurMarche, setEscalierHauteurMarche] = useState('')
  const [cheminee, setCheminee] = useState(false)
  const [chemineeDimensions, setChemineeDimensions] = useState('')
  const [placards, setPlacards] = useState(false)
  const [placardsDimensions, setPlacardsDimensions] = useState('')
  const [projects, setProjects] = useState<{ id: string; name: string; client_id: string }[]>([])
  const [clients, setClients] = useState<{ id: string; first_name: string; last_name: string }[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        let q = supabase.from('projects').select('id, name, client_id').is('deleted_at', null).order('name')
        if (profile?.company_id) q = q.eq('company_id', profile.company_id)
        const { data: proj } = await q
        setProjects(proj || [])

        let qc = supabase.from('clients').select('id, first_name, last_name')
        if (profile?.company_id) qc = qc.eq('company_id', profile.company_id)
        const { data: cli } = await qc
        setClients(cli || [])
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [profile?.company_id])

  useEffect(() => {
    if (!projectId) {
      setClientName('')
      return
    }
    const p = projects.find((x) => x.id === projectId)
    if (!p?.client_id) {
      setClientName('')
      return
    }
    const c = clients.find((x) => x.id === p.client_id)
    setClientName(c ? `${c.first_name} ${c.last_name}` : '')
  }, [projectId, projects, clients])

  const addRoom = () => setRooms((r) => [...r, defaultRoom()])
  const removeRoom = (id: string) => setRooms((r) => r.filter((x) => x.id !== id))
  const updateRoom = (id: string, key: keyof Room, value: string) => {
    setRooms((r) => r.map((x) => (x.id === id ? { ...x, [key]: value } : x)))
  }

  const totalSurfaceSol = rooms.reduce((s, room) => s + roomSurfaceSol(room), 0)
  const totalSurfaceMurs = rooms.reduce((s, room) => s + roomSurfaceMurs(room), 0)

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-lg p-5 mb-6 shadow-sm" style={{ backgroundColor: '#FAFAF8' }}>
      <h2 className="font-serif text-lg mb-4" style={{ color: '#C5A572' }}>{title}</h2>
      {children}
    </div>
  )

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const m = 18
      const w = doc.internal.pageSize.getWidth() - 2 * m
      let y = m

      doc.setFont('helvetica')
      doc.setFontSize(20)
      doc.setTextColor(197, 165, 114)
      doc.text('INDESIGN', m, y)
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text('RELEVÉ DE MESURES', doc.internal.pageSize.getWidth() - m, y, { align: 'right' })
      y += 8
      doc.setDrawColor(197, 165, 114)
      doc.setLineWidth(0.5)
      doc.line(m, y, doc.internal.pageSize.getWidth() - m, y)
      y += 10
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      doc.text(`N° ${docNumber}  |  Date : ${format(new Date(dateReleve), 'd MMMM yyyy', { locale: fr })}  |  Projet : ${projects.find((p) => p.id === projectId)?.name || '-'}  |  Client : ${clientName || '-'}`, m, y)
      y += 10

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      const colW = [50, 22, 22, 22, 28, 28]
      const headers = ['Pièce', 'L (cm)', 'l (cm)', 'H (cm)', 'Sol m²', 'Murs m²']
      doc.setFont('helvetica', 'bold')
      headers.forEach((h, i) => doc.text(h, m + colW.slice(0, i).reduce((a, b) => a + b, 0), y))
      y += 7
      doc.setDrawColor(197, 165, 114)
      doc.line(m, y, doc.internal.pageSize.getWidth() - m, y)
      y += 6
      doc.setFont('helvetica', 'normal')

      rooms.forEach((room) => {
        const name = room.roomName === 'Autre' ? room.roomNameCustom : room.roomName
        const sol = roomSurfaceSol(room)
        const murs = roomSurfaceMurs(room)
        doc.text(name || '-', m, y)
        doc.text(room.length || '-', m + 50, y)
        doc.text(room.width || '-', m + 72, y)
        doc.text(room.heightCeiling || '-', m + 94, y)
        doc.text(sol.toFixed(2), m + 116, y)
        doc.text(murs.toFixed(2), m + 144, y)
        y += 6
      })

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(197, 165, 114)
      doc.text('TOTAL', m, y)
      doc.text(totalSurfaceSol.toFixed(2), m + 116, y)
      doc.text(totalSurfaceMurs.toFixed(2), m + 144, y)
      doc.text(`${rooms.length} pièce(s)`, m + 50, y)
      y += 10

      if (escalier && (escalierMarches || escalierGiron || escalierHauteurMarche)) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(197, 165, 114)
        doc.text('Escalier', m, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(`Marches : ${escalierMarches}  |  Giron : ${escalierGiron} cm  |  Hauteur marche : ${escalierHauteurMarche} cm`, m, y)
        y += 8
      }
      if (cheminee && chemineeDimensions) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(197, 165, 114)
        doc.text('Cheminée', m, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(chemineeDimensions, m, y)
        y += 8
      }
      if (placards && placardsDimensions) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(197, 165, 114)
        doc.text('Placards existants', m, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        const lines = doc.splitTextToSize(placardsDimensions, w)
        lines.forEach((line: string) => { doc.text(line, m, y); y += 5 })
        y += 4
      }

      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text('INDESIGN | Confidentiel | Relevé de mesures', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })

      doc.save(`Releve-Mesures-${docNumber}.pdf`)
      toast.success('PDF téléchargé')
    } catch (e) {
      console.error(e)
      toast.error('Erreur génération PDF')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-light text-gray-900">Fiche de Relevé de Mesures</h1>
        <Button variant="ghost" onClick={() => router.push('/documents-pro')}>
          Retour
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 rounded-lg bg-gray-100 p-1">
          <TabsTrigger value="form" className="rounded-md data-[state=active]:bg-[#C5A572] data-[state=active]:text-white">
            📝 Formulaire
          </TabsTrigger>
          <TabsTrigger value="preview" className="rounded-md data-[state=active]:bg-[#C5A572] data-[state=active]:text-white">
            👁️ Aperçu
          </TabsTrigger>
          <TabsTrigger value="pdf" className="rounded-md data-[state=active]:bg-[#C5A572] data-[state=active]:text-white">
            📄 PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="mt-6">
          <div className="max-w-4xl space-y-2">
            <Section title="Informations">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Numéro</Label>
                  <Input className="rounded-lg bg-gray-50 font-mono" value={docNumber} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Date du relevé</Label>
                  <Input type="date" className="rounded-lg" value={dateReleve} onChange={(e) => setDateReleve(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Projet</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Input className="rounded-lg bg-gray-50" value={clientName} readOnly placeholder="Rempli selon le projet" />
                </div>
                <div className="space-y-2">
                  <Label>Personne ayant fait le relevé</Label>
                  <Input className="rounded-lg" value={personReleve} onChange={(e) => setPersonReleve(e.target.value)} placeholder="Nom" />
                </div>
                <div className="space-y-2">
                  <Label>Outil utilisé</Label>
                  <Select value={outil} onValueChange={setOutil}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {OUTILS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Section>

            <Section title="Mesures par Pièce">
              <Button type="button" onClick={addRoom} className="mb-4 bg-[#C5A572] hover:bg-[#B08D5B] text-white rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une pièce
              </Button>

              {rooms.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">Aucune pièce. Cliquez sur « Ajouter une pièce ».</p>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {rooms.map((room) => (
                    <AccordionItem key={room.id} value={room.id} className="border rounded-lg px-4 bg-white shadow-sm">
                      <AccordionTrigger className="hover:no-underline">
                        <span className="font-medium">
                          {room.roomName === 'Autre' ? room.roomNameCustom || 'Nouvelle pièce' : room.roomName || 'Sans nom'}
                        </span>
                        <span className="text-sm font-normal text-[#C5A572] ml-2">
                          Sol : {roomSurfaceSol(room).toFixed(2)} m²
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                          <div className="space-y-2">
                            <Label>Nom de la pièce</Label>
                            <Select value={room.roomName} onValueChange={(v) => updateRoom(room.id, 'roomName', v)}>
                              <SelectTrigger className="rounded-lg"><SelectValue placeholder="Choisir" /></SelectTrigger>
                              <SelectContent>
                                {NOMS_PIECES.map((n) => (
                                  <SelectItem key={n} value={n}>{n}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {room.roomName === 'Autre' && (
                              <Input className="rounded-lg" placeholder="Nom personnalisé" value={room.roomNameCustom} onChange={(e) => updateRoom(room.id, 'roomNameCustom', e.target.value)} />
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Forme</Label>
                            <Select value={room.shape} onValueChange={(v) => updateRoom(room.id, 'shape', v)}>
                              <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {FORMES.map((f) => (
                                  <SelectItem key={f} value={f}>{f}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2"><Label>Longueur (cm)</Label><Input type="number" className="rounded-lg" value={room.length} onChange={(e) => updateRoom(room.id, 'length', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Largeur (cm)</Label><Input type="number" className="rounded-lg" value={room.width} onChange={(e) => updateRoom(room.id, 'width', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Hauteur sous plafond (cm)</Label><Input type="number" className="rounded-lg" value={room.heightCeiling} onChange={(e) => updateRoom(room.id, 'heightCeiling', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Hauteur sous poutre (cm, opt.)</Label><Input type="number" className="rounded-lg" value={room.heightBeam} onChange={(e) => updateRoom(room.id, 'heightBeam', e.target.value)} /></div>
                          <div className="md:col-span-2">
                            <span className="text-sm font-medium">Surface sol : </span>
                            <span className="font-bold" style={{ color: '#C5A572' }}>{roomSurfaceSol(room).toFixed(2)} m²</span>
                            <span className="text-sm text-gray-500 ml-2">Surface murs : {roomSurfaceMurs(room).toFixed(2)} m²</span>
                          </div>
                          <div className="space-y-2"><Label>Portes (nombre)</Label><Input type="number" className="rounded-lg" value={room.doorsCount} onChange={(e) => updateRoom(room.id, 'doorsCount', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Largeur porte (cm)</Label><Input type="number" className="rounded-lg" value={room.doorsWidth} onChange={(e) => updateRoom(room.id, 'doorsWidth', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Hauteur porte (cm)</Label><Input type="number" className="rounded-lg" value={room.doorsHeight} onChange={(e) => updateRoom(room.id, 'doorsHeight', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Fenêtres (nombre)</Label><Input type="number" className="rounded-lg" value={room.windowsCount} onChange={(e) => updateRoom(room.id, 'windowsCount', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Largeur fenêtre (cm)</Label><Input type="number" className="rounded-lg" value={room.windowsWidth} onChange={(e) => updateRoom(room.id, 'windowsWidth', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Hauteur fenêtre (cm)</Label><Input type="number" className="rounded-lg" value={room.windowsHeight} onChange={(e) => updateRoom(room.id, 'windowsHeight', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Hauteur allège (cm)</Label><Input type="number" className="rounded-lg" value={room.windowsAllège} onChange={(e) => updateRoom(room.id, 'windowsAllège', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Radiateurs (nombre)</Label><Input type="number" className="rounded-lg" value={room.radiatorsCount} onChange={(e) => updateRoom(room.id, 'radiatorsCount', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Largeur radiateur (cm)</Label><Input type="number" className="rounded-lg" value={room.radiatorsWidth} onChange={(e) => updateRoom(room.id, 'radiatorsWidth', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Prises (nombre)</Label><Input type="number" className="rounded-lg" value={room.outletsCount} onChange={(e) => updateRoom(room.id, 'outletsCount', e.target.value)} /></div>
                          <div className="space-y-2"><Label>Positions prises</Label><Input className="rounded-lg" value={room.outletsPositions} onChange={(e) => updateRoom(room.id, 'outletsPositions', e.target.value)} placeholder="Ex: mur nord, mur sud" /></div>
                          <div className="md:col-span-2 space-y-2"><Label>Remarques</Label><Textarea className="rounded-lg" value={room.remarks} onChange={(e) => updateRoom(room.id, 'remarks', e.target.value)} rows={2} /></div>
                        </div>
                        <Button type="button" variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg" onClick={() => removeRoom(room.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer cette pièce
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {rooms.length > 0 && (
                <div className="mt-6 p-4 rounded-lg border-2 border-[#C5A572]/30 bg-white">
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <span className="text-sm text-gray-600">Surface totale sol : </span>
                      <span className="font-bold text-lg" style={{ color: '#C5A572' }}>{totalSurfaceSol.toFixed(2)} m²</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Surface totale murs : </span>
                      <span className="font-bold text-lg" style={{ color: '#C5A572' }}>{totalSurfaceMurs.toFixed(2)} m²</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Nombre de pièces : </span>
                      <span className="font-bold" style={{ color: '#C5A572' }}>{rooms.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Mesures Spécifiques">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Switch checked={escalier} onCheckedChange={setEscalier} />
                  <Label>Escalier</Label>
                </div>
                {escalier && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                    <div className="space-y-2"><Label>Marches</Label><Input type="number" className="rounded-lg" value={escalierMarches} onChange={(e) => setEscalierMarches(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Giron (cm)</Label><Input type="number" className="rounded-lg" value={escalierGiron} onChange={(e) => setEscalierGiron(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Hauteur marche (cm)</Label><Input type="number" className="rounded-lg" value={escalierHauteurMarche} onChange={(e) => setEscalierHauteurMarche(e.target.value)} /></div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Switch checked={cheminee} onCheckedChange={setCheminee} />
                  <Label>Cheminée</Label>
                </div>
                {cheminee && (
                  <div className="pl-6 space-y-2">
                    <Label>Dimensions</Label>
                    <Textarea className="rounded-lg" value={chemineeDimensions} onChange={(e) => setChemineeDimensions(e.target.value)} rows={2} placeholder="L × l × H cm..." />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Switch checked={placards} onCheckedChange={setPlacards} />
                  <Label>Placards existants</Label>
                </div>
                {placards && (
                  <div className="pl-6 space-y-2">
                    <Label>Dimensions</Label>
                    <Textarea className="rounded-lg" value={placardsDimensions} onChange={(e) => setPlacardsDimensions(e.target.value)} rows={3} placeholder="Décrire les placards et dimensions..." />
                  </div>
                )}
              </div>
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card className="max-w-4xl mx-auto rounded-xl shadow-sm overflow-hidden">
            <CardContent className="p-8 bg-white">
              <div className="space-y-6 font-sans text-sm text-gray-800">
                <div className="flex justify-between items-start border-b pb-3" style={{ borderColor: '#C5A572' }}>
                  <span className="font-serif text-xl" style={{ color: '#C5A572' }}>INDESIGN</span>
                  <div className="text-right">
                    <div className="font-serif text-lg font-medium text-gray-900">RELEVÉ DE MESURES</div>
                    <div className="text-xs text-gray-500 mt-1">N° {docNumber}</div>
                    <div className="text-xs text-gray-500">{format(new Date(dateReleve), 'd MMMM yyyy', { locale: fr })}</div>
                    {projects.find((p) => p.id === projectId)?.name && <div className="text-xs text-gray-600 mt-1">Projet : {projects.find((p) => p.id === projectId)?.name}</div>}
                    {clientName && <div className="text-xs text-gray-600">Client : {clientName}</div>}
                  </div>
                </div>

                {rooms.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#C5A572]/30">
                          <TableHead className="font-semibold">Pièce</TableHead>
                          <TableHead>L (cm)</TableHead>
                          <TableHead>l (cm)</TableHead>
                          <TableHead>H (cm)</TableHead>
                          <TableHead className="font-semibold" style={{ color: '#C5A572' }}>Sol m²</TableHead>
                          <TableHead className="font-semibold" style={{ color: '#C5A572' }}>Murs m²</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rooms.map((room) => (
                          <TableRow key={room.id}>
                            <TableCell className="font-medium">
                              {room.roomName === 'Autre' ? room.roomNameCustom || '-' : room.roomName || '-'}
                            </TableCell>
                            <TableCell>{room.length || '-'}</TableCell>
                            <TableCell>{room.width || '-'}</TableCell>
                            <TableCell>{room.heightCeiling || '-'}</TableCell>
                            <TableCell className="font-bold" style={{ color: '#C5A572' }}>{roomSurfaceSol(room).toFixed(2)}</TableCell>
                            <TableCell className="font-bold" style={{ color: '#C5A572' }}>{roomSurfaceMurs(room).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-[#FAFAF8] font-bold border-t-2" style={{ borderColor: '#C5A572' }}>
                          <TableCell>TOTAL</TableCell>
                          <TableCell colSpan={2}>{rooms.length} pièce(s)</TableCell>
                          <TableCell></TableCell>
                          <TableCell style={{ color: '#C5A572' }}>{totalSurfaceSol.toFixed(2)}</TableCell>
                          <TableCell style={{ color: '#C5A572' }}>{totalSurfaceMurs.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    {(escalier || cheminee || placards) && (
                      <div className="pt-4 space-y-2 text-sm">
                        {escalier && (escalierMarches || escalierGiron || escalierHauteurMarche) && (
                          <p><strong style={{ color: '#C5A572' }}>Escalier :</strong> Marches {escalierMarches} — Giron {escalierGiron} cm — Hauteur marche {escalierHauteurMarche} cm</p>
                        )}
                        {cheminee && chemineeDimensions && <p><strong style={{ color: '#C5A572' }}>Cheminée :</strong> {chemineeDimensions}</p>}
                        {placards && placardsDimensions && <p><strong style={{ color: '#C5A572' }}>Placards :</strong> {placardsDimensions}</p>}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-400 italic py-8">Ajoutez des pièces dans l’onglet Formulaire pour voir l’aperçu.</p>
                )}

                <div className="pt-6 mt-6 border-t border-gray-200 text-xs text-gray-500 text-center">
                  INDESIGN | Confidentiel | Relevé de mesures
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf" className="mt-6">
          <Card className="max-w-md mx-auto rounded-xl shadow-sm p-8">
            <CardContent className="flex flex-col gap-4">
              <Button size="lg" className="w-full bg-[#C5A572] hover:bg-[#B08D5B] text-white rounded-lg h-12" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-5 w-5" />
                Télécharger en PDF
              </Button>
              <Button variant="outline" size="lg" className="w-full border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572]/10 rounded-lg h-12" onClick={() => setActiveTab('preview')}>
                <Eye className="mr-2 h-5 w-5" />
                Prévisualiser le PDF
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">Le PDF reprend le tableau des mesures et totaux.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
