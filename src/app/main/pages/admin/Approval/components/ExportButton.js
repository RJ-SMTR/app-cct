import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { Menu, MenuItem } from '@mui/material';
import { useMemo, useState } from 'react';
import { Button } from '@mui/base';

function ExportButton({data}) {
    console.log(data)
    const [anchorEl, setAnchorEl] = useState(null);

    
        const reportListData =
             data.rows?.map(report => ({
                Data: report.data,
                Tipo: report.tipo,  
                Operação:report.operacao,
                Valor: report.valor,
            }))
    

    const valorTotal = {
        Data:'Valor Total',
        Tipo:'',
        Operação: '',
        Valor: `R$ ${data.sumTotal}`,
            }
    const valorEntrada = {
        Data:'Valor Entrada',
        Tipo:'',
        Operação: '',
        Valor: `R$ ${data.sumTotalEntry}`,
            }
    const valorSaida = {
        Data:'Valor Saida',
        Tipo:'',
        Operação: '',
        Valor: `R$ ${data.sumTotalExit}`,
            }
    const csvData = [
        ...reportListData,
        valorTotal,
        valorEntrada,
        valorSaida,
    ]
        let dateInicio;
        let dateFim;
    
        if (data.dateRange !== null) {
            dateInicio = data.dateRange[0];
            dateFim = data.dateRange[1];
        }
    
        const csvFilename = useMemo(() => {
            if (dateInicio && dateFim) {
                return `extrato_${format(dateInicio, 'dd-MM-yyyy')}_${format(dateFim, 'dd-MM-yyyy')}.csv`;
            }
            return `extrato_${format(new Date(), 'dd-MM-yyyy')}.csv`; 
        }, [dateInicio, dateFim])
    


      const exportPDF = () => {
            const doc = new jsPDF();
            const tableColumn = ["Data", "Tipo", "Operação", "Valor"];
            const tableRows = [];
    
            data.rows.forEach(report => {
                const reportData = [
                    report.data,
                    report.tipo,
                    report.operacao,
                    report.valor,
                ];
                tableRows.push(reportData);
            });

          let dateInicio;
          let dateFim;

          if (data.dateRange !== null) {
              dateInicio = data.dateRange[0];
              dateFim = data.dateRange[1];
          }
    
            const logoImg = 'assets/icons/logoPrefeitura.png';
            const logoH = 15;
            const logoW = 30;
           
         
    
           
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                margin: {left: 14 , right: 14, top: 60},
                startY: 60,
                didDrawPage: (data) => {
                   
                    doc.addImage(logoImg, 'PNG', 14, 10, logoW, logoH);
    
                   
                    const hrYPosition = 30;
                    doc.setLineWidth(0.3);
                    doc.line(14, hrYPosition, 196, hrYPosition);
    
                   
                    doc.setFontSize(10);
                    doc.text(`Extrato dos dias: ${format(dateInicio, 'dd/MM/yyyy')} a ${format(dateFim, 'dd/MM/yyyy')}`, 14, 45);
    
    
    
                   
                    
                },
            });
    
            const pageCount = doc.internal.getNumberOfPages();
    
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i); 
                doc.setFontSize(10);
    
                const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
                const text = `Página ${currentPage} de ${pageCount}`;
                const xPos = 14; 
                const yPos = doc.internal.pageSize.height - 5;
    
                doc.text(text, xPos, yPos);
            }
    
            const totalValue = `Valor total Movimentado: ${data.sumTotal}`;
            const totalValueEntry = `Valor total Entrada: ${data.sumTotalEntry}`;
            const totalValueExit = `Valor total Saída: ${data.sumTotalExit}`;
            doc.setFontSize(10);
            doc.text(totalValue, 14, doc.internal.pageSize.height - 22);
            doc.text(totalValueEntry, 14, doc.internal.pageSize.height - 17);
            doc.text(totalValueExit, 14, doc.internal.pageSize.height - 12);
    
           
            doc.save(`relatorio_${format(dateInicio, 'dd/MM/yyyy')}_${format(dateFim, 'dd/MM/yyyy')}.pdf`);
        };


    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (option) => {
        setAnchorEl(null);
        if (option === 'csv') {
            document.getElementById('csv-export-link').click();
        } else if (option === 'pdf') {
            exportPDF();
        };
    }
  return (
    <>
       <Button
                                aria-controls="simple-menu"
                                aria-haspopup="true"
                                onClick={handleMenuClick}
                                style={{ marginTop: '20px' }}
                            >
    
                                <svg className="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium muiltr-hgpioi-MuiSvgIcon-root h-[2rem]" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="SaveAltIcon"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"></path></svg> Exportar
    
                            </Button>
      <Menu
                                id="simple-menu"
                                anchorEl={anchorEl}
                                keepMounted
                                open={Boolean(anchorEl)}
                                onClose={() => setAnchorEl(null)}
                            >
                                <MenuItem onClick={() => handleMenuClose('csv')}>CSV</MenuItem>
                                <MenuItem onClick={() => handleMenuClose('pdf')}>PDF</MenuItem>
                            </Menu>
    
                            <CSVLink
                                id="csv-export-link"
                                data={csvData}
                                filename={csvFilename}
                                className="hidden"
    
                            />
    </>
  )
}

export default ExportButton