
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateAssetTermBase64 = async (employee: any, assets: any[]) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('Termo de Responsabilidade e Recebimento de Equipamentos', 20, 20);

    // Company Info
    doc.setFontSize(10);
    doc.text('MedBeauty S.A.', 20, 30);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35);

    // Employee Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados do Colaborador:', 20, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${employee.full_name}`, 20, 60);
    doc.text(`CPF: ${employee.cpf}`, 20, 67);
    doc.text(`Email: ${employee.email}`, 20, 74);
    doc.text(`Departamento: ${employee.department?.name || 'N/A'}`, 120, 60);
    doc.text(`Cargo: ${employee.position?.title || 'N/A'}`, 120, 67);

    // Assets Table
    doc.text('Equipamentos Recebidos:', 20, 90);

    const tableBody = assets.map(asset => [
        asset.device_type.toUpperCase(),
        asset.asset_tag,
        asset.model,
        asset.serial_number || '-'
    ]);

    autoTable(doc, {
        startY: 95,
        head: [['Tipo', 'Patrimônio', 'Modelo', 'Serial']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [200, 150, 150] } // Rose-goldish
    });

    // Legal Text
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text([
        'Declaro que recebi os equipamentos acima relacionados em perfeito estado de conservação e funcionamento,',
        'assumindo total responsabilidade pelo seu uso e guarda.',
        '',
        'Comprometo-me a:',
        '1. Utilizar os equipamentos exclusivamente para fins profissionais;',
        '2. Comunicar imediatamente qualquer defeito, furto ou roubo;',
        '3. Devolver os equipamentos quando solicitado ou no término do contrato de trabalho.'
    ], 20, finalY);

    // Signature Area
    doc.line(20, finalY + 60, 100, finalY + 60);
    doc.text('Assinatura do Colaborador:', 20, finalY + 65);
    doc.text(employee.full_name, 20, finalY + 70);

    // Return as Base64 (without prefix for API)
    return btoa(doc.output());
};
