#!/usr/bin/env python3

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import io
import base64
from datetime import datetime
from typing import Dict, Any, List
import os

class HotiEnergieTechPDFGenerator:
    def __init__(self):
        self.width, self.height = A4
        self.margin = 2 * cm
        self.styles = getSampleStyleSheet()
        
        # Custom styles for HotiEnergieTech branding
        self.styles.add(ParagraphStyle(
            name='HotiTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            textColor=colors.Color(0.17, 0.35, 0.63),  # #2c5aa0
            spaceAfter=12,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='HotiSubtitle',
            parent=self.styles['Heading2'],
            fontSize=12,
            textColor=colors.Color(0.17, 0.35, 0.63),
            spaceAfter=8,
            spaceBefore=16
        ))
        
        self.styles.add(ParagraphStyle(
            name='HotiNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=12
        ))

    def generate_work_report_pdf(self, report_data: Dict[Any, Any], customer_data: Dict[Any, Any]) -> bytes:
        """Generate PDF for work report"""
        buffer = io.BytesIO()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=self.margin,
            leftMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin
        )
        
        story = []
        
        # Header with company info
        self._add_header(story)
        
        # Report title and number
        story.append(Paragraph(f"Arbeitsbericht Nr. {report_data.get('nummer', 'N/A')}", self.styles['HotiTitle']))
        story.append(Spacer(1, 12))
        
        # Customer information table
        self._add_customer_section(story, customer_data)
        
        # Project information
        self._add_project_section(story, report_data)
        
        # Work description
        self._add_work_description(story, report_data)
        
        # Work times table
        if report_data.get('arbeitszeiten'):
            self._add_work_times_table(story, report_data['arbeitszeiten'])
        
        # Materials table
        if report_data.get('materialien'):
            self._add_materials_table(story, report_data['materialien'])
        
        # Photos section
        if report_data.get('fotos'):
            self._add_photos_section(story, report_data['fotos'])
        
        # Final information
        self._add_final_section(story, report_data)
        
        # Signature section
        self._add_signature_section(story, report_data)
        
        # Footer
        self._add_footer(story)
        
        doc.build(story)
        buffer.seek(0)
        
        return buffer.getvalue()

    def _add_header(self, story):
        """Add company header"""
        header_data = [
            [Paragraph("HotiEnergieTec", self.styles['HotiNormal']), Paragraph("Telefon: +43 664 4240335", self.styles['HotiNormal'])],
            [Paragraph("Ihr Profi für Heizung, Sanitär & Klima", self.styles['HotiNormal']), Paragraph("E-Mail: info@hotienergietec.at", self.styles['HotiNormal'])],
            [Paragraph("Promenadegasse 29/3/7, 1170 Wien", self.styles['HotiNormal']), Paragraph("Web: www.hotienergietec.at", self.styles['HotiNormal'])]
        ]
        
        header_table = Table(header_data, colWidths=[10*cm, 8*cm])
        header_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.Color(0.17, 0.35, 0.63)),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(header_table)
        story.append(Spacer(1, 20))

    def _add_customer_section(self, story, customer_data):
        """Add customer information section"""
        story.append(Paragraph("Kundeninformation", self.styles['HotiSubtitle']))
        
        customer_info = [
            [Paragraph("Kunde:", self.styles['HotiNormal']), Paragraph(str(customer_data.get('firmenname', '')), self.styles['HotiNormal']), Paragraph("Ansprechpartner:", self.styles['HotiNormal']), Paragraph(str(customer_data.get('ansprechpartner', '')), self.styles['HotiNormal'])],
            [Paragraph("Straße:", self.styles['HotiNormal']), Paragraph(str(customer_data.get('strasse', '')), self.styles['HotiNormal']), Paragraph("E-Mail:", self.styles['HotiNormal']), Paragraph(str(customer_data.get('email', '')), self.styles['HotiNormal'])],
            [Paragraph("PLZ/Ort:", self.styles['HotiNormal']), Paragraph(f"{customer_data.get('plz', '')} {customer_data.get('ort', '')}", self.styles['HotiNormal']), Paragraph("Telefon:", self.styles['HotiNormal']), Paragraph(str(customer_data.get('telefon', '')), self.styles['HotiNormal'])]
        ]
        
        customer_table = Table(customer_info, colWidths=[3*cm, 6*cm, 3*cm, 6*cm])
        customer_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(customer_table)
        story.append(Spacer(1, 16))

    def _add_project_section(self, story, report_data):
        """Add project information"""
        story.append(Paragraph("Projektinformation", self.styles['HotiSubtitle']))
        
        # Handle erstellt_am field - can be string or datetime object
        erstellt_am = report_data.get('erstellt_am', datetime.now())
        if isinstance(erstellt_am, str):
            erstellt_am = datetime.fromisoformat(erstellt_am)
        elif not isinstance(erstellt_am, datetime):
            erstellt_am = datetime.now()
            
        project_info = [
            [Paragraph("Projektleiter GETEC:", self.styles['HotiNormal']), Paragraph(str(report_data.get('projektleiter', 'info@hotienergietec.at')), self.styles['HotiNormal']), Paragraph("Komm.Nr.:", self.styles['HotiNormal']), Paragraph(str(report_data.get('komm_nr', '')), self.styles['HotiNormal'])],
            [Paragraph("Techniker:", self.styles['HotiNormal']), Paragraph(str(report_data.get('techniker_name', '')), self.styles['HotiNormal']), Paragraph("Datum:", self.styles['HotiNormal']), Paragraph(erstellt_am.strftime('%d.%m.%Y'), self.styles['HotiNormal'])]
        ]
        
        project_table = Table(project_info, colWidths=[4*cm, 7*cm, 3*cm, 4*cm])
        project_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        story.append(project_table)
        story.append(Spacer(1, 16))

    def _add_work_description(self, story, report_data):
        """Add work description section"""
        story.append(Paragraph("Durchgeführte Arbeiten:", self.styles['HotiSubtitle']))
        
        work_text = report_data.get('durchgefuehrte_arbeiten', '')
        story.append(Paragraph(work_text, self.styles['HotiNormal']))
        story.append(Spacer(1, 16))

    def _add_work_times_table(self, story, arbeitszeiten: List[Dict]):
        """Add work times table"""
        story.append(Paragraph("Arbeitszeiten:", self.styles['HotiSubtitle']))
        
        headers = ["Name", "Datum", "Beginn", "Ende", "Pause", "Arbeitszeit", "Wegzeit", "Normal", "Ü50%", "Ü100%"]
        # Wrap headers in Paragraphs to avoid wrapOn errors
        header_paragraphs = [Paragraph(str(header), self.styles['HotiNormal']) for header in headers]
        table_data = [header_paragraphs]
        
        for zeit in arbeitszeiten:
            row_data = [
                zeit.get('name', ''),
                zeit.get('datum', ''),
                zeit.get('beginn', ''),
                zeit.get('ende', ''),
                zeit.get('pause', ''),
                zeit.get('arbeitszeit', ''),
                zeit.get('wegzeit', ''),
                zeit.get('normal', ''),
                zeit.get('ue50', ''),
                zeit.get('ue100', '')
            ]
            # Wrap each cell in a Paragraph to prevent wrapOn errors
            row = [Paragraph(str(cell), self.styles['HotiNormal']) for cell in row_data]
            table_data.append(row)
        
        # Add empty rows if needed
        while len(table_data) < 6:  # At least 5 data rows
            empty_row = [Paragraph('', self.styles['HotiNormal']) for _ in range(10)]
            table_data.append(empty_row)
        
        work_table = Table(table_data, colWidths=[2*cm, 1.8*cm, 1.3*cm, 1.3*cm, 1.2*cm, 1.8*cm, 1.3*cm, 1.3*cm, 1.2*cm, 1.2*cm])
        work_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.17, 0.35, 0.63)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 3),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        
        story.append(work_table)
        story.append(Spacer(1, 16))

    def _add_materials_table(self, story, materialien: List[Dict]):
        """Add materials table"""
        story.append(Paragraph("Material:", self.styles['HotiSubtitle']))
        
        headers = ["Menge", "EH", "Bezeichnung"]
        # Wrap headers in Paragraphs
        header_paragraphs = [Paragraph(str(header), self.styles['HotiNormal']) for header in headers]
        table_data = [header_paragraphs]
        
        for material in materialien:
            row_data = [
                material.get('menge', ''),
                material.get('einheit', ''),
                material.get('bezeichnung', '')
            ]
            # Wrap each cell in a Paragraph
            row = [Paragraph(str(cell), self.styles['HotiNormal']) for cell in row_data]
            table_data.append(row)
        
        # Add empty rows
        while len(table_data) < 8:  # At least 7 data rows
            empty_row = [Paragraph('', self.styles['HotiNormal']) for _ in range(3)]
            table_data.append(empty_row)
        
        material_table = Table(table_data, colWidths=[3*cm, 3*cm, 12*cm])
        material_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.17, 0.35, 0.63)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        story.append(material_table)
        story.append(Spacer(1, 16))

    def _add_photos_section(self, story, fotos: List[Dict]):
        """Add photos section"""
        story.append(Paragraph("Fotos:", self.styles['HotiSubtitle']))
        
        # Create a 2x2 grid for photos
        photo_data = []
        photo_row = []
        
        for i, foto in enumerate(fotos[:4]):  # Maximum 4 photos
            try:
                # Decode base64 image
                image_data = base64.b64decode(foto['data'])
                image_buffer = io.BytesIO(image_data)
                
                # Create image with fixed size
                img = Image(image_buffer, width=7*cm, height=5*cm)
                caption = Paragraph(f"Foto {i+1}: {foto.get('beschreibung', '')}", self.styles['HotiNormal'])
                
                photo_cell = [img, caption]
                photo_row.append(photo_cell)
                
                if len(photo_row) == 2 or i == len(fotos) - 1:
                    photo_data.append(photo_row)
                    photo_row = []
                    
            except Exception as e:
                print(f"Error processing photo {i+1}: {e}")
                continue
        
        # Fill empty cells if needed
        if len(photo_data) > 0 and len(photo_data[-1]) == 1:
            photo_data[-1].append([Paragraph("", self.styles['HotiNormal']), Paragraph("", self.styles['HotiNormal'])])
        
        if photo_data:
            photo_table = Table(photo_data, colWidths=[9*cm, 9*cm])
            photo_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            story.append(photo_table)
        
        story.append(Spacer(1, 16))

    def _add_final_section(self, story, report_data):
        """Add final information section"""
        story.append(Paragraph("Abschluss:", self.styles['HotiSubtitle']))
        
        final_info = [
            [Paragraph("Arbeit abgeschlossen:", self.styles['HotiNormal']), Paragraph("JA" if report_data.get('arbeit_abgeschlossen') else "NEIN", self.styles['HotiNormal']), Paragraph("Verrechnung:", self.styles['HotiNormal']), Paragraph(str(report_data.get('verrechnung', 'Regie')), self.styles['HotiNormal'])],
            [Paragraph("Offene Arbeiten:", self.styles['HotiNormal']), Paragraph(str(report_data.get('offene_arbeiten', '')), self.styles['HotiNormal']), Paragraph("", self.styles['HotiNormal']), Paragraph("", self.styles['HotiNormal'])]
        ]
        
        final_table = Table(final_info, colWidths=[4*cm, 5*cm, 3*cm, 6*cm])
        final_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('SPAN', (1, 1), (3, 1)),  # Span offene Arbeiten across columns
        ]))
        
        story.append(final_table)
        story.append(Spacer(1, 16))

    def _add_signature_section(self, story, report_data):
        """Add signature section"""
        story.append(Paragraph("Unterschriften:", self.styles['HotiSubtitle']))
        
        signature_data = []
        
        # Customer signature
        if report_data.get('unterschrift_kunde'):
            try:
                # Decode signature image
                sig_data = report_data['unterschrift_kunde'].split(',')[1]  # Remove data:image/png;base64,
                image_data = base64.b64decode(sig_data)
                image_buffer = io.BytesIO(image_data)
                
                sig_img = Image(image_buffer, width=6*cm, height=3*cm)
                signature_data.append([Paragraph("Datum:", self.styles['HotiNormal']), Paragraph(datetime.now().strftime('%d.%m.%Y'), self.styles['HotiNormal']), Paragraph("Unterschrift Kunde:", self.styles['HotiNormal']), sig_img])
            except:
                signature_data.append([Paragraph("Datum:", self.styles['HotiNormal']), Paragraph(datetime.now().strftime('%d.%m.%Y'), self.styles['HotiNormal']), Paragraph("Unterschrift Kunde:", self.styles['HotiNormal']), Paragraph("", self.styles['HotiNormal'])])
        else:
            signature_data.append([Paragraph("Datum:", self.styles['HotiNormal']), Paragraph(datetime.now().strftime('%d.%m.%Y'), self.styles['HotiNormal']), Paragraph("Unterschrift Kunde:", self.styles['HotiNormal']), Paragraph("", self.styles['HotiNormal'])])
        
        sig_table = Table(signature_data, colWidths=[2*cm, 3*cm, 4*cm, 9*cm])
        sig_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(sig_table)

    def _add_footer(self, story):
        """Add footer with company information"""
        story.append(Spacer(1, 20))
        
        footer_text = """
        <para alignment="center" fontSize="8" textColor="#666666">
        HotiEnergieTec - Sanitär, Heizung, Klima & Lüftung<br/>
        Promenadegasse 29/3/7, 1170 Wien<br/>
        Tel: +43 664 4240335 | E-Mail: info@hotienergietec.at | Web: www.hotienergietec.at
        </para>
        """
        
        story.append(Paragraph(footer_text, self.styles['Normal']))