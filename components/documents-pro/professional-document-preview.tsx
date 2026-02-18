'use client'

import { ReactNode } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type ProfessionalDocumentPreviewProps = {
  documentNumber: string
  documentTitle: string
  documentDate: Date
  companyName?: string
  companyLogo?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  clientName?: string
  clientAddress?: string
  clientPhone?: string
  clientEmail?: string
  projectName?: string
  children?: ReactNode
}

export function ProfessionalDocumentPreview({
  documentNumber,
  documentTitle,
  documentDate,
  companyName = 'Votre Entreprise',
  companyLogo,
  companyAddress,
  companyPhone,
  companyEmail,
  clientName,
  clientAddress,
  clientPhone,
  clientEmail,
  projectName,
  children,
}: ProfessionalDocumentPreviewProps) {
  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white font-['Inter'] text-[#1A1A1A]">
      {/* Header with logo */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            {companyLogo ? (
              <div className="mb-3">
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="h-16 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-[#C5A572] rounded-lg flex items-center justify-center mb-3">
                <span className="text-white text-2xl font-bold">
                  {companyName.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 3)}
                </span>
              </div>
            )}
            <h2 className="text-xl font-bold text-[#1A1A1A]">{companyName}</h2>
            {companyAddress && <p className="text-sm text-gray-600 mt-1">{companyAddress}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
              {companyPhone && <span>{companyPhone}</span>}
              {companyEmail && <span>{companyEmail}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">N° Document</p>
            <p className="text-lg font-bold text-[#C5A572] font-mono">{documentNumber}</p>
            <p className="text-xs text-gray-600 mt-2">
              {format(documentDate, 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="h-0.5 w-full bg-[#C5A572]" aria-hidden />
      </div>

      {/* Document title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">{documentTitle}</h1>
        {projectName && (
          <p className="text-sm text-gray-600 uppercase tracking-wide">Projet: {projectName}</p>
        )}
      </div>

      {/* Client information */}
      {clientName && (
        <div className="mb-8 p-6 bg-[#F5F5F5] rounded-lg">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Informations client
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-[#1A1A1A]">{clientName}</p>
              {clientAddress && <p className="text-sm text-gray-600 mt-1">{clientAddress}</p>}
            </div>
            <div className="text-sm text-gray-600">
              {clientPhone && <p>{clientPhone}</p>}
              {clientEmail && <p>{clientEmail}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Document content */}
      <div className="mb-12">{children}</div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t-2 border-[#C5A572]">
        <div className="text-center text-xs text-gray-500">
          <p>{companyName}</p>
          {companyAddress && <p className="mt-1">{companyAddress}</p>}
          <p className="mt-1">
            {companyPhone && <span>{companyPhone}</span>}
            {companyPhone && companyEmail && <span> • </span>}
            {companyEmail && <span>{companyEmail}</span>}
          </p>
        </div>
      </div>
    </div>
  )
}
