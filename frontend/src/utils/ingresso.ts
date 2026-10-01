import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import type { ShowType } from './tipos'
import { formataData, formataPreco } from './formatos'

const PIX = '00020126430014BR.GOV.BCB.PIX0121mzmariani72@gmail.com520400005303986540510.005802BR5922Mateus Zanatta Mariani6009SAO PAULO62140510axzIGSRW2h6304EA90'

export async function geraIngresso(show: ShowType, cliente: string) {
  const doc = new jsPDF()
  const qrCode = await QRCode.toDataURL(PIX, { margin: 1, width: 400 })
  const local = show.local

  doc.setFillColor('#001d3d')
  doc.rect(0, 0, 210, 36, 'F')
  doc.setTextColor('#ffc300')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.text('ShowTime', 20, 22)
  doc.setTextColor('#ffffff')
  doc.setFontSize(12)
  doc.text('INGRESSO', 190, 22, { align: 'right' })

  doc.setTextColor('#000814')
  doc.setFontSize(22)
  doc.text(doc.splitTextToSize(show.atracao, 170), 20, 54)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor('#555555')
  doc.text(show.genero.nome, 20, 64)

  const linhas = [
    ['Data', formataData(show.dataHora)],
    ['Local', local.nome],
    ['Endereço', `${local.endereco}, ${local.numero}${local.bairro ? ` - ${local.bairro}` : ''} - ${local.cidade}`],
    ['Valor', formataPreco(show.valor)],
    ['Cliente', cliente],
  ]
  let y = 80
  for (const [rotulo, valor] of linhas) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor('#000814')
    doc.text(`${rotulo}:`, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(doc.splitTextToSize(valor, 140), 50, y)
    y += 9
  }

  doc.setDrawColor('#003566')
  doc.roundedRect(20, 130, 170, 130, 3, 3)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Pague com PIX', 105, 142, { align: 'center' })
  doc.addImage(qrCode, 'PNG', 70, 148, 70, 70)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('PIX copia e cola:', 105, 228, { align: 'center' })
  doc.setFont('courier', 'normal')
  doc.text(doc.splitTextToSize(PIX, 150), 105, 235, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor('#555555')
  doc.text('Apresente este ingresso na entrada do evento.', 105, 275, { align: 'center' })

  doc.save(`Ingresso ${show.atracao.replace(/[\\/:*?"<>|]/g, '')}.pdf`)
}
