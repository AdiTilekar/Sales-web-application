const MAX_COL_WIDTH = 42

const computeColumnWidths = (rows) => {
  if (!rows.length) return []
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)

  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const longest = rows.reduce((max, row) => {
      const value = row[columnIndex]
      const text = value == null ? '' : String(value)
      return Math.max(max, text.length)
    }, 10)

    return { wch: Math.min(MAX_COL_WIDTH, longest + 2) }
  })
}

const addSummarySheet = (XLSX, workbook, reportTitle, summaryRows, totalRows) => {
  const summaryData = [
    [reportTitle],
    [],
    ['Generated On', new Date().toLocaleString('en-IN')],
    ...summaryRows,
    ['Total Rows', totalRows],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = computeColumnWidths(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
}

const addDetailSheet = (XLSX, workbook, sheetName, headers, rows) => {
  const detailData = [headers, ...rows]
  const detailSheet = XLSX.utils.aoa_to_sheet(detailData)
  const lastColumn = XLSX.utils.encode_col(Math.max(headers.length - 1, 0))

  detailSheet['!autofilter'] = { ref: `A1:${lastColumn}1` }
  detailSheet['!cols'] = computeColumnWidths(detailData)
  XLSX.utils.book_append_sheet(workbook, detailSheet, sheetName)
}

export const downloadExcelReport = async ({
  reportTitle,
  filePrefix,
  headers,
  rows,
  summaryRows,
  detailSheetName = 'Sales Details',
}) => {
  if (!Array.isArray(rows) || rows.length === 0) return false

  const XLSX = await import('xlsx')

  const workbook = XLSX.utils.book_new()
  addSummarySheet(XLSX, workbook, reportTitle, summaryRows || [], rows.length)
  addDetailSheet(XLSX, workbook, detailSheetName, headers, rows)

  const fileDate = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `${filePrefix}_${fileDate}.xlsx`)
  return true
}
