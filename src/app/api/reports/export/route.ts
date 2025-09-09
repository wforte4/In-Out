import { NextRequest, NextResponse } from 'next/server'
/* eslint-disable @typescript-eslint/no-require-imports */
const { getServerSession } = require('next-auth')
import { authOptions } from '@/lib/auth'

interface ReportData {
  totalHours: number
  totalCost: number
  employeeBreakdown: Array<{
    userId: string
    userName: string
    userEmail: string
    hours: number
    cost: number
    entries: number
  }>
  projectBreakdown: Array<{
    projectId: string
    projectName: string
    hours: number
    cost: number
    entries: number
  }>
  timeEntries: Array<{
    id: string
    clockIn: string
    clockOut: string
    totalHours: number
    description: string
    user: {
      name: string | null
      email: string
    }
    project?: {
      id: string
      name: string
    } | null
    hourlyRate: number | null
    calculatedCost: number
  }>
}

function generateCSV(reportData: ReportData, reportType: string): string {
  const lines: string[] = []

  if (reportType === 'payroll' || reportType === 'time-summary') {
    // Employee summary CSV
    lines.push('Employee,Email,Total Hours,Total Cost,Number of Entries')
    reportData.employeeBreakdown.forEach(emp => {
      lines.push(`"${emp.userName || emp.userEmail}","${emp.userEmail}",${emp.hours.toFixed(2)},${emp.cost.toFixed(2)},${emp.entries}`)
    })
  } else if (reportType === 'project-costs') {
    // Project summary CSV
    lines.push('Project,Total Hours,Total Cost,Number of Entries')
    reportData.projectBreakdown.forEach(proj => {
      lines.push(`"${proj.projectName}",${proj.hours.toFixed(2)},${proj.cost.toFixed(2)},${proj.entries}`)
    })
  } else if (reportType === 'detailed-timesheet') {
    // Detailed timesheet CSV
    lines.push('Date,Employee,Email,Clock In,Clock Out,Hours,Project,Rate,Cost,Description')
    reportData.timeEntries.forEach(entry => {
      const clockInDate = new Date(entry.clockIn).toLocaleDateString()
      const clockInTime = new Date(entry.clockIn).toLocaleTimeString()
      const clockOutTime = entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : 'N/A'
      const projectName = entry.project?.name || 'No Project'
      const description = (entry.description || '').replace(/"/g, '""')

      lines.push(`"${clockInDate}","${entry.user.name || entry.user.email}","${entry.user.email}","${clockInTime}","${clockOutTime}",${entry.totalHours?.toFixed(2) || 0},"${projectName}",${entry.hourlyRate?.toFixed(2) || 0},${entry.calculatedCost.toFixed(2)},"${description}"`)
    })
  }

  return lines.join('\n')
}

function generateQuickBooksIIF(reportData: ReportData, reportType: string, startDate: string): string {
  const lines: string[] = []

  // IIF Header
  lines.push('!HDR\tVER\tREL\tCOMP\tDATE\tTIME\tACCNT\tENTITY\tCLASS\tTXNTYPE\tUSERREF')
  lines.push('!HDR\t8\t0\t\t\t\t\t\t\t\t')

  // Account definitions (if needed)
  lines.push('!ACCNT\tNAME\tREFNUM\tTIMESTAMP\tACCNTTYPE\tOBJECTREF_LISTID\tPARENTREF_LISTID')
  lines.push('ACCNT\tPayroll Expenses\t\t\tEXP\t\t')
  lines.push('ACCNT\tTime Tracking\t\t\tEXP\t\t')

  // Employee definitions
  lines.push('!EMP\tNAME\tREFNUM\tTIMESTAMP\tADDR1\tADDR2\tADDR3\tADDR4\tADDR5')
  const uniqueEmployees = new Set()
  reportData.employeeBreakdown.forEach(emp => {
    if (!uniqueEmployees.has(emp.userEmail)) {
      uniqueEmployees.add(emp.userEmail)
      const empName = (emp.userName || emp.userEmail).replace(/\t/g, ' ')
      lines.push(`EMP\t${empName}\t\t\t\t\t\t\t`)
    }
  })

  if (reportType === 'payroll') {
    // Generate payroll entries
    lines.push('!TIMEACT\tDATE\tJOB\tEMP\tITEM\tDURATION\tCLASS\tNOTE\tBILLABLESTATUS\tWAGETYPE')

    reportData.timeEntries.forEach((entry) => {
      const date = new Date(entry.clockIn).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
      const empName = (entry.user.name || entry.user.email).replace(/\t/g, ' ')
      const projectName = entry.project?.name || 'General'
      const hours = entry.totalHours?.toFixed(2) || '0.00'
      const description = (entry.description || 'Time entry').replace(/\t/g, ' ').replace(/\n/g, ' ')

      lines.push(`TIMEACT\t${date}\t${projectName}\t${empName}\tRegular Time\t${hours}:00\t\t${description}\tBillable\tRegular`)
    })
  } else {
    // Generate expense entries for cost tracking
    lines.push('!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\tTOPRINT\tADDR1\tADDR2\tADDR3\tVATAMT\tEXCHRATE')
    lines.push('!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\tQNTY\tPRICE\tINVITEM\tREIMBEXP\tSERVICEDATE\tTAXABLE\tVATCODE\tVATAMT\tEXCHRATE')

    reportData.employeeBreakdown.forEach((emp, index) => {
      const date = new Date(startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
      const empName = (emp.userName || emp.userEmail).replace(/\t/g, ' ')
      const amount = emp.cost.toFixed(2)
      const memo = `Time tracking costs for ${empName} (${emp.hours.toFixed(2)} hours)`

      lines.push(`TRNS\tEXP\t${date}\tTime Tracking\t${empName}\t\t${amount}\t\t${memo}\tN\tN\t\t\t\t\t`)
      lines.push(`SPL\t${index + 1}\tEXP\t${date}\tPayroll Expenses\t${empName}\t\t-${amount}\t\t${memo}\tN\t${emp.hours.toFixed(2)}\t${(emp.cost / emp.hours).toFixed(2)}\t\t\t\tN\t\t\t`)
    })
  }

  lines.push('!ENDTRNS')

  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reportData, format, reportType, startDate } = await request.json()

    if (!reportData || !format) {
      return NextResponse.json({ error: 'Report data and format are required' }, { status: 400 })
    }

    let content: string
    let contentType: string
    let fileExtension: string

    if (format === 'csv') {
      content = generateCSV(reportData, reportType)
      contentType = 'text/csv'
      fileExtension = 'csv'
    } else if (format === 'quickbooks') {
      content = generateQuickBooksIIF(reportData, reportType, startDate)
      contentType = 'application/octet-stream'
      fileExtension = 'iif'
    } else {
      return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 })
    }

    const response = new NextResponse(content)
    response.headers.set('Content-Type', contentType)
    response.headers.set('Content-Disposition', `attachment; filename="report.${fileExtension}"`)

    return response
  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}